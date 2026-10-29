export type UiFormatCode = 'Word' | 'PDF' | 'Flashcard' | 'Trang tính' | 'Thiết kế';

export type GoogleFormNoteValue =
  | 'Word dài'
  | 'PDF dài'
  | 'Flashcard'
  | 'Trang tính'
  | 'Thiết kế';

export const UI_FORMATS: UiFormatCode[] = [
  'Word',
  'PDF',
  'Flashcard',
  'Trang tính',
  'Thiết kế',
];

export const FORMAT_TO_GOOGLE_FORM_MAP: Record<UiFormatCode, GoogleFormNoteValue> = {
  Word: 'Word dài',
  PDF: 'PDF dài',
  Flashcard: 'Flashcard',
  'Trang tính': 'Trang tính',
  'Thiết kế': 'Thiết kế',
};

export interface MenuItem {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface ComboRule {
  id: string;
  name: string;
  min_quantity: number;
  discount_percent: number;
  is_active: boolean;
}

export interface ProductFormat {
  format_code: UiFormatCode;
  price: number;
  is_active: boolean;
}

export interface ProductSpec {
  label: string;
  val: string;
}

export interface Product {
  id: string;
  category_id: string;
  category_slug: string;
  category_name: string;
  sub_section: string;
  code: string;
  title: string;
  slug: string;
  google_form_product_name: string;
  badge_text: string;
  short_desc: string;
  cover_tag: string;
  thumbnail_url: string;
  preview_type: 'pdf' | 'images' | 'none';
  sample_pdf_source: 'drive' | 'r2';
  sample_pdf_url: string;
  watermark_enabled: boolean;
  watermark_text: string;
  preview_images: string[];
  specs: ProductSpec[];
  topics: string[];
  features: string[];
  is_featured: boolean;
  is_combo_eligible: boolean;
  is_active: boolean;
  formats: ProductFormat[];
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  slug: string;
  categorySlug: string;
  code: string;
  title: string;
  googleFormProductName: string;
  formatCode: UiFormatCode;
  unitPrice: number;
  quantity: number;
  selected: boolean;
  isComboEligible: boolean;
}

export interface OrderItemRecord {
  product_id: string;
  product_title: string;
  google_form_product_name: string;
  format_code: UiFormatCode;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderRecord {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_group: 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác';
  selected_format: UiFormatCode;
  flashcard_quantity: number | null;
  need_invoice: boolean;
  invoice_tax_or_cccd: string;
  invoice_address: string;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'sepay' | 'paypal';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_ref_id?: string;
  paid_at?: string;
  google_form_submitted: boolean;
  created_at: string;
  items: OrderItemRecord[];
}

export interface PaymentInstruction {
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

export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}
