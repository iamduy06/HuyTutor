import { SeedOrder } from './dbService';

const SEPAY_BANK_NAME = process.env.SEPAY_BANK_NAME!;
const SEPAY_BANK_ACCOUNT = process.env.SEPAY_BANK_ACCOUNT!;
const SEPAY_ACCOUNT_HOLDER = process.env.SEPAY_ACCOUNT_HOLDER!;
const USD_EXCHANGE_RATE = Number(process.env.USD_EXCHANGE_RATE);

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
  const amountVnd = Math.round(order.total_amount);
  const amountUsd = Math.max(1, Number((amountVnd / USD_EXCHANGE_RATE).toFixed(2))).toFixed(2);
  const transferContent = order.order_code;

  const qrImageUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(
    SEPAY_BANK_NAME
  )}&acc=${encodeURIComponent(SEPAY_BANK_ACCOUNT)}&template=compact2&amount=${amountVnd}&des=${encodeURIComponent(
    transferContent
  )}`;

  return {
    method: order.payment_method,
    orderCode: order.order_code,
    amountVnd,
    amountUsd,
    sepay: {
      bankName: SEPAY_BANK_NAME,
      accountNumber: SEPAY_BANK_ACCOUNT,
      accountHolder: SEPAY_ACCOUNT_HOLDER,
      transferContent,
      qrImageUrl,
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID!,
      mode: process.env.PAYPAL_MODE!,
      amountUsd,
      currency: 'USD',
    },
  };
}

/**
 * Tách mã đơn hàng `DHxxxxx` hoặc `HTxxxxx` từ nội dung chuyển khoản SePay
 */
export function extractOrderCodeFromContent(content: string): string | null {
  if (!content) return null;
  const match = content.toUpperCase().match(/(?:DH|HT)\d{4,10}/);
  return match ? match[0] : null;
}
