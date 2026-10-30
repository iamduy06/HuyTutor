import { UIFormat, GoogleFormNote } from '../constants/formatMapping';

export interface NavItem {
  id: number;
  label: string;
  url: string;
  order_index: number;
  is_highlight?: boolean;
}

export interface NavMenu {
  id: number;
  title: string;
  url: string;
  order_index: number;
  is_active: boolean;
  children: NavItem[];
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  order_index: number;
  anchors?: { label: string; targetId: string }[];
}

export interface ProductFormatRecord {
  ui_format_name: UIFormat;
  form_mapped_note: GoogleFormNote;
  price: number;
  original_price: number;
  gdrive_folder_id: string;
  is_default: boolean;
  is_active: boolean;
}

export interface ProductSpec {
  label: string;
  val: string;
}

export interface ProductRecord {
  id: string;
  category_id: string;
  section_group: string;
  title: string;
  short_title: string;
  slug: string;
  google_form_product_name: string;
  badge: string;
  subtitle: string;
  cefr_level: string;
  grade: string;
  description: string;
  r2_thumbnail_url: string;
  r2_demo_images_urls: string[];
  r2_audio_url?: string;
  preview_type: 'pdf' | 'images' | 'none';
  sample_pdf_source: 'drive' | 'r2';
  sample_pdf_url: string;
  sample_title: string;
  watermark_enabled: boolean;
  watermark_text: string;
  specs: ProductSpec[];
  topics: string[];
  features: string[];
  sample_pages_text: { page: number; header: string; title: string; body: string; note: string }[];
  formats: ProductFormatRecord[];
  is_published: boolean;
  order_index: number;
}

export interface ComboRuleRecord {
  id: string;
  combo_name: string;
  min_items: number;
  discount_percent: number;
  discount_amount: number;
  applicable_format: string;
  badge_text: string;
  description: string;
  is_active: boolean;
}

export interface OrderItemRecord {
  product_id: string;
  product_name: string;
  google_form_product_name: string;
  ui_format: UIFormat;
  form_format: GoogleFormNote;
  unit_price: number;
  final_item_price: number;
  quantity?: number | null;
}

export interface OrderRecord {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_group: string;
  checkout_format: UIFormat;
  mapped_form_note: GoogleFormNote;
  flashcard_quantity?: number | null;
  need_invoice: boolean;
  customer_address: string;
  tax_id_or_cccd: string;
  original_subtotal: number;
  combo_discount: number;
  final_amount: number;
  payment_gateway: 'sepay' | 'paypal';
  status: 'pending' | 'paid' | 'cancelled';
  google_form_submitted: boolean;
  google_form_payload?: Record<string, string>;
  items: OrderItemRecord[];
  paid_at?: string;
  created_at: string;
}

export const INITIAL_MENUS: NavMenu[] = [];

export interface FooterSocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: string;
  is_active: boolean;
}

export interface FooterPolicyLink {
  id: string;
  label: string;
  url: string;
  order_index: number;
  is_active: boolean;
}

export interface SiteConfigs {
  footer_social_links: FooterSocialLink[];
  footer_policy_links: FooterPolicyLink[];
}

export const INITIAL_SITE_CONFIGS: SiteConfigs = {
  footer_social_links: [
    { id: 'facebook', platform: 'facebook', label: 'Facebook Huy Tutor', url: 'https://facebook.com', icon: 'f', is_active: true },
    { id: 'youtube', platform: 'youtube', label: 'YouTube Huy Tutor', url: 'https://youtube.com', icon: '▶', is_active: true }
  ],
  footer_policy_links: [
    { id: 'terms', label: 'Điều khoản sử dụng', url: '/terms-of-service', order_index: 1, is_active: true },
    { id: 'privacy', label: 'Chính sách bảo mật', url: '/terms-of-service', order_index: 2, is_active: true },
    { id: 'faq', label: 'Chính sách thanh toán & FAQ', url: '/faq', order_index: 3, is_active: true },
    { id: 'donate', label: 'Ủng hộ tác giả (Donate)', url: '/donate', order_index: 4, is_active: true }
  ]
};

export const INITIAL_CATEGORIES: CategoryRecord[] = [];

export const INITIAL_COMBO_RULES: ComboRuleRecord[] = [];

export const INITIAL_PRODUCTS: ProductRecord[] = [];

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'ord-demo-001',
    order_code: 'HT88291',
    customer_name: 'Cô Nguyễn Thị Lan Hương',
    customer_email: 'lanhuong.english@gmail.com',
    customer_phone: '0912345678',
    customer_group: 'Giáo viên công lập',
    checkout_format: 'Word',
    mapped_form_note: 'Word dài',
    flashcard_quantity: null,
    need_invoice: false,
    customer_address: '',
    tax_id_or_cccd: '',
    original_subtotal: 565000,
    combo_discount: 45000,
    final_amount: 520000,
    payment_gateway: 'sepay',
    status: 'paid',
    google_form_submitted: true,
    google_form_payload: {
      'entry.528749633': 'Cô Nguyễn Thị Lan Hương',
      'entry.598112260': '2026-10-29',
      'entry.1044261621': '20:15',
      'entry.681163783': '',
      'entry.575498379': '',
      'entry.2088729906': '30 đề thi thử ngôn ngữ Anh - Đánh giá năng lực Bộ Công an + 30 đề đột phá đề thi THPTQG môn Tiếng Anh (B2-C2)',
      'entry.801296064': '520000',
      'entry.906534887': 'Word dài',
      'entry.1610762805': 'lanhuong.english@gmail.com',
      'entry.1680953650': 'Giáo viên công lập',
      'entry.112780521': '',
      'entry.242891304': '',
      'entry.317416358': '',
      'entry.118891792': 'Website'
    },
    items: [
      {
        product_id: 'dgnl-bca',
        product_name: '30 đề thi thử ngôn ngữ Anh - Đánh giá năng lực Bộ Công an',
        google_form_product_name: '30 đề thi thử ngôn ngữ Anh - Đánh giá năng lực Bộ Công an',
        ui_format: 'Word',
        form_format: 'Word dài',
        unit_price: 380000,
        final_item_price: 350000,
        quantity: null
      },
      {
        product_id: 'dot-pha-b2-c2',
        product_name: 'Đột phá đề thi THPTQG môn Tiếng Anh (B2-C2)',
        google_form_product_name: '30 đề đột phá đề thi THPTQG môn Tiếng Anh (B2-C2)',
        ui_format: 'Word',
        form_format: 'Word dài',
        unit_price: 185000,
        final_item_price: 170000,
        quantity: null
      }
    ],
    paid_at: '2026-10-29T13:15:00.000Z',
    created_at: '2026-10-29T13:14:12.000Z'
  }
];
