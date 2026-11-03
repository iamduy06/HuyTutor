import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import {
  INITIAL_MENUS,
  INITIAL_CATEGORIES,
  INITIAL_COMBO_RULES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SITE_CONFIGS,
  SiteConfigs,
  FooterSocialLink,
  FooterPolicyLink,
} from '../config/seedData';
import { UiFormatCode } from '../constants/formatMapping';

export interface SeedMenuItem {
  id: string;
  label: string;
  url: string;
  order_index: number;
  is_highlight?: boolean;
}

export interface SeedMenu {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  children?: SeedMenuItem[];
}

export interface SeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  blocks?: any[];
}

export interface SeedComboRule {
  id: string;
  name: string;
  min_quantity: number;
  discount_percent: number;
  is_active: boolean;
}

export interface SeedProductFormat {
  format_code: UiFormatCode;
  price: number;
  is_active: boolean;
}

export interface SeedProduct {
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
  specs: Array<{ label: string; val: string }>;
  topics: string[];
  features: string[];
  is_featured: boolean;
  is_combo_eligible: boolean;
  is_active: boolean;
  formats: SeedProductFormat[];
  detail_blocks?: any[];
}

export interface SeedOrderItem {
  product_id: string;
  product_title: string;
  google_form_product_name: string;
  format_code: UiFormatCode;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface SeedOrder {
  id: string;
  user_id?: string | null;
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
  items: SeedOrderItem[];
}

export interface SeedUser {
  id: string;
  email: string;
  password_hash: string; // SHA3-256 hex (64 chars)
  full_name: string;
  phone: string;
  role: 'user' | 'admin';
  customer_group: 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác';
  school_or_org: string;
  default_tax_cccd: string;
  default_invoice_address: string;
  reset_password_token: string | null;
  reset_password_expires_at: string | null;
  email_verified: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeedUserSession {
  id: string;
  user_id: string;
  session_token: string;
  user_agent: string;
  ip_address: string;
  is_revoked: boolean;
  expires_at: string;
  last_active_at: string;
  created_at: string;
}

export interface SeedUserLibraryItem {
  id: string;
  user_id: string;
  order_id: string;
  order_code: string;
  product_slug: string;
  product_title: string;
  format_code: UiFormatCode;
  access_drive_url: string;
  watermarked_pdf_url: string;
  download_count: number;
  last_downloaded_at?: string;
  is_active: boolean;
  granted_at: string;
}

export interface DbState {
  menus: SeedMenu[];
  categories: SeedCategory[];
  combo_rules: SeedComboRule[];
  products: SeedProduct[];
  orders: SeedOrder[];
  users: SeedUser[];
  user_sessions: SeedUserSession[];
  user_library: SeedUserLibraryItem[];
  site_configs: SiteConfigs;
}

const DATA_DIR = path.join(__dirname, '../../data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'local_db.json');

let supabaseAuthMissingUntil = 0;

function shouldTrySupabaseAuth(): boolean {
  return Boolean(
    isSupabaseConfigured && supabaseAdmin && Date.now() >= supabaseAuthMissingUntil
  );
}

function handleSupabaseAuthError(error: any): void {
  if (!error) return;
  const code = String(error.code || '');
  const msg = String(error.message || '');
  if (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  ) {
    supabaseAuthMissingUntil = Date.now() + 60 * 1000;
  }
}

// Bảng ánh xạ slug tương đương giữa 39 trang gốc huytutor.io.vn và slug chuẩn mới
const SLUG_ALIAS_MAP: Record<string, string> = {
  chotha: '30-de-chot-ha',
  '30-de-chot-ha': '30-de-chot-ha',
  'de-nang-cao-b2-c2': 'dot-pha-b2-c2',
  'dot-pha-b2-c2': 'dot-pha-b2-c2',
  'de-theo-chu-de-b1-b2': 'thuc-chien-b1-b2',
  'thuc-chien-b1-b2': 'thuc-chien-b1-b2',
  'nen-tang-tot-nghiep-thpt-mon-tieng-anh': 'chuyen-de-nen-tang',
  'chuyen-de-nen-tang': 'chuyen-de-nen-tang',
  sotaytv: 'so-tay-tu-vung',
  'so-tay-tu-vung': 'so-tay-tu-vung',
  'vocabulary-g10': 'tu-vung-10',
  'tu-vung-10': 'tu-vung-10',
  'vocabulary-g11': 'tu-vung-11',
  'tu-vung-11': 'tu-vung-11',
  'vocabulary-g12': 'tu-vung-12',
  'tu-vung-12': 'tu-vung-12',
};

const SECTION_LABEL_MAP: Record<string, string> = {
  'de-thi-thu': 'Đề thi thử THPT/ĐGNL',
  'bo-tro': 'Bổ trợ',
  'tu-vung-gs': 'Từ vựng Global Success',
  'lop-9': 'Cấp THCS',
  'lop-8': 'Cấp THCS',
  utilities: 'Tiện ích',
};

function buildAdditionalProductsForAll39Pages(): SeedProduct[] {
  const defaultWatermark = 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN';
  return [
    {
      id: 'chuyen-de-dien-tu',
      category_id: 'high-school',
      category_slug: 'high-school',
      category_name: 'Danh mục tài liệu Chuẩn mực & Chi tiết cấp THPT',
      sub_section: 'Bổ trợ',
      code: 'ĐIỀN TỪ QC',
      title: 'Chuyên đề điền từ quảng cáo - tờ rơi - thông báo',
      slug: 'chuyen-de-dien-tu-quang-cao-to-roi-thong-bao',
      google_form_product_name: 'Chuyên đề điền từ quảng cáo - tờ rơi - thông báo',
      badge_text: 'Chính thức',
      short_desc:
        'Tài liệu chuyên sâu luyện dạng bài đọc điền thông báo (Announcement) và tờ rơi quảng cáo (Advertisement/Leaflet) theo đúng cấu trúc đề thi THPT từ 2025.',
      cover_tag: 'Dành cho\ncấp THPT',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: defaultWatermark,
      preview_images: [],
      specs: [
        { label: 'Số lượng', val: '100 bài đọc điền Quảng cáo - Tờ rơi - Thông báo' },
        { label: 'Cấp độ', val: 'B1 - C1 bám sát form đề mới' },
        { label: 'Giải thích', val: 'Giải thích chi tiết từng câu kèm bảng từ vựng' },
      ],
      topics: [
        'Quảng cáo sự kiện, khóa học, dịch vụ, du lịch, môi trường, công nghệ.',
        'Thông báo trường học, câu lạc bộ, tuyển dụng và hướng dẫn cộng đồng.',
      ],
      features: [
        'Bám sát 100% dạng câu hỏi đọc điền mới trong đề minh họa của Bộ GD&ĐT.',
        'Hỗ trợ cả bản Word chỉnh sửa trực tiếp và bản PDF in ấn sắc nét.',
      ],
      is_featured: true,
      is_combo_eligible: true,
      is_active: true,
      formats: [
        { format_code: 'Word', price: 159000, is_active: true },
        { format_code: 'PDF', price: 109000, is_active: true },
        { format_code: 'Flashcard', price: 60000, is_active: true },
        { format_code: 'Trang tính', price: 100000, is_active: false },
        { format_code: 'Thiết kế', price: 150000, is_active: false },
      ],
    },
    {
      id: 'reading-g7',
      category_id: 'secondary-school',
      category_slug: 'secondary-school',
      category_name: 'Danh mục tài liệu Chuẩn mực & Chi tiết cấp THCS',
      sub_section: 'Cấp THCS',
      code: 'ĐỌC HIỂU 7',
      title: 'Bài tập đọc điền - đọc hiểu tiếng Anh 7 từ cơ bản đến nâng cao',
      slug: 'reading-g7',
      google_form_product_name:
        'Bài tập đọc điền - đọc hiểu tiếng Anh 7 từ cơ bản đến nâng cao',
      badge_text: 'Chính thức',
      short_desc:
        'Hệ thống bài tập đọc điền và đọc hiểu Tiếng Anh lớp 7 theo các chủ đề SGK chương trình mới, có giải thích chi tiết và bảng từ vựng mở rộng.',
      cover_tag: 'Tiếng Anh 7\nCơ bản đến\nnâng cao',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: defaultWatermark,
      preview_images: [],
      specs: [
        { label: 'Khối lớp', val: 'Lớp 7 THCS (CT GDPT 2018)' },
        { label: 'Nội dung', val: 'Đọc điền & Đọc hiểu phân hóa từ cơ bản đến nâng cao' },
      ],
      topics: ['Hobbies, Healthy Living, Community Service, Music and Arts, Food and Drink, Education, Energy Sources.'],
      features: ['Đáp án kèm giải thích chi tiết từng câu và dịch nghĩa ngữ cảnh đầy đủ.'],
      is_featured: true,
      is_combo_eligible: true,
      is_active: true,
      formats: [
        { format_code: 'Word', price: 149000, is_active: true },
        { format_code: 'PDF', price: 99000, is_active: true },
        { format_code: 'Flashcard', price: 60000, is_active: false },
        { format_code: 'Trang tính', price: 99000, is_active: false },
        { format_code: 'Thiết kế', price: 120000, is_active: false },
      ],
    },
    {
      id: 'reading-g6',
      category_id: 'secondary-school',
      category_slug: 'secondary-school',
      category_name: 'Danh mục tài liệu Chuẩn mực & Chi tiết cấp THCS',
      sub_section: 'Cấp THCS',
      code: 'ĐỌC HIỂU 6',
      title: 'Bài tập đọc điền - đọc hiểu tiếng Anh 6 từ cơ bản đến nâng cao',
      slug: 'reading-g6',
      google_form_product_name:
        'Bài tập đọc điền - đọc hiểu tiếng Anh 6 từ cơ bản đến nâng cao',
      badge_text: 'Chính thức',
      short_desc:
        'Tài liệu luyện kỹ năng đọc điền và đọc hiểu Tiếng Anh lớp 6 bám sát chương trình mới, xây dựng nền tảng từ vựng và ngữ pháp vững chắc.',
      cover_tag: 'Tiếng Anh 6\nCơ bản đến\nnâng cao',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: defaultWatermark,
      preview_images: [],
      specs: [
        { label: 'Khối lớp', val: 'Lớp 6 THCS (CT GDPT 2018)' },
        { label: 'Nội dung', val: 'Bài tập đọc điền & đọc hiểu theo từng Unit' },
      ],
      topics: ['My New School, My House, My Friends, My Neighbourhood, Natural Wonders, Tet Holiday, Television, Cities of the World.'],
      features: ['Phù hợp cho cả giáo viên làm ngữ liệu giảng dạy và học sinh tự luyện tại nhà.'],
      is_featured: true,
      is_combo_eligible: true,
      is_active: true,
      formats: [
        { format_code: 'Word', price: 149000, is_active: true },
        { format_code: 'PDF', price: 99000, is_active: true },
        { format_code: 'Flashcard', price: 60000, is_active: false },
        { format_code: 'Trang tính', price: 99000, is_active: false },
        { format_code: 'Thiết kế', price: 120000, is_active: false },
      ],
    },
    // 5 TÀI LIỆU QUÀ TẶNG MIỄN PHÍ (/gifts/*)
    {
      id: 'gift-100-idioms',
      category_id: 'gifts',
      category_slug: 'gifts',
      category_name: 'Tài liệu miễn phí & Quà tặng tri ân',
      sub_section: 'Quà tặng miễn phí',
      code: '100 IDIOMS',
      title: '100 câu trắc nghiệm Thành ngữ (Idioms) trọng tâm thi THPT',
      slug: '100-cau-thanh-ngu',
      google_form_product_name: '100 câu trắc nghiệm Thành ngữ (Idioms)',
      badge_text: 'Miễn phí',
      short_desc: 'Tài liệu quà tặng miễn phí gồm 100 câu thành ngữ tiếng Anh thường gặp kèm giải thích chi tiết.',
      cover_tag: 'Tài liệu\nQuà tặng\nMiễn phí',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: defaultWatermark,
      preview_images: [],
      specs: [{ label: 'Hình thức', val: 'Tài liệu Quà tặng Miễn phí (PDF)' }],
      topics: ['100 thành ngữ thông dụng trong đề thi THPTQG và HSG.'],
      features: ['Có đáp án và giải thích nghĩa từng thành ngữ.'],
      is_featured: false,
      is_combo_eligible: false,
      is_active: true,
      formats: [{ format_code: 'PDF', price: 0, is_active: true }],
    },
    {
      id: 'gift-200-collocations',
      category_id: 'gifts',
      category_slug: 'gifts',
      category_name: 'Tài liệu miễn phí & Quà tặng tri ân',
      sub_section: 'Quà tặng miễn phí',
      code: '200 COLLOC',
      title: '200 câu trắc nghiệm Cụm từ cố định (Collocations) thông dụng',
      slug: '200caucollocations',
      google_form_product_name: '200 câu trắc nghiệm Cụm từ cố định (Collocations)',
      badge_text: 'Miễn phí',
      short_desc: 'Bộ 200 câu trắc nghiệm Collocations chọn lọc giúp học sinh bứt phá điểm 8+ - 9+.',
      cover_tag: 'Tài liệu\nQuà tặng\nMiễn phí',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: defaultWatermark,
      preview_images: [],
      specs: [{ label: 'Hình thức', val: 'Tài liệu Quà tặng Miễn phí (PDF)' }],
      topics: ['Cụm động từ và Collocations đi với Make, Do, Take, Have, Break, Catch, Pay.'],
      features: ['Giải thích chi tiết từng cụm từ cố định.'],
      is_featured: false,
      is_combo_eligible: false,
      is_active: true,
      formats: [{ format_code: 'PDF', price: 0, is_active: true }],
    },
    {
      id: 'gift-296-collocations',
      category_id: 'gifts',
      category_slug: 'gifts',
      category_name: 'Tài liệu miễn phí & Quà tặng tri ân',
      sub_section: 'Quà tặng miễn phí',
      code: '296 COLLOC',
      title: '296 Cụm từ cố định (Collocations) trích từ đề thi thử các trường & sở',
      slug: '296-collocations',
      google_form_product_name: '296 Cụm từ cố định (Collocations)',
      badge_text: 'Miễn phí',
      short_desc: 'Tổng hợp 296 Collocations thực chiến xuất hiện nhiều nhất trong đề thi thử các Sở GD&ĐT.',
      cover_tag: 'Tài liệu\nQuà tặng\nMiễn phí',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: defaultWatermark,
      preview_images: [],
      specs: [{ label: 'Hình thức', val: 'Tài liệu Quà tặng Miễn phí (PDF)' }],
      topics: ['296 Collocations thực chiến sát đề thi thật.'],
      features: ['Bảng tổng hợp khoa học, dễ tra cứu và ôn tập.'],
      is_featured: false,
      is_combo_eligible: false,
      is_active: true,
      formats: [{ format_code: 'PDF', price: 0, is_active: true }],
    },
    {
      id: 'gift-de-thi-chinh-thuc',
      category_id: 'gifts',
      category_slug: 'gifts',
      category_name: 'Tài liệu miễn phí & Quà tặng tri ân',
      sub_section: 'Quà tặng miễn phí',
      code: 'ĐỀ BỘ GD',
      title: 'Tuyển tập Đề thi chính thức & Đề tham khảo môn Tiếng Anh Bộ GD&ĐT',
      slug: 'de-thi-chinh-thuc',
      google_form_product_name: 'Tuyển tập Đề thi chính thức Bộ GD&ĐT',
      badge_text: 'Miễn phí',
      short_desc: 'Tổng hợp các mã đề thi chính thức và đề tham khảo của Bộ GD&ĐT kèm lời giải chi tiết.',
      cover_tag: 'Đề chính thức\nBộ GD&ĐT\nMiễn phí',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: defaultWatermark,
      preview_images: [],
      specs: [{ label: 'Hình thức', val: 'Tài liệu Quà tặng Miễn phí (PDF)' }],
      topics: ['Đề thi chính thức và đề minh họa qua các năm.'],
      features: ['Phân tích ma trận và giải thích chi tiết.'],
      is_featured: false,
      is_combo_eligible: false,
      is_active: true,
      formats: [{ format_code: 'PDF', price: 0, is_active: true }],
    },
    {
      id: 'gift-de-truong-so',
      category_id: 'gifts',
      category_slug: 'gifts',
      category_name: 'Tài liệu miễn phí & Quà tặng tri ân',
      sub_section: 'Quà tặng miễn phí',
      code: 'ĐỀ TRƯỜNG SỞ',
      title: 'Tổng hợp Đề thi thử THPT môn Tiếng Anh các Trường & Sở GD&ĐT trên cả nước',
      slug: 'detruongso',
      google_form_product_name: 'Tổng hợp Đề thi thử các Trường & Sở GD&ĐT',
      badge_text: 'Miễn phí',
      short_desc: 'Kho đề thi thử chọn lọc từ các trường chuyên và Sở GD&ĐT trên toàn quốc.',
      cover_tag: 'Đề thi thử\nCác Trường & Sở\nMiễn phí',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: defaultWatermark,
      preview_images: [],
      specs: [{ label: 'Hình thức', val: 'Tài liệu Quà tặng Miễn phí (PDF)' }],
      topics: ['Đề thi thử các Sở Hà Nội, TP.HCM, Nghệ An, Hà Tĩnh, Nam Định, Bắc Ninh...'],
      features: ['Cập nhật liên tục phục vụ thầy cô và học sinh luyện đề.'],
      is_featured: false,
      is_combo_eligible: false,
      is_active: true,
      formats: [{ format_code: 'PDF', price: 0, is_active: true }],
    },
  ];
}

function buildNormalizedSeedState(): DbState {
  const menus: SeedMenu[] = INITIAL_MENUS.map((m) => ({
    id: String(m.id),
    title: m.title,
    slug: m.url,
    parent_id: null,
    sort_order: m.order_index,
    is_active: m.is_active,
    children: m.children?.map((c) => ({
      id: String(c.id),
      label: c.label,
      url: c.url,
      order_index: c.order_index,
      is_highlight: c.is_highlight,
    })) || [],
  }));

  const extraCategories: SeedCategory[] = [
    {
      id: 'gifts',
      name: 'Tài liệu miễn phí & Quà tặng tri ân',
      slug: 'gifts',
      description: 'Kho tài liệu miễn phí do Thầy Huy biên soạn và sưu tầm dành tặng Thầy/Cô và học sinh.',
      sort_order: 4,
      is_active: true,
    },
    {
      id: 'other',
      name: 'Tài liệu khác & Chuyên đề mở rộng',
      slug: 'other',
      description: 'Các chuyên đề cụm từ cố định, thành ngữ và tài liệu bổ trợ liên cấp.',
      sort_order: 5,
      is_active: true,
    },
    {
      id: 'template',
      name: 'Mẫu trang tính & Thiết kế quản lý lớp học',
      slug: 'template',
      description: 'Trang tính quản lý điểm danh, học phí tự động và mẫu thiết kế hỗ trợ giảng dạy.',
      sort_order: 6,
      is_active: true,
    },
    {
      id: 'do-dung-day-hoc',
      name: 'Tiện ích & Đồ dùng dạy học',
      slug: 'do-dung-day-hoc',
      description: 'Hệ thống Flashcard, Trang tính điểm danh và tiện ích hỗ trợ giáo viên.',
      sort_order: 7,
      is_active: true,
    },
  ];

  const categories: SeedCategory[] = [
    ...INITIAL_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sort_order: c.order_index,
      is_active: true,
    })),
    ...extraCategories,
  ];

  const combo_rules: SeedComboRule[] = INITIAL_COMBO_RULES.map((r) => ({
    id: r.id,
    name: r.combo_name,
    min_quantity: r.min_items,
    discount_percent: r.discount_percent,
    is_active: r.is_active,
  }));

  const baseProducts: SeedProduct[] = INITIAL_PRODUCTS.map((p) => {
    const cat = categories.find((c) => c.id === p.category_id || c.slug === p.category_id);
    const defaultFormats: SeedProductFormat[] = [
      { format_code: 'Word', price: 229000, is_active: true },
      { format_code: 'PDF', price: 150000, is_active: true },
      { format_code: 'Flashcard', price: 100000, is_active: true },
      { format_code: 'Trang tính', price: 120000, is_active: false },
      { format_code: 'Thiết kế', price: 180000, is_active: false },
    ];

    const mappedFormats: SeedProductFormat[] = defaultFormats.map((df) => {
      const existing = p.formats.find((f) => f.ui_format_name === df.format_code);
      if (existing) {
        return {
          format_code: existing.ui_format_name,
          price: existing.price,
          is_active: existing.is_active,
        };
      }
      return df;
    });

    const readableSection =
      SECTION_LABEL_MAP[p.section_group] || p.section_group || 'Đề thi thử THPT/ĐGNL';

    return {
      id: p.id,
      category_id: cat?.id || p.category_id,
      category_slug: cat?.slug || p.category_id,
      category_name: cat?.name || 'Tài liệu THPT',
      sub_section: readableSection,
      code: p.short_title || p.slug.toUpperCase(),
      title: p.title,
      slug: p.slug,
      google_form_product_name: p.google_form_product_name || p.title,
      badge_text: p.badge || 'Mới',
      short_desc: p.description || '',
      cover_tag: p.subtitle
        ? p.subtitle.replace(/ • /g, '\n')
        : `Dành cho\n${p.grade || 'Kỳ thi THPTQG'}`,
      thumbnail_url: p.r2_thumbnail_url || '',
      preview_type: p.preview_type || 'images',
      sample_pdf_source: p.sample_pdf_source || 'r2',
      sample_pdf_url: p.sample_pdf_url || '',
      watermark_enabled: p.watermark_enabled ?? true,
      watermark_text:
        p.watermark_text || 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
      preview_images: Array.isArray(p.r2_demo_images_urls) ? p.r2_demo_images_urls : [],
      specs: Array.isArray(p.specs) ? p.specs : [],
      topics: Array.isArray(p.topics) ? p.topics : [],
      features: Array.isArray(p.features) ? p.features : [],
      is_featured: true,
      is_combo_eligible: true,
      is_active: p.is_published ?? true,
      formats: mappedFormats,
    };
  });

  const additionalProducts = buildAdditionalProductsForAll39Pages();
  const products = [...baseProducts, ...additionalProducts];

  const orders: SeedOrder[] = INITIAL_ORDERS.map((o) => ({
    id: o.id,
    order_code: o.order_code,
    customer_name: o.customer_name,
    customer_email: o.customer_email,
    customer_phone: o.customer_phone,
    customer_group: 'Giáo viên',
    selected_format: o.checkout_format,
    flashcard_quantity: o.flashcard_quantity ?? null,
    need_invoice: o.need_invoice,
    invoice_tax_or_cccd: o.tax_id_or_cccd || '',
    invoice_address: o.customer_address || '',
    subtotal_amount: o.original_subtotal,
    discount_percent:
      o.original_subtotal > 0
        ? Math.round((o.combo_discount / o.original_subtotal) * 100)
        : 0,
    discount_amount: o.combo_discount,
    total_amount: o.final_amount,
    payment_method: o.payment_gateway,
    payment_status: o.status === 'paid' ? 'paid' : 'pending',
    paid_at: o.paid_at,
    google_form_submitted: o.google_form_submitted,
    created_at: o.created_at,
    items: o.items.map((it) => ({
      product_id: it.product_id,
      product_title: it.product_name,
      google_form_product_name: it.google_form_product_name,
      format_code: it.ui_format,
      unit_price: it.unit_price,
      quantity: it.quantity || 1,
      subtotal: it.final_item_price,
    })),
  }));

  const defaultAdminUser: SeedUser = {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'huymdcc@gmail.com',
    password_hash: '8e6b8cb7aa0ce9ec3c88a50e42cc9bb51c4aa62fd0fc2a3139fbf713ec7d6eda', // SHA3-256('Admin@123')
    full_name: 'Thầy Huỳnh Thanh Duy (Huy Tutor)',
    phone: '0358999147',
    role: 'admin',
    customer_group: 'Giáo viên',
    school_or_org: 'Huy Tutor Education',
    default_tax_cccd: '',
    default_invoice_address: '',
    reset_password_token: null,
    reset_password_expires_at: null,
    email_verified: true,
    is_active: true,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    menus: [],
    categories: [],
    combo_rules: [],
    products: [],
    orders,
    users: [defaultAdminUser],
    user_sessions: [],
    user_library: [],
    site_configs: INITIAL_SITE_CONFIGS,
  };
}

function ensureAuthArraysInState(parsed: DbState): boolean {
  let mutated = false;
  if (!parsed.site_configs) {
    parsed.site_configs = { ...INITIAL_SITE_CONFIGS };
    mutated = true;
  }
  if (!Array.isArray(parsed.menus)) {
    parsed.menus = [];
    mutated = true;
  }
  if (!Array.isArray(parsed.users)) {
    parsed.users = [];
    mutated = true;
  }
  const hasAdmin = parsed.users.some(
    (u) => u.email.toLowerCase() === 'huymdcc@gmail.com'
  );
  if (!hasAdmin) {
    parsed.users.unshift({
      id: '00000000-0000-4000-8000-000000000001',
      email: 'huymdcc@gmail.com',
      password_hash: '8e6b8cb7aa0ce9ec3c88a50e42cc9bb51c4aa62fd0fc2a3139fbf713ec7d6eda',
      full_name: 'Thầy Huỳnh Thanh Duy (Huy Tutor)',
      phone: '0358999147',
      role: 'admin',
      customer_group: 'Giáo viên',
      school_or_org: 'Huy Tutor Education',
      default_tax_cccd: '',
      default_invoice_address: '',
      reset_password_token: null,
      reset_password_expires_at: null,
      email_verified: true,
      is_active: true,
      last_login_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    mutated = true;
  }
  if (!Array.isArray(parsed.user_sessions)) {
    parsed.user_sessions = [];
    mutated = true;
  }
  if (!Array.isArray(parsed.user_library)) {
    parsed.user_library = [];
    mutated = true;
  }
  return mutated;
}

function loadLocalDb(): DbState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initial = buildNormalizedSeedState();
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as DbState;
    if (!Array.isArray(parsed.products)) {
      parsed.products = [];
    }
    if (ensureAuthArraysInState(parsed)) {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    console.error('[dbService] Error reading local_db.json, falling back to memory seed:', err);
    return buildNormalizedSeedState();
  }
}

function saveLocalDb(state: DbState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[dbService] Error writing local_db.json:', err);
  }
}

export const dbService = {
  async getMenus(includeInactive = false): Promise<SeedMenu[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('navigation_menus')
          .select('id, title, url, order_index, is_active, navigation_items(id, label, url, order_index, is_highlight, is_active)')
          .order('order_index', { ascending: true });
        if (!includeInactive) {
          query = query.eq('is_active', true);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map((m: any) => ({
            id: String(m.id),
            title: m.title,
            slug: m.url,
            parent_id: null,
            sort_order: m.order_index,
            is_active: m.is_active,
            children: (m.navigation_items || [])
              .filter((sub: any) => includeInactive || sub.is_active)
              .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
              .map((sub: any) => ({
                id: String(sub.id),
                label: sub.label,
                url: sub.url,
                order_index: sub.order_index || 0,
                is_highlight: Boolean(sub.is_highlight),
              })),
          })) as SeedMenu[];
        }
      } catch (err) {
        console.error('[dbService] Supabase getMenus error:', err);
      }
      return [];
    }
    const db = loadLocalDb();
    const list = includeInactive ? db.menus : db.menus.filter((m) => m.is_active);
    return list.sort((a, b) => a.sort_order - b.sort_order);
  },

  async updateMenus(menus: SeedMenu[]): Promise<SeedMenu[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        for (const m of menus) {
          const numId = Number(m.id);
          const menuId = !isNaN(numId) ? numId : undefined;
          const { data: upsertedMenu } = await supabaseAdmin.from('navigation_menus').upsert({
            ...(menuId ? { id: menuId } : {}),
            title: m.title,
            url: m.slug,
            order_index: m.sort_order,
            is_active: m.is_active,
          }).select().single();

          if (upsertedMenu && Array.isArray(m.children)) {
            await supabaseAdmin.from('navigation_items').delete().eq('menu_id', upsertedMenu.id);
            if (m.children.length > 0) {
              await supabaseAdmin.from('navigation_items').insert(
                m.children.map((sub, idx) => ({
                  menu_id: upsertedMenu.id,
                  label: sub.label,
                  url: sub.url,
                  order_index: sub.order_index || idx + 1,
                  is_highlight: Boolean(sub.is_highlight),
                  is_active: true,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error('[dbService] Error updating navigation_menus in Supabase:', err);
      }
    }
    const db = loadLocalDb();
    db.menus = menus;
    saveLocalDb(db);
    return db.menus;
  },

  async getSiteConfigs(): Promise<SiteConfigs> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('site_configs').select('*');
        if (!error && data) {
          const configMap: Record<string, any> = {};
          for (const row of data) {
            configMap[row.key] = row.value;
          }
          let homepageBlocks = Array.isArray(configMap['homepage_blocks'])
            ? configMap['homepage_blocks']
            : null;

          if (!homepageBlocks) {
            homepageBlocks = [
              {
                id: 'block_hero_default',
                type: 'hero',
                title_label: 'Khung Đen: Hero Top Header',
                is_active: configMap['homepage_hero']?.is_active ?? true,
                sort_order: 1,
                config: configMap['homepage_hero'] || {},
              },
              {
                id: 'block_banner_default',
                type: 'top_banner',
                title_label: 'Khung Xanh Dương: Top Banner',
                is_active: configMap['homepage_top_banner']?.is_active ?? true,
                sort_order: 2,
                config: configMap['homepage_top_banner'] || {},
              },
              {
                id: 'block_cat_grid_default',
                type: 'categories_grid',
                title_label: 'Khung Vàng: Danh mục ô vuông',
                is_active: configMap['homepage_categories_grid']?.is_active ?? true,
                sort_order: 3,
                config: configMap['homepage_categories_grid'] || {},
              },
              {
                id: 'block_sec_groups_default',
                type: 'section_groups',
                title_label: 'Khung Tím: Nhóm tài liệu cấp 1 & Cấp 2',
                is_active: configMap['homepage_section_groups']?.is_active ?? true,
                sort_order: 4,
                config: configMap['homepage_section_groups'] || {},
              },
              {
                id: 'block_notice_default',
                type: 'notice_text',
                title_label: 'Khung Xám: Dòng chữ thông báo & Nút',
                is_active: configMap['homepage_notice_text']?.is_active ?? true,
                sort_order: 5,
                config: configMap['homepage_notice_text'] || {},
              },
              {
                id: 'block_bottom_banner_default',
                type: 'bottom_banner',
                title_label: 'Khung Nâu: Banner cuối trang',
                is_active: configMap['homepage_bottom_banner']?.is_active ?? true,
                sort_order: 6,
                config: configMap['homepage_bottom_banner'] || {},
              },
            ];
          }

          return {
            footer_social_links: Array.isArray(configMap['footer_social_links'])
              ? configMap['footer_social_links']
              : [],
            footer_policy_links: Array.isArray(configMap['footer_policy_links'])
              ? configMap['footer_policy_links']
              : [],
            homepage_hero: configMap['homepage_hero'] || null,
            homepage_top_banner: configMap['homepage_top_banner'] || null,
            homepage_categories_grid: configMap['homepage_categories_grid'] || null,
            homepage_section_groups: configMap['homepage_section_groups'] || null,
            homepage_notice_text: configMap['homepage_notice_text'] || null,
            homepage_bottom_banner: configMap['homepage_bottom_banner'] || null,
            homepage_blocks: homepageBlocks,
            ...configMap,
          };
        }
      } catch (err) {
        console.error('[dbService] Supabase getSiteConfigs error:', err);
      }
      return { footer_social_links: [], footer_policy_links: [] };
    }
    const db = loadLocalDb();
    return db.site_configs || { footer_social_links: [], footer_policy_links: [] };
  },

  async updateSiteConfig(key: string, value: any): Promise<any> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('site_configs').upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[dbService] Error updating site_configs in Supabase:', err);
      }
    }
    const db = loadLocalDb();
    if (!db.site_configs) {
      db.site_configs = { ...INITIAL_SITE_CONFIGS };
    }
    (db.site_configs as any)[key] = value;
    saveLocalDb(db);
    return (db.site_configs as any)[key];
  },

  async getCategories(options?: { includeInactive?: boolean }): Promise<SeedCategory[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!options?.includeInactive) {
          query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (!error && data) {
          // Lấy cấu hình blocks dự phòng từ site_configs nếu cột blocks trong DB chưa có hoặc null
          const { data: configRows } = await supabaseAdmin
            .from('site_configs')
            .select('key, value')
            .like('key', 'category_blocks:%');
          const configMap = new Map<string, any[]>();
          if (Array.isArray(configRows)) {
            for (const r of configRows) {
              const slug = r.key.replace('category_blocks:', '');
              configMap.set(slug, r.value);
            }
          }

          return data.map((row: any) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description || '',
            sort_order: row.sort_order ?? 0,
            is_active: row.is_active ?? true,
            blocks:
              Array.isArray(row.blocks) && row.blocks.length > 0
                ? row.blocks
                : configMap.get(row.slug) || [],
          }));
        }
      } catch (err) {
        console.error('[dbService] Supabase getCategories error:', err);
      }
      return [];
    }
    const db = loadLocalDb();
    const list = options?.includeInactive
      ? db.categories
      : db.categories.filter((c) => c.is_active);
    return list.sort((a, b) => a.sort_order - b.sort_order);
  },

  async getComboRules(): Promise<SeedComboRule[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('combo_rules')
          .select('*')
          .eq('is_active', true)
          .order('min_quantity', { ascending: true });
        if (!error && data) {
          return data as SeedComboRule[];
        }
      } catch (err) {
        console.error('[dbService] Supabase getComboRules error:', err);
      }
      return [];
    }
    const db = loadLocalDb();
    return db.combo_rules
      .filter((r) => r.is_active)
      .sort((a, b) => a.min_quantity - b.min_quantity);
  },

  async getProducts(options?: {
    categorySlug?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<SeedProduct[]> {
    let products: SeedProduct[] = [];

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('products')
          .select('*, categories(slug, name), product_formats(*)');
        if (!options?.includeInactive) {
          query = query.eq('is_active', true);
        }
        const [prodRes, cfgRes] = await Promise.all([
          query,
          supabaseAdmin
            .from('site_configs')
            .select('key, value')
            .like('key', 'product_detail_blocks:%'),
        ]);
        const { data, error } = prodRes;
        const blocksBySlug: Record<string, any[]> = {};
        if (!cfgRes.error && Array.isArray(cfgRes.data)) {
          for (const row of cfgRes.data) {
            const slugKey = String(row.key || '').replace('product_detail_blocks:', '');
            if (slugKey && Array.isArray(row.value)) {
              blocksBySlug[slugKey] = row.value;
            }
          }
        }

        if (!error && data) {
          products = data.map((row: any) => ({
            id: row.id,
            category_id: row.category_id,
            category_slug: row.categories?.slug || row.category_slug || 'high-school',
            category_name: row.categories?.name || 'Tài liệu',
            sub_section: row.sub_section || '',
            code: row.code,
            title: row.title,
            slug: row.slug,
            google_form_product_name: row.google_form_product_name,
            badge_text: row.badge_text || '',
            short_desc: row.short_desc || '',
            cover_tag: row.cover_tag || '',
            thumbnail_url: row.thumbnail_url || '',
            preview_type: row.preview_type || 'images',
            sample_pdf_source: row.sample_pdf_source || 'r2',
            sample_pdf_url: row.sample_pdf_url || '',
            watermark_enabled: row.watermark_enabled ?? true,
            watermark_text:
              row.watermark_text || 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
            preview_images: Array.isArray(row.preview_images) ? row.preview_images : [],
            specs: Array.isArray(row.specs) ? row.specs : [],
            topics: Array.isArray(row.topics) ? row.topics : [],
            features: Array.isArray(row.features) ? row.features : [],
            is_featured: Boolean(row.is_featured),
            is_combo_eligible: Boolean(row.is_combo_eligible),
            is_active: Boolean(row.is_active),
            formats: Array.isArray(row.product_formats)
              ? row.product_formats.map((f: any) => ({
                  format_code: f.format_code as UiFormatCode,
                  price: Number(f.price),
                  is_active: Boolean(f.is_active),
                }))
              : [],
            detail_blocks:
              Array.isArray(row.detail_blocks) && row.detail_blocks.length > 0
                ? row.detail_blocks
                : blocksBySlug[row.slug] || [],
          }));

          if (options?.categorySlug) {
            products = products.filter((p) => p.category_slug === options.categorySlug);
          }
          if (options?.search && options.search.trim() !== '') {
            const q = options.search.trim().toLowerCase();
            products = products.filter(
              (p) =>
                p.title.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                p.short_desc.toLowerCase().includes(q) ||
                p.sub_section.toLowerCase().includes(q)
            );
          }
          // STRICT ZERO-FALLBACK: Luôn trả về đúng dữ liệu thực tế từ Supabase (dù rỗng [])
          return products;
        }
      } catch (err) {
        console.error('[dbService] Supabase getProducts error:', err);
      }
      return [];
    }

    // Chỉ chạy khi hoàn toàn không kết nối Supabase
    const db = loadLocalDb();
    products = options?.includeInactive
      ? db.products
      : db.products.filter((p) => p.is_active);

    if (options?.categorySlug) {
      products = products.filter((p) => p.category_slug === options.categorySlug);
    }
    if (options?.search && options.search.trim() !== '') {
      const q = options.search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.short_desc.toLowerCase().includes(q) ||
          p.sub_section.toLowerCase().includes(q)
      );
    }
    return products;
  },

  async getProductBySlugOrId(slugOrId: string): Promise<SeedProduct | null> {
    const normalizedSlug = SLUG_ALIAS_MAP[slugOrId] || slugOrId;
    const all = await this.getProducts({ includeInactive: true });
    return (
      all.find(
        (p) =>
          p.slug === normalizedSlug ||
          p.slug === slugOrId ||
          p.id === slugOrId ||
          p.code === slugOrId
      ) || null
    );
  },

  async upsertProduct(payload: Partial<SeedProduct>): Promise<SeedProduct> {
    const db = loadLocalDb();
    const categories = db.categories;
    const matchedCat =
      categories.find(
        (c) => c.slug === payload.category_slug || c.id === payload.category_id
      ) || categories[0];

    const existingIdx = db.products.findIndex(
      (p) =>
        (payload.id && p.id === payload.id) || (payload.slug && p.slug === payload.slug)
    );

    const existing = existingIdx >= 0 ? db.products[existingIdx] : null;
    const nowId = payload.id || existing?.id || `prod-${Date.now()}`;
    const cleanSlug = (
      payload.slug ||
      existing?.slug ||
      payload.code ||
      `san-pham-${Date.now()}`
    )
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '');

    const formats: SeedProductFormat[] =
      Array.isArray(payload.formats) && payload.formats.length > 0
        ? payload.formats
        : existing?.formats || [
            { format_code: 'Word', price: 229000, is_active: true },
            { format_code: 'PDF', price: 150000, is_active: true },
            { format_code: 'Flashcard', price: 100000, is_active: false },
            { format_code: 'Trang tính', price: 120000, is_active: false },
            { format_code: 'Thiết kế', price: 180000, is_active: false },
          ];

    const productRecord: SeedProduct = {
      id: nowId,
      category_id: matchedCat.id,
      category_slug: matchedCat.slug,
      category_name: matchedCat.name,
      sub_section: payload.sub_section || existing?.sub_section || 'Đề thi thử THPT/ĐGNL',
      code: payload.code || existing?.code || cleanSlug.toUpperCase(),
      title: payload.title || existing?.title || 'Tài liệu mới',
      slug: cleanSlug,
      google_form_product_name:
        payload.google_form_product_name ||
        payload.title ||
        existing?.google_form_product_name ||
        'Tài liệu mới',
      badge_text: payload.badge_text ?? existing?.badge_text ?? 'Mới',
      short_desc: payload.short_desc ?? existing?.short_desc ?? '',
      cover_tag:
        payload.cover_tag ??
        existing?.cover_tag ??
        'Dành cho\nKỳ thi THPTQG\ntừ năm 2027',
      thumbnail_url: payload.thumbnail_url ?? existing?.thumbnail_url ?? '',
      preview_type: payload.preview_type || existing?.preview_type || 'images',
      sample_pdf_source: payload.sample_pdf_source || existing?.sample_pdf_source || 'r2',
      sample_pdf_url: payload.sample_pdf_url ?? existing?.sample_pdf_url ?? '',
      watermark_enabled: payload.watermark_enabled ?? existing?.watermark_enabled ?? true,
      watermark_text:
        payload.watermark_text ||
        existing?.watermark_text ||
        'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
      preview_images: Array.isArray(payload.preview_images)
        ? payload.preview_images
        : existing?.preview_images || [],
      specs: Array.isArray(payload.specs) ? payload.specs : existing?.specs || [],
      topics: Array.isArray(payload.topics) ? payload.topics : existing?.topics || [],
      features: Array.isArray(payload.features)
        ? payload.features
        : existing?.features || [],
      is_featured: payload.is_featured ?? existing?.is_featured ?? true,
      is_combo_eligible: payload.is_combo_eligible ?? existing?.is_combo_eligible ?? true,
      is_active: payload.is_active ?? existing?.is_active ?? true,
      formats,
      detail_blocks: Array.isArray(payload.detail_blocks)
        ? payload.detail_blocks
        : existing?.detail_blocks || [],
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      const baseDbRow: Record<string, any> = {
        category_id: productRecord.category_id,
        code: productRecord.code,
        title: productRecord.title,
        slug: productRecord.slug,
        sub_section: productRecord.sub_section,
        google_form_product_name: productRecord.google_form_product_name,
        badge_text: productRecord.badge_text,
        short_desc: productRecord.short_desc,
        cover_tag: productRecord.cover_tag,
        thumbnail_url: productRecord.thumbnail_url,
        preview_type: productRecord.preview_type,
        sample_pdf_source: productRecord.sample_pdf_source,
        sample_pdf_url: productRecord.sample_pdf_url,
        watermark_enabled: productRecord.watermark_enabled,
        watermark_text: productRecord.watermark_text,
        preview_images: productRecord.preview_images,
        specs: productRecord.specs,
        topics: productRecord.topics,
        features: productRecord.features,
        is_featured: productRecord.is_featured,
        is_combo_eligible: productRecord.is_combo_eligible,
        is_active: productRecord.is_active,
      };

      // Thử lưu trực tiếp cột detail_blocks vào bảng products trước
      let { data: upsertedProd, error: prodErr } = await supabaseAdmin
        .from('products')
        .upsert(
          {
            ...baseDbRow,
            detail_blocks: productRecord.detail_blocks || [],
          },
          { onConflict: 'slug' }
        )
        .select('*')
        .single();

      // Nếu bảng products chưa chạy migration thêm cột detail_blocks, tự động lưu baseDbRow
      if (prodErr) {
        const retryRes = await supabaseAdmin
          .from('products')
          .upsert(baseDbRow, { onConflict: 'slug' })
          .select('*')
          .single();
        upsertedProd = retryRes.data;
        prodErr = retryRes.error;
      }

      // Đồng bộ lưu detail_blocks vào site_configs (product_detail_blocks:<slug>) để luôn bền vững
      if (Array.isArray(productRecord.detail_blocks)) {
        await supabaseAdmin.from('site_configs').upsert(
          {
            key: `product_detail_blocks:${productRecord.slug}`,
            value: productRecord.detail_blocks,
            description: `Cấu hình các khối động Trang cấp 2 cho tài liệu ${productRecord.slug}`,
          },
          { onConflict: 'key' }
        );
      }

      if (!prodErr && upsertedProd) {
        productRecord.id = upsertedProd.id;
        for (const fmt of productRecord.formats) {
          await supabaseAdmin.from('product_formats').upsert(
            {
              product_id: upsertedProd.id,
              format_code: fmt.format_code,
              price: fmt.price,
              is_active: fmt.is_active,
            },
            { onConflict: 'product_id,format_code' }
          );
        }
      }
    }

    if (existingIdx >= 0) {
      db.products[existingIdx] = productRecord;
    } else {
      db.products.unshift(productRecord);
    }
    saveLocalDb(db);
    return productRecord;
  },

  async deleteProduct(slugOrId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin
        .from('products')
        .delete()
        .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`);
      await supabaseAdmin
        .from('site_configs')
        .delete()
        .eq('key', `product_detail_blocks:${slugOrId}`);
    }
    const db = loadLocalDb();
    const beforeLen = db.products.length;
    db.products = db.products.filter((p) => p.slug !== slugOrId && p.id !== slugOrId);
    saveLocalDb(db);
    return db.products.length < beforeLen;
  },

  async upsertCategory(payload: Partial<SeedCategory>): Promise<SeedCategory> {
    const db = loadLocalDb();
    const cleanSlug = (payload.slug || payload.name || 'danh-muc-moi')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingIdx = db.categories.findIndex(
      (c) => (payload.id && c.id === payload.id) || (payload.slug && c.slug === payload.slug) || c.slug === cleanSlug
    );
    const existing = existingIdx >= 0 ? db.categories[existingIdx] : null;

    const categoryRecord: SeedCategory = {
      id: payload.id || existing?.id || cleanSlug,
      name: payload.name || existing?.name || 'Danh mục mới',
      slug: cleanSlug,
      description: payload.description !== undefined ? payload.description : (existing?.description || ''),
      sort_order: payload.sort_order !== undefined ? payload.sort_order : (existing?.sort_order ?? (db.categories.length + 1)),
      is_active: payload.is_active !== undefined ? payload.is_active : (existing?.is_active ?? true),
      blocks: Array.isArray(payload.blocks) ? payload.blocks : (existing?.blocks || []),
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      const baseDbRow: Record<string, any> = {
        name: categoryRecord.name,
        slug: categoryRecord.slug,
        description: categoryRecord.description,
        sort_order: categoryRecord.sort_order,
        is_active: categoryRecord.is_active,
      };

      // Thử lưu trực tiếp cột blocks vào bảng categories
      let { data: upsertedCat, error: catErr } = await supabaseAdmin
        .from('categories')
        .upsert(
          {
            ...baseDbRow,
            blocks: categoryRecord.blocks || [],
          },
          { onConflict: 'slug' }
        )
        .select('*')
        .single();

      // Nếu bảng categories chưa chạy migration thêm cột blocks, tự động lưu baseDbRow
      if (catErr) {
        const retryRes = await supabaseAdmin
          .from('categories')
          .upsert(baseDbRow, { onConflict: 'slug' })
          .select('*')
          .single();
        upsertedCat = retryRes.data;
        catErr = retryRes.error;
      }

      // Đồng bộ lưu blocks vào site_configs (category_blocks:<slug>) để luôn bền vững
      if (Array.isArray(categoryRecord.blocks)) {
        await supabaseAdmin.from('site_configs').upsert(
          {
            key: `category_blocks:${categoryRecord.slug}`,
            value: categoryRecord.blocks,
            description: `Cấu hình các khối động Trang cấp 1 cho danh mục ${categoryRecord.slug}`,
          },
          { onConflict: 'key' }
        );
      }

      if (!catErr && upsertedCat) {
        categoryRecord.id = upsertedCat.id;
      }
    }

    if (existingIdx >= 0) {
      db.categories[existingIdx] = categoryRecord;
    } else {
      db.categories.push(categoryRecord);
    }
    saveLocalDb(db);
    return categoryRecord;
  },

  async deleteCategory(slug: string): Promise<boolean> {
    const db = loadLocalDb();
    const idx = db.categories.findIndex((c) => c.slug === slug || c.id === slug);
    if (idx >= 0) {
      db.categories.splice(idx, 1);
      saveLocalDb(db);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin.from('categories').delete().eq('slug', slug);
      await supabaseAdmin.from('site_configs').delete().eq('key', `category_blocks:${slug}`);
    }
    return true;
  },

  async createOrder(order: SeedOrder): Promise<SeedOrder> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const customerNoteParts: string[] = [];
      if (order.customer_group) customerNoteParts.push(`[Nhóm: ${order.customer_group}]`);
      if (order.selected_format) customerNoteParts.push(`[Định dạng: ${order.selected_format}]`);
      if (order.flashcard_quantity) customerNoteParts.push(`[Số lượng FC: ${order.flashcard_quantity}]`);

      const insertPayload: Record<string, any> = {
        order_code: order.order_code,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone || '',
        customer_note: customerNoteParts.join(' '),
        need_invoice: Boolean(order.need_invoice),
        invoice_company: '',
        invoice_tax_code: order.invoice_tax_or_cccd || '',
        invoice_address: order.invoice_address || '',
        total_amount: order.subtotal_amount || order.total_amount,
        discount_amount: order.discount_amount || 0,
        final_amount: order.total_amount,
        status: order.payment_status === 'paid' ? 'completed' : 'pending',
        payment_status: order.payment_status || 'pending',
        payment_method: order.payment_method || 'vietqr',
      };
      if (order.user_id) {
        insertPayload.user_id = order.user_id;
      }

      const { data: insertedOrder, error } = await supabaseAdmin
        .from('orders')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && insertedOrder) {
        order.id = insertedOrder.id;
        for (const item of order.items) {
          await supabaseAdmin.from('order_items').insert({
            order_id: insertedOrder.id,
            product_title: item.product_title,
            google_form_product_name: item.google_form_product_name || '',
            format_code: item.format_code,
            unit_price: item.unit_price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          });
        }
      }
    }

    const db = loadLocalDb();
    db.orders.unshift(order);
    saveLocalDb(db);
    return order;
  },

  async getOrderByCode(orderCode: string): Promise<SeedOrder | null> {
    const normalized = orderCode.trim().toUpperCase();
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_code', normalized)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          user_id: data.user_id || null,
          order_code: data.order_code,
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          customer_group: data.customer_group,
          selected_format: data.selected_format as UiFormatCode,
          flashcard_quantity: data.flashcard_quantity,
          need_invoice: Boolean(data.need_invoice),
          invoice_tax_or_cccd: data.invoice_tax_or_cccd || '',
          invoice_address: data.invoice_address || '',
          subtotal_amount: Number(data.subtotal_amount),
          discount_percent: Number(data.discount_percent),
          discount_amount: Number(data.discount_amount),
          total_amount: Number(data.total_amount),
          payment_method: data.payment_method,
          payment_status: data.payment_status,
          payment_ref_id: data.payment_ref_id,
          paid_at: data.paid_at,
          google_form_submitted: Boolean(data.google_form_submitted),
          created_at: data.created_at,
          items: Array.isArray(data.order_items)
            ? data.order_items.map((it: any) => ({
                product_id: it.product_id || '',
                product_title: it.product_title,
                google_form_product_name: it.google_form_product_name,
                format_code: it.format_code as UiFormatCode,
                unit_price: Number(it.unit_price),
                quantity: Number(it.quantity),
                subtotal: Number(it.subtotal),
              }))
            : [],
        };
      }
    }

    const db = loadLocalDb();
    return db.orders.find((o) => o.order_code.toUpperCase() === normalized) || null;
  },

  async getAllOrders(): Promise<SeedOrder[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          user_id: row.user_id || null,
          order_code: row.order_code,
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          customer_phone: row.customer_phone,
          customer_group: row.customer_group,
          selected_format: row.selected_format as UiFormatCode,
          flashcard_quantity: row.flashcard_quantity,
          need_invoice: Boolean(row.need_invoice),
          invoice_tax_or_cccd: row.invoice_tax_or_cccd || '',
          invoice_address: row.invoice_address || '',
          subtotal_amount: Number(row.subtotal_amount),
          discount_percent: Number(row.discount_percent),
          discount_amount: Number(row.discount_amount),
          total_amount: Number(row.total_amount),
          payment_method: row.payment_method,
          payment_status: row.payment_status,
          payment_ref_id: row.payment_ref_id,
          paid_at: row.paid_at,
          google_form_submitted: Boolean(row.google_form_submitted),
          created_at: row.created_at,
          items: Array.isArray(row.order_items)
            ? row.order_items.map((it: any) => ({
                product_id: it.product_id || '',
                product_title: it.product_title,
                google_form_product_name: it.google_form_product_name,
                format_code: it.format_code as UiFormatCode,
                unit_price: Number(it.unit_price),
                quantity: Number(it.quantity),
                subtotal: Number(it.subtotal),
              }))
            : [],
        }));
      }
    }
    const db = loadLocalDb();
    return db.orders;
  },

  async updateOrderStatus(
    orderCode: string,
    updates: {
      payment_status?: 'pending' | 'paid' | 'failed';
      payment_ref_id?: string;
      paid_at?: string;
      google_form_submitted?: boolean;
    }
  ): Promise<SeedOrder | null> {
    const normalized = orderCode.trim().toUpperCase();
    if (isSupabaseConfigured && supabaseAdmin) {
      const supabaseUpdates: Record<string, any> = {};
      if (updates.payment_status !== undefined) {
        supabaseUpdates.payment_status = updates.payment_status;
        if (updates.payment_status === 'paid') {
          supabaseUpdates.status = 'completed';
        }
      }
      if (updates.paid_at !== undefined) {
        supabaseUpdates.paid_at = updates.paid_at;
      }
      supabaseUpdates.updated_at = new Date().toISOString();
      await supabaseAdmin.from('orders').update(supabaseUpdates).eq('order_code', normalized);
    }

    const db = loadLocalDb();
    const idx = db.orders.findIndex((o) => o.order_code.toUpperCase() === normalized);
    let updatedOrder: SeedOrder | null = null;
    if (idx >= 0) {
      db.orders[idx] = {
        ...db.orders[idx],
        ...updates,
      };
      saveLocalDb(db);
      updatedOrder = db.orders[idx];
    } else {
      updatedOrder = await this.getOrderByCode(normalized);
    }

    if (updates.payment_status === 'paid' && updatedOrder) {
      await this.grantOrderToUserLibrary(updatedOrder);
    }

    return updatedOrder;
  },

  async logGoogleFormSubmission(log: {
    order_id?: string;
    order_code: string;
    product_name: string;
    payload: Record<string, string>;
    http_status: number;
    is_success: boolean;
    error_message?: string;
  }): Promise<void> {
    if (isSupabaseConfigured && supabaseAdmin && log.order_id) {
      await supabaseAdmin.from('google_form_logs').insert({
        order_id: log.order_id,
        product_name: log.product_name,
        payload: log.payload,
        http_status: log.http_status,
        is_success: log.is_success,
        error_message: log.error_message || null,
      });
    }
  },

  // ====================================================================
  // QUẢN LÝ TÀI KHOẢN (PUBLIC.USERS), SESSION (PUBLIC.USER_SESSIONS)
  // VÀ TỦ SÁCH CÁ NHÂN (PUBLIC.USER_LIBRARY)
  // ====================================================================

  async getUserByEmail(email: string): Promise<SeedUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (error) handleSupabaseAuthError(error);
      if (!error && data) {
        return data as SeedUser;
      }
    }
    const db = loadLocalDb();
    return db.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  async getUserById(id: string): Promise<SeedUser | null> {
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) handleSupabaseAuthError(error);
      if (!error && data) {
        return data as SeedUser;
      }
    }
    const db = loadLocalDb();
    return db.users.find((u) => u.id === id) || null;
  },

  async getUserByResetToken(token: string): Promise<SeedUser | null> {
    const cleanToken = token.trim();
    if (!cleanToken) return null;
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('reset_password_token', cleanToken)
        .maybeSingle();
      if (error) handleSupabaseAuthError(error);
      if (!error && data) {
        return data as SeedUser;
      }
    }
    const db = loadLocalDb();
    return db.users.find((u) => u.reset_password_token === cleanToken) || null;
  },

  async createUser(payload: {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    role?: 'user' | 'admin';
    customer_group?: 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác';
    school_or_org?: string;
  }): Promise<SeedUser> {
    const nowIso = new Date().toISOString();
    const validGroups = ['Giáo viên', 'Học sinh', 'Phụ huynh', 'Khác'] as const;
    const group =
      payload.customer_group && validGroups.includes(payload.customer_group)
        ? payload.customer_group
        : 'Giáo viên';

    let newUser: SeedUser = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      email: payload.email.trim().toLowerCase(),
      password_hash: payload.password_hash,
      full_name: payload.full_name.trim(),
      phone: (payload.phone || '').trim(),
      role: payload.role === 'admin' ? 'admin' : 'user',
      customer_group: group,
      school_or_org: (payload.school_or_org || '').trim(),
      default_tax_cccd: '',
      default_invoice_address: '',
      reset_password_token: null,
      reset_password_expires_at: null,
      email_verified: false,
      is_active: true,
      last_login_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: newUser.email,
          password_hash: newUser.password_hash,
          full_name: newUser.full_name,
          phone: newUser.phone,
          role: newUser.role,
          customer_group: newUser.customer_group,
          school_or_org: newUser.school_or_org,
          default_tax_cccd: newUser.default_tax_cccd,
          default_invoice_address: newUser.default_invoice_address,
          email_verified: newUser.email_verified,
          is_active: newUser.is_active,
          last_login_at: newUser.last_login_at,
        })
        .select('*')
        .single();
      if (error) handleSupabaseAuthError(error);
      if (!error && data) {
        newUser = data as SeedUser;
      }
    }

    const db = loadLocalDb();
    const existingIdx = db.users.findIndex(
      (u) => u.email.toLowerCase() === newUser.email.toLowerCase()
    );
    if (existingIdx >= 0) {
      db.users[existingIdx] = newUser;
    } else {
      db.users.push(newUser);
    }
    saveLocalDb(db);

    await this.syncPaidOrdersToUserLibrary(newUser);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<SeedUser>): Promise<SeedUser | null> {
    const nowIso = new Date().toISOString();
    const cleanUpdates = { ...updates, updated_at: nowIso };

    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(cleanUpdates)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) handleSupabaseAuthError(error);
      if (!error && data) {
        const db = loadLocalDb();
        const idx = db.users.findIndex((u) => u.id === id || u.email === data.email);
        if (idx >= 0) {
          db.users[idx] = { ...db.users[idx], ...(data as SeedUser) };
          saveLocalDb(db);
        }
        return data as SeedUser;
      }
    }

    const db = loadLocalDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    db.users[idx] = {
      ...db.users[idx],
      ...cleanUpdates,
    };
    saveLocalDb(db);
    return db.users[idx];
  },

  async getAllUsers(): Promise<SeedUser[]> {
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) handleSupabaseAuthError(error);
      if (!error && data && data.length > 0) {
        return data as SeedUser[];
      }
    }
    const db = loadLocalDb();
    return db.users;
  },

  async createSession(params: {
    user_id: string;
    session_token: string;
    user_agent?: string;
    ip_address?: string;
    expires_at: string;
  }): Promise<SeedUserSession> {
    const nowIso = new Date().toISOString();
    let sessionRecord: SeedUserSession = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      user_id: params.user_id,
      session_token: params.session_token,
      user_agent: (params.user_agent || 'Trình duyệt Web').slice(0, 500),
      ip_address: (params.ip_address || '127.0.0.1').slice(0, 64),
      is_revoked: false,
      expires_at: params.expires_at,
      last_active_at: nowIso,
      created_at: nowIso,
    };

    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('user_sessions')
        .insert({
          user_id: sessionRecord.user_id,
          session_token: sessionRecord.session_token,
          user_agent: sessionRecord.user_agent,
          ip_address: sessionRecord.ip_address,
          is_revoked: false,
          expires_at: sessionRecord.expires_at,
          last_active_at: nowIso,
        })
        .select('*')
        .single();
      if (error) handleSupabaseAuthError(error);
      if (!error && data) {
        sessionRecord = data as SeedUserSession;
      }
    }

    const db = loadLocalDb();
    db.user_sessions.unshift(sessionRecord);
    saveLocalDb(db);
    return sessionRecord;
  },

  async getSessionByToken(token: string): Promise<SeedUserSession | null> {
    const cleanToken = token.trim();
    if (!cleanToken) return null;

    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('session_token', cleanToken)
        .maybeSingle();
      if (error) handleSupabaseAuthError(error);
      if (!error && data) {
        return data as SeedUserSession;
      }
    }

    const db = loadLocalDb();
    return db.user_sessions.find((s) => s.session_token === cleanToken) || null;
  },

  async touchSession(sessionId: string, token: string): Promise<void> {
    const nowIso = new Date().toISOString();
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ last_active_at: nowIso })
        .eq('id', sessionId);
      if (error) handleSupabaseAuthError(error);
    }
    const db = loadLocalDb();
    const idx = db.user_sessions.findIndex(
      (s) => s.id === sessionId || s.session_token === token
    );
    if (idx >= 0) {
      db.user_sessions[idx].last_active_at = nowIso;
      saveLocalDb(db);
    }
  },

  async revokeSessionByToken(token: string): Promise<boolean> {
    const cleanToken = token.trim();
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_revoked: true })
        .eq('session_token', cleanToken);
      if (error) handleSupabaseAuthError(error);
    }
    const db = loadLocalDb();
    let changed = false;
    for (const s of db.user_sessions) {
      if (s.session_token === cleanToken && !s.is_revoked) {
        s.is_revoked = true;
        changed = true;
      }
    }
    if (changed) saveLocalDb(db);
    return changed;
  },

  async revokeSessionById(userId: string, sessionId: string): Promise<boolean> {
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_revoked: true })
        .eq('id', sessionId)
        .eq('user_id', userId);
      if (error) handleSupabaseAuthError(error);
    }
    const db = loadLocalDb();
    let changed = false;
    for (const s of db.user_sessions) {
      if (s.id === sessionId && s.user_id === userId && !s.is_revoked) {
        s.is_revoked = true;
        changed = true;
      }
    }
    if (changed) saveLocalDb(db);
    return changed;
  },

  async revokeAllUserSessions(userId: string): Promise<number> {
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_revoked: true })
        .eq('user_id', userId);
      if (error) handleSupabaseAuthError(error);
    }
    const db = loadLocalDb();
    let count = 0;
    for (const s of db.user_sessions) {
      if (s.user_id === userId && !s.is_revoked) {
        s.is_revoked = true;
        count++;
      }
    }
    if (count > 0) saveLocalDb(db);
    return count;
  },

  async getActiveSessionCountMap(): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    const nowIso = new Date().toISOString();
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('user_sessions')
        .select('user_id')
        .eq('is_revoked', false)
        .gt('expires_at', nowIso);
      if (!error && data) {
        for (const s of data) {
          if (s.user_id) {
            counts.set(s.user_id, (counts.get(s.user_id) || 0) + 1);
          }
        }
        return counts;
      }
    }
    const db = loadLocalDb();
    const now = new Date();
    for (const s of db.user_sessions) {
      if (!s.is_revoked && new Date(s.expires_at) > now) {
        counts.set(s.user_id, (counts.get(s.user_id) || 0) + 1);
      }
    }
    return counts;
  },

  async getUserSessions(userId: string): Promise<SeedUserSession[]> {
    const now = new Date();
    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_revoked', false)
        .order('last_active_at', { ascending: false });
      if (error) handleSupabaseAuthError(error);
      if (!error && data && data.length > 0) {
        return (data as SeedUserSession[]).filter((s) => new Date(s.expires_at) > now);
      }
    }
    const db = loadLocalDb();
    return db.user_sessions
      .filter((s) => s.user_id === userId && !s.is_revoked && new Date(s.expires_at) > now)
      .sort(
        (a, b) =>
          new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime()
      );
  },

  async grantOrderToUserLibrary(order: SeedOrder): Promise<void> {
    let targetUser: SeedUser | null = null;
    if (order.user_id) {
      targetUser = await this.getUserById(order.user_id);
    }
    if (!targetUser && order.customer_email) {
      targetUser = await this.getUserByEmail(order.customer_email);
    }
    if (!targetUser) return;

    const allProducts = await this.getProducts({ includeInactive: true });
    const db = loadLocalDb();
    let localChanged = false;

    for (const item of order.items) {
      const matchedProduct = allProducts.find(
        (p) =>
          p.id === item.product_id ||
          p.slug === item.product_id ||
          p.title === item.product_title
      );
      const productSlug = matchedProduct?.slug || item.product_id || 'tai-lieu';
      const watermarkedUrl = matchedProduct?.sample_pdf_url || '';

      if (shouldTrySupabaseAuth() && supabaseAdmin) {
        const { data: existingLib, error } = await supabaseAdmin
          .from('user_library')
          .select('id')
          .eq('user_id', targetUser.id)
          .eq('product_slug', productSlug)
          .eq('format_code', item.format_code)
          .maybeSingle();
        if (error) handleSupabaseAuthError(error);

        if (!error && !existingLib) {
          const insertPayload: Record<string, any> = {
            user_id: targetUser.id,
            order_code: order.order_code,
            product_slug: productSlug,
            product_title: item.product_title,
            format_code: item.format_code,
            access_drive_url: '',
            watermarked_pdf_url: watermarkedUrl,
            is_active: true,
          };
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (order.id && uuidRegex.test(order.id)) {
            insertPayload.order_id = order.id;
          }
          await supabaseAdmin.from('user_library').insert(insertPayload);
        }
      }

      const existsInLocal = db.user_library.some(
        (lib) =>
          lib.user_id === targetUser!.id &&
          lib.product_slug === productSlug &&
          lib.format_code === item.format_code
      );
      if (!existsInLocal) {
        db.user_library.unshift({
          id: `lib-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          user_id: targetUser.id,
          order_id: order.id,
          order_code: order.order_code,
          product_slug: productSlug,
          product_title: item.product_title,
          format_code: item.format_code,
          access_drive_url: '',
          watermarked_pdf_url: watermarkedUrl,
          download_count: 0,
          is_active: true,
          granted_at: new Date().toISOString(),
        });
        localChanged = true;
      }
    }

    if (localChanged) {
      saveLocalDb(db);
    }
  },

  async syncPaidOrdersToUserLibrary(user: SeedUser): Promise<void> {
    const orders = await this.getAllOrders();
    const userPaidOrders = orders.filter(
      (o) =>
        o.payment_status === 'paid' &&
        (o.user_id === user.id ||
          o.customer_email.toLowerCase() === user.email.toLowerCase())
    );
    for (const ord of userPaidOrders) {
      await this.grantOrderToUserLibrary({ ...ord, user_id: user.id });
    }
  },

  async getUserLibrary(userId: string): Promise<SeedUserLibraryItem[]> {
    const user = await this.getUserById(userId);
    if (user) {
      await this.syncPaidOrdersToUserLibrary(user);
    }

    if (shouldTrySupabaseAuth() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('user_library')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('granted_at', { ascending: false });
      if (error) handleSupabaseAuthError(error);
      if (!error && data && data.length > 0) {
        return data as SeedUserLibraryItem[];
      }
    }

    const db = loadLocalDb();
    return db.user_library.filter((item) => item.user_id === userId && item.is_active);
  },

  async getUserOrders(userId: string, email: string): Promise<SeedOrder[]> {
    const allOrders = await this.getAllOrders();
    const cleanEmail = email.trim().toLowerCase();
    return allOrders.filter(
      (o) =>
        o.user_id === userId || o.customer_email.trim().toLowerCase() === cleanEmail
    );
  },
};
