import crypto from 'crypto';
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
      const signatureHeader = (req.headers['x-sepay-signature'] as string) || '';
      const timestampHeader = (req.headers['x-sepay-timestamp'] as string) || '';
      const authHeader = (req.headers.authorization || '').trim();

      if (configuredSecret && !configuredSecret.includes('your_sepay')) {
        let isAuthenticated = false;

        // 1. Phương thức xác thực HMAC-SHA256 (SePay khuyến nghị sử dụng)
        if (signatureHeader && timestampHeader) {
          const timestampNum = parseInt(timestampHeader, 10);
          const nowSeconds = Math.floor(Date.now() / 1000);

          // Chống tấn công phát lại (Replay Attack): Cho phép sai lệch tối đa 5 phút (300 giây)
          if (!isNaN(timestampNum) && Math.abs(nowSeconds - timestampNum) <= 300) {
            const rawBody = (req as any).rawBody
              ? (req as any).rawBody.toString('utf8')
              : JSON.stringify(req.body);
            const signedPayload = timestampHeader + '.' + rawBody;
            const expectedHash = crypto
              .createHmac('sha256', configuredSecret)
              .update(signedPayload)
              .digest('hex');
            const providedHash = signatureHeader.replace(/^sha256=/, '').trim();

            const bufExpected = Buffer.from(expectedHash, 'hex');
            const bufProvided = Buffer.from(providedHash, 'hex');

            if (
              bufExpected.length === bufProvided.length &&
              crypto.timingSafeEqual(bufExpected, bufProvided)
            ) {
              isAuthenticated = true;
            }
          }
        }

        // 2. Phương thức xác thực API Key dự phòng (Authorization: Apikey <secret>)
        if (!isAuthenticated && authHeader) {
          const cleanAuth = authHeader.replace(/^Apikey\s+/i, '').replace(/^Bearer\s+/i, '').trim();
          if (
            cleanAuth.length === configuredSecret.length &&
            crypto.timingSafeEqual(Buffer.from(cleanAuth), Buffer.from(configuredSecret))
          ) {
            isAuthenticated = true;
          }
        }

        if (!isAuthenticated) {
          console.warn('[SePay Webhook] Xác thực thất bại: Chữ ký HMAC-SHA256 hoặc API Key không khớp.');
          res.status(401).json({ ok: false, error: 'Invalid SePay Webhook Secret' });
          return;
        }
      }

      const content = String(req.body.content || req.body.description || '');
      const transferAmount = Number(req.body.transferAmount || req.body.amount || 0);
      const referenceCode = String(req.body.referenceCode || req.body.id || `SEPAY-${Date.now()}`);

      let orderCode =
        (req.body.orderCode && String(req.body.orderCode).toUpperCase()) ||
        extractOrderCodeFromContent(content);

      // Dự phòng: nếu khách hàng chỉ nhập dãy số 10-16 số mà không ghi tiền tố DH
      if (!orderCode) {
        const rawDigitsMatch = content.match(/\b\d{10,16}\b/);
        if (rawDigitsMatch) {
          const prefix = (process.env.ORDER_CODE_PREFIX || 'DH').toUpperCase();
          orderCode = `${prefix}${rawDigitsMatch[0]}`;
        }
      }

      if (!orderCode) {
        res.status(200).json({
          ok: true,
          ignored: true,
          reason: 'Không tìm thấy mã đơn hàng trong nội dung chuyển khoản.',
        });
        return;
      }

      const order = await dbService.getOrderByCode(orderCode);
      if (!order) {
        console.warn(`[SePay Webhook] Không tìm thấy đơn hàng "${orderCode}" trong hệ thống (content: "${content}").`);
        // QUAN TRỌNG: Trả về HTTP 200 kèm ignored: true để SePay xác nhận webhook đã nhận thành công,
        // tránh SePay hiểu nhầm URL endpoint bị 404 (Not Found) và spam retry liên tục.
        res.status(200).json({
          ok: false,
          ignored: true,
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

      // SEC-04: Bắt buộc số tiền chuyển khoản phải đủ thanh toán đơn hàng
      if (transferAmount < order.total_amount) {
        res.status(400).json({
          ok: false,
          error: `Số tiền chuyển khoản (${transferAmount}đ) không đủ để thanh toán đơn hàng (${order.total_amount}đ).`,
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
      // SEC-03: Kiểm tra khóa bí mật xác thực nguồn gốc từ PayPal nếu đã cấu hình
      const configuredSecret = process.env.PAYPAL_WEBHOOK_SECRET;
      const incomingSecret =
        (req.headers['x-paypal-webhook-secret'] as string) ||
        (req.headers.authorization as string) ||
        '';

      if (configuredSecret) {
        const isSecretValid =
          incomingSecret.length === configuredSecret.length &&
          crypto.timingSafeEqual(Buffer.from(incomingSecret), Buffer.from(configuredSecret));
        if (!isSecretValid) {
          res.status(401).json({ ok: false, error: 'Unauthorized PayPal Webhook signature.' });
          return;
        }
      }

      const orderCode = String(
        req.body.orderCode ||
          req.body.resource?.purchase_units?.[0]?.custom_id ||
          req.body.resource?.purchase_units?.[0]?.invoice_id ||
          req.body.resource?.purchase_units?.[0]?.invoice_number ||
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
};
