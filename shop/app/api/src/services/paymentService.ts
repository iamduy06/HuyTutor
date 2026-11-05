import { SeedOrder } from './dbService';

export interface PaymentInitInfo {
  method: 'sepay' | 'paypal';
  orderCode: string;
  amountVnd: number;
  amountUsd: string;
  sepay?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    transferContent: string;
    qrImageUrl: string;
  };
  paypal?: {
    clientId: string;
    mode: string;
    amountUsd: string;
    currency: 'USD';
  };
}

export function buildPaymentInstruction(order: SeedOrder): PaymentInitInfo {
  const bankName = process.env.SEPAY_BANK_NAME || 'MBBank';
  const bankAccount = process.env.SEPAY_BANK_ACCOUNT || '';
  const accountHolder = process.env.SEPAY_ACCOUNT_HOLDER || '';
  const exchangeRate = Number(process.env.USD_EXCHANGE_RATE) || 25000;
  const paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
  const paypalMode = process.env.PAYPAL_MODE || 'sandbox';

  const amountVnd = Math.round(order.total_amount);
  const amountUsd = Math.max(1, Number((amountVnd / exchangeRate).toFixed(2))).toFixed(2);
  const transferContent = order.order_code;

  const qrImageUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(
    bankName
  )}&acc=${encodeURIComponent(bankAccount)}&template=compact2&amount=${amountVnd}&des=${encodeURIComponent(
    transferContent
  )}`;

  return {
    method: order.payment_method,
    orderCode: order.order_code,
    amountVnd,
    amountUsd,
    sepay: {
      bankName,
      accountNumber: bankAccount,
      accountHolder,
      transferContent,
      qrImageUrl,
    },
    paypal: {
      clientId: paypalClientId,
      mode: paypalMode,
      amountUsd,
      currency: 'USD',
    },
  };
}

/**
 * Tách mã đơn hàng `DHxxxxx` hoặc `HTxxxxx` từ nội dung chuyển khoản SePay
 * Hỗ trợ các biến thể có khoảng trắng hoặc dấu gạch nối (ví dụ: DH 59124, DH-59124)
 */
export function extractOrderCodeFromContent(content: string): string | null {
  if (!content) return null;
  const match = content.toUpperCase().match(/(?:DH|HT)\s*[-_]?\s*\d{4,10}/);
  return match ? match[0].replace(/[\s-_]/g, '') : null;
}
