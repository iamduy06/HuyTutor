import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { extractOrderCodeFromContent } from '../services/paymentService';
import { submitOrderToGoogleForm } from '../services/googleFormService';

export const webhookController = {
  /**
   * POST /api/webhook/sepay
   * Nhận Webhook thực tế từ SePay khi khách hàng quét mã VietQR thành công.
   * Tự động đối soát mã đơn `HTxxxxx`, cập nhật `paid` và bắn 14 entry vào Google Form nội bộ.
   */
  async handleSepayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const configuredSecret = process.env.SEPAY_WEBHOOK_SECRET;
      const authHeader = req.headers.authorization || '';

      if (
        process.env.NODE_ENV === 'production' &&
        configuredSecret &&
        !configuredSecret.includes('your_sepay') &&
        !authHeader.includes(configuredSecret)
      ) {
        res.status(401).json({ ok: false, error: 'Invalid SePay Webhook Secret' });
        return;
      }

      const content = String(req.body.content || req.body.description || '');
      const transferAmount = Number(req.body.transferAmount || req.body.amount || 0);
      const referenceCode = String(req.body.referenceCode || req.body.id || `SEPAY-${Date.now()}`);

      const orderCode =
        (req.body.orderCode && String(req.body.orderCode).toUpperCase()) ||
        extractOrderCodeFromContent(content);

      if (!orderCode) {
        res.status(200).json({
          ok: true,
          ignored: true,
          reason: 'Không tìm thấy mã đơn hàng HTxxxxx trong nội dung chuyển khoản.',
        });
        return;
      }

      const order = await dbService.getOrderByCode(orderCode);
      if (!order) {
        res.status(404).json({
          ok: false,
          error: `Không tìm thấy đơn hàng ${orderCode} trong hệ thống.`,
        });
        return;
      }

      if (order.payment_status === 'paid') {
        res.status(200).json({
          ok: true,
          message: 'Đơn hàng đã được ghi nhận thanh toán trước đó.',
          orderCode: order.order_code,
          paymentStatus: 'paid',
        });
        return;
      }

      if (transferAmount > 0 && transferAmount < order.total_amount) {
        res.status(400).json({
          ok: false,
          error: `Số tiền chuyển khoản (${transferAmount}đ) nhỏ hơn tổng tiền đơn hàng (${order.total_amount}đ).`,
        });
        return;
      }

      const updatedOrder = await dbService.updateOrderStatus(order.order_code, {
        payment_status: 'paid',
        payment_ref_id: referenceCode,
        paid_at: new Date().toISOString(),
      });

      const formSyncResult = await submitOrderToGoogleForm(updatedOrder || order);

      res.json({
        ok: true,
        orderCode: order.order_code,
        paymentStatus: 'paid',
        googleFormSync: formSyncResult,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi xử lý SePay Webhook.',
      });
    }
  },

  /**
   * POST /api/webhook/paypal
   * Nhận xác nhận thanh toán quốc tế từ PayPal (IP Quốc tế)
   * Cập nhật đơn hàng `paid` và tự động bắn 14 entry vào Google Form nội bộ.
   */
  async handlePaypalWebhook(req: Request, res: Response): Promise<void> {
    try {
      const orderCode = String(
        req.body.orderCode ||
          req.body.resource?.purchase_units?.[0]?.custom_id ||
          req.body.resource?.custom_id ||
          ''
      )
        .trim()
        .toUpperCase();

      const paypalTxId = String(
        req.body.paypalTransactionId || req.body.resource?.id || `PAYPAL-${Date.now()}`
      );

      if (!orderCode) {
        res.status(400).json({
          ok: false,
          error: 'Thiếu mã đơn hàng orderCode trong PayPal payload.',
        });
        return;
      }

      const order = await dbService.getOrderByCode(orderCode);
      if (!order) {
        res.status(404).json({
          ok: false,
          error: `Không tìm thấy đơn hàng ${orderCode}.`,
        });
        return;
      }

      if (order.payment_status === 'paid') {
        res.status(200).json({
          ok: true,
          message: 'Đơn hàng đã được ghi nhận thanh toán trước đó.',
          orderCode: order.order_code,
          paymentStatus: 'paid',
        });
        return;
      }

      const updatedOrder = await dbService.updateOrderStatus(order.order_code, {
        payment_status: 'paid',
        payment_ref_id: paypalTxId,
        paid_at: new Date().toISOString(),
      });

      const formSyncResult = await submitOrderToGoogleForm(updatedOrder || order);

      res.json({
        ok: true,
        orderCode: order.order_code,
        paymentStatus: 'paid',
        googleFormSync: formSyncResult,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi xử lý PayPal Webhook.',
      });
    }
  },

  /**
   * POST /api/webhook/simulate-payment
   * Endpoint hỗ trợ kiểm thử nhanh luồng Thanh toán thành công -> Bắn 14 entry Google Form -> Cấp quyền
   */
  async simulatePaymentSuccess(req: Request, res: Response): Promise<void> {
    try {
      const { orderCode } = req.body;
      if (!orderCode) {
        res.status(400).json({ ok: false, error: 'Vui lòng truyền orderCode.' });
        return;
      }

      const order = await dbService.getOrderByCode(String(orderCode));
      if (!order) {
        res.status(404).json({
          ok: false,
          error: `Không tìm thấy đơn hàng ${orderCode}.`,
        });
        return;
      }

      const updatedOrder = await dbService.updateOrderStatus(order.order_code, {
        payment_status: 'paid',
        payment_ref_id: `SIMULATED-${Date.now()}`,
        paid_at: new Date().toISOString(),
      });

      const formSyncResult = await submitOrderToGoogleForm(updatedOrder || order);

      res.json({
        ok: true,
        order: await dbService.getOrderByCode(order.order_code),
        googleFormSync: formSyncResult,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi giả lập xác nhận thanh toán.',
      });
    }
  },
};
