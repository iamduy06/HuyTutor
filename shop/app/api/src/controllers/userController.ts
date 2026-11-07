import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { toPublicUserProfile } from '../services/authService';
import { GOOGLE_FORM_CUSTOMER_GROUPS } from '../services/googleFormService';

export const userController = {
  /**
   * GET /api/user/library
   * Lấy danh sách tài liệu trong Tủ sách cá nhân của người dùng hiện tại
   * Tự động bổ sung access_drive_url từ product_formats nếu đơn hàng cũ chưa kịp lưu link
   */
  async getLibrary(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ ok: false, error: 'Vui lòng đăng nhập.' });
        return;
      }

      const [libraryItems, allProducts, userOrders] = await Promise.all([
        dbService.getUserLibrary(req.user.id),
        dbService.getProducts({ includeInactive: true }),
        dbService.getUserOrders(req.user.id, req.user.email),
      ]);

      const enriched = libraryItems.map((item) => {
        const cleanSlug = String(item.product_slug || '').toLowerCase().trim();
        const matchedProd = allProducts.find(
          (p) =>
            (p.slug && String(p.slug).toLowerCase().trim() === cleanSlug) ||
            (p.id && String(p.id).toLowerCase().trim() === cleanSlug) ||
            p.title === item.product_title
        );
        const matchedFormat = matchedProd?.formats?.find(
          (f: any) => f.format_code === item.format_code
        );
        const resolvedDriveUrl = item.access_drive_url || matchedFormat?.drive_url || '';
        const fallbackPrice = Number(matchedFormat?.price || 0);

        // Tính toán số tiền thực tế khách đã thanh toán cho tài liệu này từ lịch sử đơn hàng
        let paidAmount = fallbackPrice;
        const matchedOrder = userOrders.find(
          (o) =>
            o.payment_status === 'paid' &&
            ((item.order_code && o.order_code === item.order_code) ||
              (item.order_id && o.id === item.order_id) ||
              (Array.isArray(o.items) &&
                o.items.some(
                  (it) =>
                    ((it.product_id || '').toLowerCase().trim() === cleanSlug ||
                      (it.product_title || '').trim() === (item.product_title || '').trim()) &&
                    it.format_code === item.format_code
                )))
        );

        if (matchedOrder && Array.isArray(matchedOrder.items)) {
          const orderItem = matchedOrder.items.find(
            (it) =>
              ((it.product_id || '').toLowerCase().trim() === cleanSlug ||
                (it.product_title || '').trim() === (item.product_title || '').trim()) &&
              it.format_code === item.format_code
          );
          const baseItemPrice = orderItem ? Number(orderItem.unit_price) : fallbackPrice;

          const actualOrderPaid =
            typeof matchedOrder.final_amount === 'number'
              ? matchedOrder.final_amount
              : typeof matchedOrder.total_amount === 'number'
              ? matchedOrder.total_amount
              : -1;

          // Nếu đơn hàng chỉ có duy nhất 1 sản phẩm, lấy trực tiếp số tiền thực tế khách đã trả (loại bỏ hoàn toàn sai số làm tròn %)
          if (matchedOrder.items.length === 1 && actualOrderPaid >= 0) {
            paidAmount = actualOrderPaid;
          } else {
            let discountRate = 0;
            // Ưu tiên tính từ discount_amount / subtotal_amount để đảm bảo độ chính xác toán học tuyệt đối
            if (
              typeof matchedOrder.discount_amount === 'number' &&
              matchedOrder.discount_amount > 0 &&
              typeof matchedOrder.subtotal_amount === 'number' &&
              matchedOrder.subtotal_amount > 0
            ) {
              discountRate = matchedOrder.discount_amount / matchedOrder.subtotal_amount;
            } else if (
              typeof matchedOrder.discount_percent === 'number' &&
              matchedOrder.discount_percent > 0
            ) {
              discountRate = matchedOrder.discount_percent / 100;
            }
            paidAmount = Math.max(0, Math.round(baseItemPrice * (1 - discountRate)));
          }
        }

        return {
          ...item,
          access_drive_url: resolvedDriveUrl,
          thumbnail_url: matchedProd?.thumbnail_url || '',
          cover_tag: matchedProd?.cover_tag || '',
          code: matchedProd?.code || item.product_slug.toUpperCase(),
          sample_pdf_url: item.watermarked_pdf_url || matchedProd?.sample_pdf_url || '',
          preview_images: matchedProd?.preview_images || [],
          paid_amount: paidAmount,
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

      const isGroupValid =
        (GOOGLE_FORM_CUSTOMER_GROUPS as readonly string[]).includes(customerGroup) ||
        ['Giáo viên', 'Khác'].includes(customerGroup);
      const safeGroup = isGroupValid ? customerGroup : req.user.customerGroup;

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
