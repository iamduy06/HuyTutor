import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { toPublicUserProfile } from '../services/authService';

export const userController = {
  /**
   * GET /api/user/library
   * Lấy danh sách tài liệu trong Tủ sách cá nhân của người dùng hiện tại
   */
  async getLibrary(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ ok: false, error: 'Vui lòng đăng nhập.' });
        return;
      }

      const [libraryItems, allProducts] = await Promise.all([
        dbService.getUserLibrary(req.user.id),
        dbService.getProducts({ includeInactive: true }),
      ]);

      const enriched = libraryItems.map((item) => {
        const matchedProd = allProducts.find(
          (p) =>
            p.slug === item.product_slug ||
            p.id === item.product_slug ||
            p.title === item.product_title
        );
        return {
          ...item,
          thumbnail_url: matchedProd?.thumbnail_url || '',
          cover_tag: matchedProd?.cover_tag || '',
          code: matchedProd?.code || item.product_slug.toUpperCase(),
          sample_pdf_url: item.watermarked_pdf_url || matchedProd?.sample_pdf_url || '',
          preview_images: matchedProd?.preview_images || [],
        };
      });

      res.json({
        ok: true,
        items: enriched,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải Tủ sách cá nhân.',
      });
    }
  },

  /**
   * GET /api/user/orders
   * Lấy lịch sử đơn hàng của người dùng hiện tại
   */
  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ ok: false, error: 'Vui lòng đăng nhập.' });
        return;
      }

      const orders = await dbService.getUserOrders(req.user.id, req.user.email);
      res.json({
        ok: true,
        orders,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải lịch sử đơn hàng.',
      });
    }
  },

  /**
   * PUT /api/user/profile
   * Cập nhật thông tin hồ sơ cá nhân & thông tin xuất hóa đơn mặc định
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ ok: false, error: 'Vui lòng đăng nhập.' });
        return;
      }

      const {
        fullName,
        phone,
        customerGroup,
        schoolOrOrg,
        defaultTaxCccd,
        defaultInvoiceAddress,
      } = req.body;

      const validGroups = ['Giáo viên', 'Học sinh', 'Phụ huynh', 'Khác'] as const;
      const safeGroup = validGroups.includes(customerGroup)
        ? customerGroup
        : req.user.customerGroup;

      const updated = await dbService.updateUser(req.user.id, {
        full_name: fullName ? String(fullName).trim() : req.user.fullName,
        phone: phone !== undefined ? String(phone).trim() : req.user.phone,
        customer_group: safeGroup,
        school_or_org:
          schoolOrOrg !== undefined ? String(schoolOrOrg).trim() : req.user.schoolOrOrg,
        default_tax_cccd:
          defaultTaxCccd !== undefined
            ? String(defaultTaxCccd).trim()
            : req.user.defaultTaxCccd,
        default_invoice_address:
          defaultInvoiceAddress !== undefined
            ? String(defaultInvoiceAddress).trim()
            : req.user.defaultInvoiceAddress,
      });

      if (!updated) {
        res.status(404).json({ ok: false, error: 'Không tìm thấy tài khoản.' });
        return;
      }

      res.json({
        ok: true,
        user: toPublicUserProfile(updated),
        message: 'Đã lưu thông tin hồ sơ tài khoản.',
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi cập nhật hồ sơ.',
      });
    }
  },
};

