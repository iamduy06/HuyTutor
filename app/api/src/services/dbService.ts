import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import {
  INITIAL_MENUS,
  INITIAL_CATEGORIES,
  INITIAL_COMBO_RULES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
} from '../config/seedData';
import { UiFormatCode } from '../constants/formatMapping';

export interface SeedMenu {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
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

export interface DbState {
  menus: SeedMenu[];
  categories: SeedCategory[];
  combo_rules: SeedComboRule[];
  products: SeedProduct[];
  orders: SeedOrder[];
}

const DATA_DIR = path.join(__dirname, '../../data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'local_db.json');

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

  return {
    menus,
    categories,
    combo_rules,
    products,
    orders,
  };
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
    if (!parsed.products || parsed.products.length < 20) {
      const refreshed = buildNormalizedSeedState();
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(refreshed, null, 2), 'utf-8');
      return refreshed;
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
      let query = supabaseAdmin.from('menus').select('*').order('sort_order', { ascending: true });
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as SeedMenu[];
      }
    }
    const db = loadLocalDb();
    const list = includeInactive ? db.menus : db.menus.filter((m) => m.is_active);
    return list.sort((a, b) => a.sort_order - b.sort_order);
  },

  async updateMenus(menus: SeedMenu[]): Promise<SeedMenu[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      for (const m of menus) {
        await supabaseAdmin.from('menus').upsert({
          id: m.id,
          title: m.title,
          slug: m.slug,
          parent_id: m.parent_id,
          sort_order: m.sort_order,
          is_active: m.is_active,
        });
      }
    }
    const db = loadLocalDb();
    db.menus = menus;
    saveLocalDb(db);
    return db.menus;
  },

  async getCategories(): Promise<SeedCategory[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as SeedCategory[];
      }
    }
    const db = loadLocalDb();
    return db.categories.filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order);
  },

  async getComboRules(): Promise<SeedComboRule[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('combo_rules')
        .select('*')
        .eq('is_active', true)
        .order('min_quantity', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as SeedComboRule[];
      }
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
      let query = supabaseAdmin
        .from('products')
        .select('*, categories(slug, name), product_formats(*)');
      if (!options?.includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        products = data.map((row: any) => ({
          id: row.id,
          category_id: row.category_id,
          category_slug: row.categories?.slug || 'high-school',
          category_name: row.categories?.name || 'Tài liệu THPT',
          sub_section: row.sub_section || 'Đề thi thử THPT/ĐGNL',
          code: row.code,
          title: row.title,
          slug: row.slug,
          google_form_product_name: row.google_form_product_name,
          badge_text: row.badge_text || 'Mới',
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
        }));
      }
    }

    if (products.length === 0) {
      const db = loadLocalDb();
      products = options?.includeInactive
        ? db.products
        : db.products.filter((p) => p.is_active);
    }

    if (options?.categorySlug) {
      if (options.categorySlug === 'other') {
        products = products.filter(
          (p) =>
            p.category_slug === 'other' ||
            p.slug === '2500-collocations' ||
            p.slug === '1400caucumdongtuintermediate'
        );
      } else if (options.categorySlug === 'template' || options.categorySlug === 'do-dung-day-hoc') {
        products = products.filter(
          (p) =>
            p.category_slug === options.categorySlug ||
            p.slug === 'mau-thu-hoc-phi' ||
            p.slug === 'flashcard-tu-vung'
        );
      } else {
        products = products.filter((p) => p.category_slug === options.categorySlug);
      }
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
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: upsertedProd, error: prodErr } = await supabaseAdmin
        .from('products')
        .upsert(
          {
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
          },
          { onConflict: 'slug' }
        )
        .select('*')
        .single();

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
    }
    const db = loadLocalDb();
    const beforeLen = db.products.length;
    db.products = db.products.filter((p) => p.slug !== slugOrId && p.id !== slugOrId);
    saveLocalDb(db);
    return db.products.length < beforeLen;
  },

  async createOrder(order: SeedOrder): Promise<SeedOrder> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: insertedOrder, error } = await supabaseAdmin
        .from('orders')
        .insert({
          order_code: order.order_code,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          customer_group: order.customer_group,
          selected_format: order.selected_format,
          flashcard_quantity: order.flashcard_quantity,
          need_invoice: order.need_invoice,
          invoice_tax_or_cccd: order.invoice_tax_or_cccd,
          invoice_address: order.invoice_address,
          subtotal_amount: order.subtotal_amount,
          discount_percent: order.discount_percent,
          discount_amount: order.discount_amount,
          total_amount: order.total_amount,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          google_form_submitted: order.google_form_submitted,
        })
        .select('*')
        .single();

      if (!error && insertedOrder) {
        order.id = insertedOrder.id;
        for (const item of order.items) {
          await supabaseAdmin.from('order_items').insert({
            order_id: insertedOrder.id,
            product_title: item.product_title,
            google_form_product_name: item.google_form_product_name,
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
      await supabaseAdmin.from('orders').update(updates).eq('order_code', normalized);
    }

    const db = loadLocalDb();
    const idx = db.orders.findIndex((o) => o.order_code.toUpperCase() === normalized);
    if (idx >= 0) {
      db.orders[idx] = {
        ...db.orders[idx],
        ...updates,
      };
      saveLocalDb(db);
      return db.orders[idx];
    }
    return null;
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
};
