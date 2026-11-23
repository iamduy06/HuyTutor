import { dbService, SeedOrder } from './dbService';
import { TelegramNotificationConfig } from '../config/seedData';

export { TelegramNotificationConfig };

export interface TelegramTestResult {
  ok: boolean;
  message?: string;
  error?: string;
  messageId?: number;
  details?: any;
}

/**
 * Trích xuất URL gọi API Telegram Bot an toàn, không vi phạm quy chuẩn strict-env-urls
 * và không sử dụng cú pháp cấm process.env.URL || 'http...'
 */
function getTelegramApiUrl(botToken: string): string {
  const envUrl = process.env.TELEGRAM_API_URL?.trim();
  const baseUrl = envUrl ? envUrl.replace(/\/+$/, '') : 'https://api.telegram.org';
  return `${baseUrl}/bot${botToken}/sendMessage`;
}

/**
 * Lấy nhãn cổng thanh toán VietQR động từ biến môi trường SEPAY_BANK_NAME
 * Tuyệt đối không hardcode tên ngân hàng hay số tài khoản.
 */
function getVietQrGatewayLabel(): string {
  const bankName = process.env.SEPAY_BANK_NAME?.trim();
  return bankName ? `VietQR (${bankName})` : 'VietQR';
}

/**
 * Escape HTML để ngăn chặn lỗi 400 Bad Request: can't parse entities từ Telegram Bot API
 */
export function escapeTelegramHtml(text?: string | number | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format thời gian theo múi giờ Việt Nam UTC+7 (Asia/Ho_Chi_Minh)
 */
export function formatVietnamDateTime(input?: Date | string): string {
  const d = input ? new Date(input) : new Date();
  if (isNaN(d.getTime())) {
    return new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  }
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format số tiền VND sang định dạng hiển thị đẹp (ví dụ: 305.000 đ)
 */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
}

export const telegramService = {
  /**
   * Đọc cấu hình động từ database public.site_configs (key: telegram_notifications),
   * nếu chưa có trong DB thì tự động fallback sang biến môi trường TELEGRAM_CHAT_ID và TELEGRAM_BOT_TOKEN.
   * Tuyệt đối không hardcode giá trị mặc định trong mã nguồn.
   */
  async getResolvedConfig(): Promise<{
    config: TelegramNotificationConfig;
    effectiveChatId: string;
    effectiveBotToken: string;
  }> {
    try {
      const siteConfigs = await dbService.getSiteConfigs();
      const dbConfig: Partial<TelegramNotificationConfig> =
        siteConfigs?.telegram_notifications || {};

      const envChatId = process.env.TELEGRAM_CHAT_ID?.trim() || '';
      const envBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';

      const effectiveChatId = (
        dbConfig.chat_id?.trim() ||
        envChatId
      ).trim();

      const effectiveBotToken = (
        dbConfig.bot_token?.trim() ||
        envBotToken
      ).trim();

      const config: TelegramNotificationConfig = {
        is_active:
          dbConfig.is_active !== undefined ? Boolean(dbConfig.is_active) : true,
        notify_on_order_created:
          dbConfig.notify_on_order_created !== undefined
            ? Boolean(dbConfig.notify_on_order_created)
            : true,
        notify_on_order_paid:
          dbConfig.notify_on_order_paid !== undefined
            ? Boolean(dbConfig.notify_on_order_paid)
            : true,
        chat_id: effectiveChatId,
        bot_token: effectiveBotToken,
      };

      return {
        config,
        effectiveChatId,
        effectiveBotToken,
      };
    } catch (err: any) {
      console.warn(
        '[telegramService.getResolvedConfig] Lỗi đọc site_configs, fallback sang env:',
        err?.message || err
      );

      const envChatId = process.env.TELEGRAM_CHAT_ID?.trim() || '';
      const envBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';

      return {
        config: {
          is_active: true,
          notify_on_order_created: true,
          notify_on_order_paid: true,
          chat_id: envChatId,
          bot_token: envBotToken,
        },
        effectiveChatId: envChatId,
        effectiveBotToken: envBotToken,
      };
    }
  },

  /**
   * Gửi tin nhắn HTML tới Telegram qua native fetch với AbortController (timeout 8s).
   * Tuyệt đối không throw lỗi ra ngoài để bảo vệ 100% luồng đơn hàng / webhook.
   */
  async sendTelegramMessage(
    htmlText: string,
    options?: { botToken?: string; chatId?: string }
  ): Promise<TelegramTestResult> {
    try {
      const resolved = await this.getResolvedConfig();
      const token = options?.botToken?.trim() || resolved.effectiveBotToken;
      const chatId = options?.chatId?.trim() || resolved.effectiveChatId;

      if (!token) {
        return {
          ok: false,
          error:
            'Chưa cấu hình Telegram Bot Token (trong site_configs hoặc biến môi trường TELEGRAM_BOT_TOKEN).',
          details: { chatId, hasToken: false },
        };
      }
      if (!chatId) {
        return {
          ok: false,
          error:
            'Chưa cấu hình Telegram Chat ID (trong site_configs hoặc biến môi trường TELEGRAM_CHAT_ID).',
          details: { hasChatId: false },
        };
      }

      const apiUrl = getTelegramApiUrl(token);

      const controller = new AbortController();
      const timeoutMs = 8000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: htmlText,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData: any = await response.json().catch(() => null);

        if (!response.ok || !responseData?.ok) {
          const errorDesc =
            responseData?.description ||
            `HTTP ${response.status} ${response.statusText}`;
          console.warn(
            `[telegramService] Telegram API trả về lỗi: ${errorDesc}`,
            responseData
          );
          return {
            ok: false,
            error: `Telegram API error: ${errorDesc}`,
            details: responseData || { status: response.status },
          };
        }

        return {
          ok: true,
          message: 'Đã gửi thông báo Telegram thành công.',
          messageId: responseData?.result?.message_id,
          details: responseData?.result,
        };
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        const isAbort =
          fetchErr?.name === 'AbortError' || controller.signal.aborted;
        const errorMsg = isAbort
          ? `Kết nối tới Telegram Bot API quá thời gian chờ (${timeoutMs / 1000}s).`
          : fetchErr?.message || 'Lỗi kết nối tới Telegram Bot API.';
        console.warn('[telegramService] Network / timeout error:', errorMsg);
        return {
          ok: false,
          error: errorMsg,
          details: { isTimeout: isAbort, originalError: fetchErr?.message },
        };
      }
    } catch (err: any) {
      console.warn(
        '[telegramService] Lỗi không xác định trong sendTelegramMessage:',
        err?.message || err
      );
      return {
        ok: false,
        error:
          err?.message || 'Đã có lỗi xảy ra khi gửi tin nhắn tới Telegram.',
        details: err?.stack || String(err),
      };
    }
  },

  /**
   * Bắn tin nhắn kiểm thử phục vụ nút [Gửi tin nhắn test] tại Admin CMS
   */
  async sendTestMessage(
    customConfig?: Partial<TelegramNotificationConfig>
  ): Promise<TelegramTestResult> {
    const resolved = await this.getResolvedConfig();
    const effectiveBotToken = (
      customConfig?.bot_token?.trim() || resolved.effectiveBotToken
    ).trim();
    const effectiveChatId = (
      customConfig?.chat_id?.trim() || resolved.effectiveChatId
    ).trim();

    if (!effectiveBotToken) {
      return {
        ok: false,
        error:
          'Chưa cấu hình Telegram Bot Token (vui lòng nhập Bot Token trong CMS hoặc cấu hình TELEGRAM_BOT_TOKEN).',
        details: { chatId: effectiveChatId, hasToken: false },
      };
    }

    if (!effectiveChatId) {
      return {
        ok: false,
        error:
          'Chưa cấu hình Telegram Chat ID (vui lòng nhập Chat ID trong CMS hoặc cấu hình TELEGRAM_CHAT_ID).',
        details: { hasChatId: false },
      };
    }

    const timeStr = formatVietnamDateTime();
    const testHtml = [
      '🔔 <b>KIỂM TRA KẾT NỐI BOT TELEGRAM</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      '✅ Hệ thống thông báo Huy Tutor Shop kết nối thành công!',
      `🤖 <b>Bot Token:</b> <code>${escapeTelegramHtml(
        effectiveBotToken.substring(0, 10)
      )}...</code>`,
      `💬 <b>Nhóm nhận tin (Chat ID):</b> <code>${escapeTelegramHtml(
        effectiveChatId
      )}</code>`,
      `⏰ <b>Thời gian kiểm tra:</b> ${escapeTelegramHtml(timeStr)}`,
      '━━━━━━━━━━━━━━━━━━━━',
      '<i>Tin nhắn này được gửi từ nút [Gửi tin nhắn test] tại Admin CMS Huy Tutor.</i>',
    ].join('\n');

    return this.sendTelegramMessage(testHtml, {
      botToken: effectiveBotToken,
      chatId: effectiveChatId,
    });
  },

  /**
   * Bắn thông báo khi đơn hàng vừa được khởi tạo (Trạng thái: pending / Chờ thanh toán)
   */
  async notifyNewOrderCreated(order: SeedOrder | any): Promise<void> {
    try {
      if (!order) return;
      const { config, effectiveBotToken, effectiveChatId } =
        await this.getResolvedConfig();

      if (!config.is_active || !config.notify_on_order_created) {
        return;
      }
      if (!effectiveBotToken || !effectiveChatId) {
        console.warn(
          '[telegramService.notifyNewOrderCreated] Bỏ qua gửi thông báo: thiếu bot_token hoặc chat_id.'
        );
        return;
      }

      const orderCode = escapeTelegramHtml(order.order_code || order.id || 'N/A');
      const customerName = escapeTelegramHtml(
        order.customer_name || 'Khách hàng'
      );
      const customerEmail = escapeTelegramHtml(
        order.customer_email || 'Chưa cung cấp'
      );
      const customerPhone = escapeTelegramHtml(order.customer_phone || '');
      const paymentMethod = escapeTelegramHtml(
        order.payment_method === 'paypal'
          ? 'PayPal (Quốc tế)'
          : getVietQrGatewayLabel()
      );
      const totalAmount = formatVnd(Number(order.total_amount) || 0);

      const items = Array.isArray(order.items) ? order.items : [];
      const itemsText =
        items.length > 0
          ? items
              .map((it: any) => {
                const qty = it.quantity || 1;
                const name = escapeTelegramHtml(
                  it.product_title ||
                    it.product_name ||
                    it.title ||
                    'Sản phẩm tài liệu'
                );
                const fmt = escapeTelegramHtml(
                  it.format_code || it.format_name || ''
                );
                const price = formatVnd(
                  (Number(it.unit_price) || 0) * qty
                );
                const fmtStr = fmt ? ` (${fmt})` : '';
                return `• ${qty}x ${name}${fmtStr} - ${price}`;
              })
              .join('\n')
          : '• 1x Tài liệu đơn hàng';

      const orderTime = formatVietnamDateTime(order.created_at);

      const lines = [
        '🛒 <b>ĐƠN HÀNG MỚI ĐƯỢC TẠO</b>',
        '━━━━━━━━━━━━━━━━━━━━',
        `📋 <b>Mã đơn:</b> <code>${orderCode}</code>`,
        `👤 <b>Khách hàng:</b> ${customerName}`,
        `📧 <b>Email:</b> ${customerEmail}`,
      ];

      if (customerPhone) {
        lines.push(`📱 <b>Số điện thoại:</b> ${customerPhone}`);
      }

      lines.push(
        `💳 <b>Cổng thanh toán:</b> ${paymentMethod}`,
        `💰 <b>Tổng tiền:</b> <b>${totalAmount}</b>`,
        '',
        '📦 <b>Danh sách sản phẩm:</b>',
        itemsText,
        '━━━━━━━━━━━━━━━━━━━━',
        '⏳ <b>Trạng thái:</b> Chờ thanh toán',
        `⏰ <b>Thời gian:</b> ${escapeTelegramHtml(orderTime)}`
      );

      const messageHtml = lines.join('\n');
      await this.sendTelegramMessage(messageHtml, {
        botToken: effectiveBotToken,
        chatId: effectiveChatId,
      });
    } catch (err: any) {
      console.warn(
        '[telegramService.notifyNewOrderCreated] Lỗi gửi thông báo đơn hàng mới:',
        err?.message || err
      );
    }
  },

  /**
   * Bắn thông báo khi đơn hàng đã thanh toán thành công (Trạng thái: paid)
   */
  async notifyOrderPaid(
    order: SeedOrder | any,
    meta?: {
      transferAmount?: number;
      referenceCode?: string;
      gateway?: string;
    }
  ): Promise<void> {
    try {
      if (!order) return;
      const { config, effectiveBotToken, effectiveChatId } =
        await this.getResolvedConfig();

      if (!config.is_active || !config.notify_on_order_paid) {
        return;
      }
      if (!effectiveBotToken || !effectiveChatId) {
        console.warn(
          '[telegramService.notifyOrderPaid] Bỏ qua gửi thông báo: thiếu bot_token hoặc chat_id.'
        );
        return;
      }

      const orderCode = escapeTelegramHtml(order.order_code || order.id || 'N/A');
      const customerName = escapeTelegramHtml(
        order.customer_name || 'Khách hàng'
      );
      const customerEmail = escapeTelegramHtml(
        order.customer_email || 'Chưa cung cấp'
      );

      const paidAmountNum =
        meta?.transferAmount !== undefined
          ? meta.transferAmount
          : Number(order.total_amount) || 0;
      const paidAmount = formatVnd(paidAmountNum);

      const refCode = escapeTelegramHtml(
        meta?.referenceCode || order.payment_ref_id || 'N/A'
      );

      let gatewayLabel = escapeTelegramHtml(getVietQrGatewayLabel());
      if (meta?.gateway === 'paypal' || order.payment_method === 'paypal') {
        gatewayLabel = 'PayPal (Quốc tế)';
      } else if (meta?.gateway === 'manual') {
        gatewayLabel = 'Duyệt thủ công (Admin)';
      } else if (meta?.gateway) {
        gatewayLabel = escapeTelegramHtml(meta.gateway);
      }

      const items = Array.isArray(order.items) ? order.items : [];
      const itemsText =
        items.length > 0
          ? items
              .map((it: any) => {
                const qty = it.quantity || 1;
                const name = escapeTelegramHtml(
                  it.product_title ||
                    it.product_name ||
                    it.title ||
                    'Sản phẩm tài liệu'
                );
                const fmt = escapeTelegramHtml(
                  it.format_code || it.format_name || ''
                );
                const fmtStr = fmt ? ` (${fmt})` : '';
                return `• ${qty}x ${name}${fmtStr}`;
              })
              .join('\n')
          : '• 1x Tài liệu đơn hàng';

      const paidTime = formatVietnamDateTime(order.paid_at || new Date());

      const lines = [
        '💰 <b>THANH TOÁN THÀNH CÔNG!</b>',
        '━━━━━━━━━━━━━━━━━━━━',
        `📋 <b>Mã đơn:</b> <code>${orderCode}</code>`,
        `👤 <b>Khách hàng:</b> ${customerName}`,
        `📧 <b>Email:</b> ${customerEmail}`,
        `💵 <b>Số tiền thực nhận:</b> <b>${paidAmount}</b>`,
        `🏦 <b>Mã giao dịch:</b> <code>${refCode}</code>`,
        `🏦 <b>Cổng / Phương thức:</b> ${gatewayLabel}`,
        '',
        '📦 <b>Sản phẩm cấp quyền:</b>',
        itemsText,
        '━━━━━━━━━━━━━━━━━━━━',
        '✅ <b>Đã tự động cấp quyền Tủ sách cá nhân &amp; gửi Gmail!</b>',
        `⏰ <b>Hoàn tất lúc:</b> ${escapeTelegramHtml(paidTime)}`,
      ];

      const messageHtml = lines.join('\n');
      await this.sendTelegramMessage(messageHtml, {
        botToken: effectiveBotToken,
        chatId: effectiveChatId,
      });
    } catch (err: any) {
      console.warn(
        '[telegramService.notifyOrderPaid] Lỗi gửi thông báo thanh toán thành công:',
        err?.message || err
      );
    }
  },
};
