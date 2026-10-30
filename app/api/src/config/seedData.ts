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

export const INITIAL_MENUS: NavMenu[] = [
  { id: 1, title: 'TRANG CHỦ', url: '/', order_index: 1, is_active: true, children: [] },
  { id: 2, title: 'FLASHCARD', url: '/flashcard', order_index: 2, is_active: true, children: [] },
  { id: 3, title: 'COMBO THPT', url: '/combo-thpt', order_index: 3, is_active: true, children: [] },
  {
    id: 4,
    title: 'TÀI LIỆU THPT',
    url: '/high-school',
    order_index: 4,
    is_active: true,
    children: [
      { id: 41, label: 'Tất cả tài liệu THPT', url: '/high-school', order_index: 1 },
      { id: 42, label: '30 Đề ĐGNL Bộ Công An', url: '/high-school/dgnlbca', order_index: 2, is_highlight: true },
      { id: 43, label: 'Đột phá đề thi THPTQG (B2-C2)', url: '/high-school#de-thi-thu', order_index: 3 },
      { id: 44, label: 'Tuyển tập từ vựng 10, 11, 12', url: '/high-school#tu-vung-gs', order_index: 4 }
    ]
  },
  {
    id: 5,
    title: 'TÀI LIỆU THCS',
    url: '/secondary-school',
    order_index: 5,
    is_active: true,
    children: [
      { id: 51, label: 'Tất cả tài liệu THCS', url: '/secondary-school', order_index: 1 },
      { id: 52, label: 'Đọc điền - Đọc hiểu Lớp 9', url: '/secondary-school/reading-g9', order_index: 2, is_highlight: true },
      { id: 53, label: 'Đọc điền - Đọc hiểu Lớp 6, 7, 8', url: '/secondary-school#lop-8', order_index: 3 }
    ]
  },
  {
    id: 6,
    title: 'TÀI LIỆU HSG',
    url: '/gifted-students',
    order_index: 6,
    is_active: true,
    children: [
      { id: 61, label: '1400 Cụm Động Từ HSG', url: '/gifted-students/1400caucumdongtuintermediate', order_index: 1, is_highlight: true }
    ]
  },
  { id: 7, title: 'SOẠN TÀI LIỆU', url: '/soan-tai-lieu', order_index: 7, is_active: true, children: [] },
  {
    id: 8,
    title: 'TÀI LIỆU KHÁC',
    url: '/other',
    order_index: 8,
    is_active: true,
    children: [
      { id: 81, label: 'Chuyên đề Điền từ', url: '/other#dien-tu', order_index: 1 },
      { id: 82, label: 'Chuyên đề Ngữ pháp', url: '/other#ngu-phap', order_index: 2 },
      { id: 83, label: 'Bảng từ vựng tổng hợp', url: '/other#tu-vung', order_index: 3 }
    ]
  },
  {
    id: 9,
    title: 'MẪU',
    url: '/template',
    order_index: 9,
    is_active: true,
    children: [
      { id: 91, label: 'Mẫu Kế hoạch bài dạy (Giáo án)', url: '/template#giao-an', order_index: 1 },
      { id: 92, label: 'Mẫu Đề thi theo ma trận', url: '/template#de-thi', order_index: 2 },
      { id: 93, label: 'Mẫu Bảng kiểm đánh giá', url: '/template#bang-kiem', order_index: 3 }
    ]
  },
  {
    id: 10,
    title: 'TÀI LIỆU MIỄN PHÍ',
    url: '/gifts',
    order_index: 10,
    is_active: true,
    children: [
      { id: 101, label: 'Đề thi học kỳ miễn phí', url: '/gifts#de-thi', order_index: 1 },
      { id: 102, label: 'Cẩm nang từ vựng miễn phí', url: '/gifts#cam-nang', order_index: 2 },
      { id: 103, label: 'Tài liệu đọc thử trích đoạn', url: '/gifts#doc-thu', order_index: 3 }
    ]
  },
  { id: 11, title: 'HC REWARDS', url: '/hc-rewards', order_index: 11, is_active: true, children: [] },
  { id: 12, title: 'CÂU HỎI THƯỜNG GẶP', url: '/faq', order_index: 12, is_active: true, children: [] }
];

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

export const INITIAL_CATEGORIES: CategoryRecord[] = [
  {
    id: 'high-school',
    name: 'Danh mục tài liệu Chuẩn mực & Chi tiết cấp THPT',
    slug: 'high-school',
    description: 'Đề thi thử THPT/ĐGNL, Bổ trợ kỹ năng đọc điền và Tuyển tập từ vựng Global Success 10-11-12',
    order_index: 1,
    anchors: [
      { label: 'Đề thi thử THPT/ĐGNL', targetId: 'de-thi-thu' },
      { label: 'Bổ trợ', targetId: 'bo-tro' },
      { label: 'Từ vựng Global Success', targetId: 'tu-vung-gs' }
    ]
  },
  {
    id: 'secondary-school',
    name: 'Danh mục tài liệu Chuẩn mực & Chi tiết cấp THCS',
    slug: 'secondary-school',
    description: 'Tài liệu Đọc điền - Đọc hiểu Tiếng Anh cơ bản & nâng cao Lớp 6, 7, 8, 9 bám sát CT GDPT 2018',
    order_index: 2,
    anchors: [
      { label: 'Lớp 9 & Ôn thi vào 10', targetId: 'lop-9' },
      { label: 'Lớp 6 - 7 - 8 CT GDPT 2018', targetId: 'lop-8' }
    ]
  },
  {
    id: 'gifted-students',
    name: 'Danh mục tài liệu Học sinh giỏi & Chuyên Anh',
    slug: 'gifted-students',
    description: 'Tài liệu chuyên sâu luyện thi HSG cấp Tỉnh/Quốc gia và Chuyên Anh',
    order_index: 3,
    anchors: []
  }
];

export const INITIAL_COMBO_RULES: ComboRuleRecord[] = [
  {
    id: 'combo-2',
    combo_name: 'Combo 2 Tài liệu cùng định dạng',
    min_items: 2,
    discount_percent: 15,
    discount_amount: 45000,
    applicable_format: 'ALL',
    badge_text: 'GIẢM 15%',
    description: 'Giảm ngay 45.000đ khi chọn thanh toán từ 2 tài liệu cùng định dạng (Word hoặc PDF)',
    is_active: true
  },
  {
    id: 'combo-3',
    combo_name: 'Combo 3 Bộ Đề Mới Nhất 2026',
    min_items: 3,
    discount_percent: 20,
    discount_amount: 85000,
    applicable_format: 'ALL',
    badge_text: 'GIẢM 20%',
    description: 'Giảm ngay 85.000đ khi chọn thanh toán từ 3 tài liệu cùng định dạng',
    is_active: true
  },
  {
    id: 'combo-5',
    combo_name: 'Đại Combo 90 Đề Thi Thử THPTQG',
    min_items: 5,
    discount_percent: 25,
    discount_amount: 160000,
    applicable_format: 'ALL',
    badge_text: 'GIẢM 25%',
    description: 'Ưu đãi cao nhất giảm 160.000đ khi chọn mua từ 5 tài liệu cùng định dạng',
    is_active: true
  }
];

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
