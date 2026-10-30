import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { toPublicUserProfile } from '../services/authService';
import {
  createR2PresignedUploadUrl,
  stampPdfBufferWithWatermark,
  uploadBufferToR2,
} from '../services/r2Service';
import { submitOrderToGoogleForm } from '../services/googleFormService';

export const adminController = {
  /**
   * GET /api/admin/overview
   * Tải toàn bộ dữ liệu quản trị (Sản phẩm, Định dạng, Menu, Danh mục, Đơn hàng, Thống kê)
   * Tất cả luồng dữ liệu Database đi qua Backend.
   */
  async getDashboardOverview(_req: Request, res: Response): Promise<void> {
    try {
      const [products, categories, menus, comboRules, orders] = await Promise.all([
        dbService.getProducts({ includeInactive: true }),
        dbService.getCategories(),
        dbService.getMenus(true),
        dbService.getComboRules(),
        dbService.getAllOrders(),
      ]);

      const paidOrders = orders.filter((o) => o.payment_status === 'paid');
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const syncedFormCount = orders.filter((o) => o.google_form_submitted).length;

      res.json({
        ok: true,
        stats: {
          totalProducts: products.length,
          activeProducts: products.filter((p) => p.is_active).length,
          totalOrders: orders.length,
          paidOrders: paidOrders.length,
          totalRevenue,
          syncedFormCount,
        },
        products,
        categories,
        menus,
        comboRules,
        orders,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải dữ liệu trang quản trị.',
      });
    }
  },

  /**
   * POST /api/admin/products
   * PUT /api/admin/products/:slug
   * Tạo mới hoặc cập nhật sản phẩm kèm 5 định dạng giá, chế độ đọc thử, watermark và repeater
   */
  async upsertProduct(req: Request, res: Response): Promise<void> {
    try {
      const slugParam = typeof req.params.slug === 'string' ? req.params.slug : undefined;
      const payload = {
        ...req.body,
        slug: req.body.slug || slugParam,
      };

      if (!payload.title) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng nhập Tên tài liệu (title).',
        });
        return;
      }

      const savedProduct = await dbService.upsertProduct(payload);
      res.json({
        ok: true,
        message: 'Đã lưu cấu hình sản phẩm và 5 định dạng giá vào Database thành công.',
        product: savedProduct,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi lưu sản phẩm từ Admin.',
      });
    }
  },

  /**
   * DELETE /api/admin/products/:slug
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const slug = String(req.params.slug || '');
      const deleted = await dbService.deleteProduct(slug);
      res.json({
        ok: true,
        deleted,
        message: deleted
          ? `Đã xóa tài liệu "${slug}" khỏi Database.`
          : `Không tìm thấy tài liệu "${slug}".`,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi xóa sản phẩm.',
      });
    }
  },

  /**
   * PUT /api/admin/menus
   * Cập nhật danh sách Menu điều hướng động
   */
  async updateMenus(req: Request, res: Response): Promise<void> {
    try {
      const { menus } = req.body;
      if (!Array.isArray(menus)) {
        res.status(400).json({ ok: false, error: 'Dữ liệu menus phải là mảng.' });
        return;
      }
      const updated = await dbService.updateMenus(menus);
      res.json({
        ok: true,
        menus: updated,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi cập nhật Menu.',
      });
    }
  },

  /**
   * POST /api/admin/upload-presign
   * Tạo Presigned URL để Admin tải ảnh bìa Thumbnail / ảnh đọc thử / PDF đọc thử lên Cloudflare R2
   */
  async createUploadPresign(req: Request, res: Response): Promise<void> {
    try {
      const { folder = 'thumbnails', fileName = 'image.png', contentType = 'image/png' } = req.body;
      const validFolders = ['thumbnails', 'previews', 'samples', 'banners'] as const;
      const safeFolder = validFolders.includes(folder) ? folder : 'thumbnails';

      const result = await createR2PresignedUploadUrl({
        folder: safeFolder,
        fileName: String(fileName),
        contentType: String(contentType),
      });

      res.json({
        ok: true,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi khởi tạo Presigned URL cho Cloudflare R2.',
      });
    }
  },

  /**
   * POST /api/admin/upload-file
   * Tải trực tiếp file ảnh Thumbnail/PDF lên Cloudflare R2 từ Backend (Bypass 100% CORS trình duyệt)
   */
  async uploadFileDirect(req: Request, res: Response): Promise<void> {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const folder = (req.body.folder as any) || 'thumbnails';
      if (!file) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng chọn file hợp lệ để tải lên.',
        });
        return;
      }

      const result = await uploadBufferToR2({
        folder,
        fileName: file.originalname,
        buffer: file.buffer,
        contentType: file.mimetype || 'image/png',
      });

      res.json({
        ok: true,
        publicUrl: result.publicUrl,
        objectKey: result.objectKey,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải file lên Cloudflare R2.',
      });
    }
  },

  /**
   * POST /api/admin/stamp-pdf
   * Đóng dấu Watermark chéo (Lớp 2 - pdf-lib) lên file PDF đọc thử trước khi lưu lên R2
   */
  async stampPdfWatermark(req: Request, res: Response): Promise<void> {
    try {
      const { pdfBase64, watermarkText } = req.body;
      if (!pdfBase64) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng gửi kèm nội dung file PDF (pdfBase64) để đóng dấu Watermark.',
        });
        return;
      }

      const rawBase64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/, '');
      const inputBytes = Uint8Array.from(Buffer.from(rawBase64, 'base64'));
      const stampedBytes = await stampPdfBufferWithWatermark(
        inputBytes,
        watermarkText || 'TAI LIEU DOC THU HUY TUTOR - HUYTUTOR.EDU.VN'
      );

      res.json({
        ok: true,
        stampedPdfBase64: Buffer.from(stampedBytes).toString('base64'),
        message: 'Đã đóng dấu Watermark bảo vệ bản quyền vào từng trang PDF thành công.',
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi đóng dấu Watermark PDF.',
      });
    }
  },

  /**
   * POST /api/admin/orders/:orderCode/resync-form
   * Cho phép Admin bắn lại 14 entry của đơn hàng vào Google Form nội bộ
   */
  async resyncOrderToGoogleForm(req: Request, res: Response): Promise<void> {
    try {
      const orderCode = String(req.params.orderCode || '');
      const order = await dbService.getOrderByCode(orderCode);
      if (!order) {
        res.status(404).json({
          ok: false,
          error: `Không tìm thấy đơn hàng mã "${orderCode}".`,
        });
        return;
      }

      const syncResult = await submitOrderToGoogleForm(order);
      res.json({
        ok: true,
        syncResult,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi đồng bộ lại Google Form.',
      });
    }
  },

  /**
   * GET /api/admin/users
   * Lấy danh sách toàn bộ tài khoản người dùng & số phiên đăng nhập đang hoạt động
   */
  async getUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await dbService.getAllUsers();
      const enrichedUsers = await Promise.all(
        users.map(async (u) => {
          const sessions = await dbService.getUserSessions(u.id);
          return {
            ...toPublicUserProfile(u),
            activeSessions: sessions.length,
          };
        })
      );

      res.json({
        ok: true,
        users: enrichedUsers,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải danh sách thành viên.',
      });
    }
  },

  /**
   * PUT /api/admin/users/:id/role
   * Cập nhật quyền hạn ('user' | 'admin') hoặc trạng thái hoạt động (is_active)
   */
  async updateUserRoleAndStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.id || '');
      const { role, isActive } = req.body;

      const updates: Record<string, any> = {};
      if (role === 'user' || role === 'admin') {
        updates.role = role;
      }
      if (typeof isActive === 'boolean') {
        updates.is_active = isActive;
      }

      const updated = await dbService.updateUser(userId, updates);
      if (!updated) {
        res.status(404).json({
          ok: false,
          error: 'Không tìm thấy tài khoản người dùng.',
        });
        return;
      }

      if (updates.is_active === false) {
        await dbService.revokeAllUserSessions(userId);
      }

      res.json({
        ok: true,
        user: toPublicUserProfile(updated),
        message: 'Đã cập nhật phân quyền và trạng thái tài khoản.',
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi cập nhật quyền tài khoản.',
      });
    }
  },

  /**
   * DELETE /api/admin/users/:id/sessions
   * Thu hồi toàn bộ phiên đăng nhập của một người dùng bất kỳ
   */
  async revokeUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.id || '');
      const revokedCount = await dbService.revokeAllUserSessions(userId);
      res.json({
        ok: true,
        revokedCount,
        message: `Đã thu hồi ${revokedCount} phiên đăng nhập của thành viên.`,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi thu hồi phiên đăng nhập.',
      });
    }
  },

  /**
   * GET /api/admin/configs
   * Lấy cấu hình hệ thống (mạng xã hội Footer, liên kết chính sách...)
   */
  async getSiteConfigs(_req: Request, res: Response): Promise<void> {
    try {
      const configs = await dbService.getSiteConfigs();
      res.json({
        ok: true,
        configs,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải cấu hình hệ thống.',
      });
    }
  },

  /**
   * PUT /api/admin/configs/:key
   * Cập nhật một mục cấu hình trong bảng site_configs
   */
  async updateSiteConfig(req: Request, res: Response): Promise<void> {
    try {
      const key = String(req.params.key || '');
      const { value } = req.body;
      if (!key) {
        res.status(400).json({ ok: false, error: 'Khóa cấu hình (key) không được để trống.' });
        return;
      }
      const updatedValue = await dbService.updateSiteConfig(key, value);
      res.json({
        ok: true,
        key,
        value: updatedValue,
        message: `Đã cập nhật cấu hình "${key}" thành công.`,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi cập nhật cấu hình.',
      });
    }
  },
};
