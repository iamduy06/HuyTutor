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

export const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: 'dgnl-bca',
    category_id: 'high-school',
    section_group: 'de-thi-thu',
    title: '30 đề thi thử ngôn ngữ Anh - Đánh giá năng lực Bộ Công an',
    short_title: '30 đề ĐGNL BCA',
    slug: 'dgnlbca',
    google_form_product_name: '30 đề thi thử ngôn ngữ Anh - Đánh giá năng lực Bộ Công an',
    badge: 'Mới',
    subtitle: 'Luyện từ cơ bản đến nâng cao',
    cefr_level: 'B1 - C2',
    grade: 'Lớp 12 & Ôn thi BCA',
    description: 'Biên soạn bởi Huy Tutor • Bám sát ma trận đề thi tuyển sinh CAND mới nhất kèm bản dịch song ngữ và giải thích 100% câu hỏi.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72tNyXDWQYtHUFJH_2KV1n1twU4Q1Rg0GG8JQCGASVCrTxcnWeVwXyR7MTu4Xm3mFmJS7505nrmIUkIc9Ad3-MYrQU7r10joFqtl9SLU5T_KsD4CBM_qO8tKu4npy-JEZFgru_UWX9j4t8sYzQGvX57xIKV3tGZYeCVNVW0TC-8c_Li3mEhzLSDutP1JKJSFJH4pnBdREPQkTmdpoxuW_2RJar0lbq5ozCxbTgjJeVs',
    r2_demo_images_urls: [
      'https://media.huytutor.edu.vn/previews/dgnlbca-page-1.webp',
      'https://media.huytutor.edu.vn/previews/dgnlbca-page-2.webp',
      'https://media.huytutor.edu.vn/previews/dgnlbca-page-3.webp'
    ],
    preview_type: 'pdf',
    sample_pdf_source: 'r2',
    sample_pdf_url: 'https://media.huytutor.edu.vn/samples/sample_dgnlbca.pdf',
    sample_title: 'Trích đoạn Đọc thử: Đề số 1 - Chủ đề Habitats (Môi trường sống)',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [
      { label: 'Số lượng đề', val: '30 đề thi chuẩn chỉnh 100% bám sát ma trận đề thi BCA mới nhất' },
      { label: 'Cấu trúc độ khó', val: '5 đề khởi động (B1-B2) | 5 đề chạy đà (B2) | 10 đề bứt phá (B2-C1) | 10 đề tinh hoa (C1-C2)' },
      { label: 'Bản dịch & Giải thích', val: 'Bản dịch tiếng Việt trọn vẹn từng bài đọc + Giải thích 100% câu hỏi' },
      { label: 'Quà tặng kèm', val: 'Tặng kèm toàn bộ thẻ Flashcard từ vựng online cho từng đề thi' }
    ],
    topics: [
      '5 Đề Khởi Động (Cấp độ B1-B2): Ôn tập kiến thức ngữ pháp nền tảng và phản xạ từ vựng cơ bản.',
      '5 Đề Chạy Đà (Cấp độ B2): Làm quen với các dạng câu hỏi bẫy logic và bài đọc thời sự xã hội.',
      '10 Đề Bứt Phá (Cấp độ B2-C1): Rèn luyện tốc độ làm bài 50 phút và xử lý bài đọc phân hóa mạnh.',
      '10 Đề Tinh Hoa (Cấp độ C1-C2): Chinh phục điểm 9-10 dành cho thí sinh xét tuyển Học viện ANND, CSND.'
    ],
    features: [
      'Tài liệu chính chủ soạn mới, chuẩn xác về mặt văn phong pháp luật, thời sự, khoa học.',
      'Có bảng từ vựng học thuật (Academic Vocabulary) được bóc tách và giải nghĩa chi tiết cho từng bài đọc.',
      'File Word bản đẹp không header/watermark, dễ dàng căn chỉnh in ấn thành đề thi chính thức cho học sinh.'
    ],
    sample_pages_text: [
      {
        page: 1,
        header: 'ĐỀ SỐ 01 - ĐGNL BỘ CÔNG AN',
        title: 'SECTION 1: LANGUAGE & VOCABULARY KNOWLEDGE',
        body: 'Question 1: The newly enacted environmental legislation aims to ________ harmful industrial emissions by 40% before 2030.\nA. curb      B. trigger      C. stimulate      D. augment',
        note: 'Bản dịch & Giải thích: Đạo luật môi trường mới ban hành nhằm mục đích kiềm chế (curb) lượng khí thải công nghiệp độc hại trước năm 2030. Chọn A (curb = control/restrain).'
      },
      {
        page: 2,
        header: 'ĐỀ SỐ 01 - ĐỌC HIỂU HỌC THUẬT',
        title: 'SECTION 2: READING COMPREHENSION - PASSAGE 1 (HABITATS)',
        body: 'Marine biodiversity plays an indispensable role in maintaining the equilibrium of global climate systems. Coral reefs, often colloquially termed the rainforests of the ocean, provide sanctuary and sustenance for more than a quarter of all marine species despite occupying less than one percent of the ocean floor...',
        note: 'Bản dịch song ngữ: Đa dạng sinh học biển đóng một vai trò không thể thiếu trong việc duy trì sự cân bằng của các hệ thống khí hậu toàn cầu. Các rạn san hô cung cấp nơi trú ngụ và thức ăn cho hơn 25% các loài sinh vật biển...'
      },
      {
        page: 3,
        header: 'BẢNG TỪ VỰNG HỌC THUẬT (ACADEMIC VOCABULARY)',
        title: 'SECTION 3: VOCABULARY BREAKDOWN & SYNONYMS',
        body: '1. Biodiversity (n) /ˌbaɪ.oʊ.daɪˈvɝː.sə.t̬i/: Đa dạng sinh học (= ecological variety)\n2. Equilibrium (n) /ˌek.wəˈlɪb.ri.əm/: Trạng thái cân bằng (= balance, stability)\n3. Indispensable (adj) /ˌɪn.dɪˈspen.sə.bəl/: Không thể thiếu được (= essential, crucial)',
        note: 'Học sinh được cấp quyền truy cập bộ thẻ Flashcard tương ứng để luyện phát âm chuẩn UK/US cho toàn bộ bảng từ vựng này.'
      }
    ],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 380000, original_price: 450000, gdrive_folder_id: '1BCA_WORD_FOLDER', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 190000, original_price: 240000, gdrive_folder_id: '1BCA_PDF_FOLDER', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 1
  },
  {
    id: 'dot-pha-b2-c2',
    category_id: 'high-school',
    section_group: 'de-thi-thu',
    title: 'Đột phá đề thi THPTQG môn Tiếng Anh (B2-C2)',
    short_title: '30 đề nâng cao B2-C2',
    slug: 'dot-pha-b2-c2',
    google_form_product_name: '30 đề đột phá đề thi THPTQG môn Tiếng Anh (B2-C2)',
    badge: 'Mới',
    subtitle: 'Dành cho Kỳ thi THPTQG từ năm 2025',
    cefr_level: 'B2 - C2',
    grade: 'Lớp 12',
    description: 'Bộ đề phân hóa chuyên sâu dành cho học sinh mục tiêu 9+ và thi khối chuyên D1, D7. Chú trọng từ vựng học thuật C1-C2.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72ujgnJh7XLoickVXNerCv15aSNzsHvEfgznQkATerq-bMt5lsJNxX5WC5AHxSfnckgPI-Q8Ik4R_sjVACsqxaiPnY_tsGhD9gY_yVzkZeqYKvaX334RtrTCm3rtDHpJbJHutrNAk9OQMDvJv87KjD7SZQ5fl5mc2W7aN-T5YENuYPFyB6_BPl0KyNXZXab4clQQUvctfSD0Yg32eIf9jy1HfzyjBbyVrZfWvtGU',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1DotPhaB2C2Sample/preview',
    sample_title: 'Trích đoạn Đọc thử: Đề nâng cao số 01 - Mục tiêu 9+',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [
      { label: 'Số lượng đề', val: '30 đề thi nâng cao phân hóa mức độ B2 - C1 - C2' },
      { label: 'Đối tượng', val: 'Học sinh mục tiêu 9.0+ THPTQG & Giáo viên ôn luyện đội tuyển' },
      { label: 'Bản dịch & Giải thích', val: 'Dịch nghĩa song ngữ toàn bộ bài đọc + Phân tích bẫy tư duy' },
      { label: 'Quà tặng kèm', val: 'Tặng kèm tài khoản Flashcard từ vựng C1-C2' }
    ],
    topics: [
      '10 Đề Phân Hóa B2-C1: Làm chủ dạng bài đọc điền thông báo, tờ rơi học thuật.',
      '10 Đề Thực Chiến C1: Xử lý bài đọc hiểu 8 câu chủ đề Khoa học, Kinh tế, Môi trường.',
      '10 Đề Đỉnh Cao C1-C2: Chinh phục các câu hỏi Idioms, Collocations và suy luận phức tạp.'
    ],
    features: [
      'Bám sát 100% định dạng đề thi tốt nghiệp THPT mới nhất của Bộ GD&ĐT.',
      'Giải thích chi tiết vì sao đáp án đúng và vì sao các phương án nhiễu lại sai.',
      'File Word trình bày khoa học, chuẩn phông chữ, sẵn sàng in ấn.'
    ],
    sample_pages_text: [
      {
        page: 1,
        header: 'ĐỀ NÂNG CAO SỐ 01 (B2-C2)',
        title: 'READ THE FOLLOWING ADVERTISEMENT AND MARK THE CORRECT OPTION',
        body: 'Embarking on a career in artificial intelligence requires not only technical prowess but also an unwavering commitment to ethical innovation...',
        note: 'Bản dịch & Giải thích: Bắt đầu sự nghiệp trong lĩnh vực trí tuệ nhân tạo đòi hỏi không chỉ năng lực kỹ thuật (technical prowess) mà còn cả sự cam kết kiên định (unwavering commitment)...'
      }
    ],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 185000, original_price: 230000, gdrive_folder_id: '1DOTPHA_WORD', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 125000, original_price: 160000, gdrive_folder_id: '1DOTPHA_PDF', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 2
  },
  {
    id: 'bo-de-chuan-cau-truc',
    category_id: 'high-school',
    section_group: 'de-thi-thu',
    title: 'Bộ đề chuẩn cấu trúc (B1-C1)',
    short_title: '30 đề chuẩn cấu trúc',
    slug: 'bo-de-chuan-cau-truc',
    google_form_product_name: 'Bộ đề chuẩn cấu trúc đề thi tốt nghiệp THPT (B1-C1)',
    badge: 'Mới',
    subtitle: 'Dành cho Kỳ thi THPTQG từ năm 2025',
    cefr_level: 'B1 - C1',
    grade: 'Lớp 12',
    description: 'Chuẩn xác 100% về tỉ lệ câu hỏi nhận biết - thông hiểu - vận dụng cao theo đề minh họa mới nhất.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72sZjVvRWBLpxtmD4X7xqTN8_IfiHQsQSZqMmvgm8eWn8QB-G7DVAgdZNvDbGgSKBxrf9BkBAOOwT2_eBLPhPYkEf-58qigmTId8Q_IMkxrd0II5hwzeLkMP9lhUiNXz4sn91hIwdhTc2Ps-hMTG8fvhEghoKPjmtHi1mfLd1AkbOGqeeaApAAlLHESsIiafu73eUQ8g9Wn_dnRkFDdVLrS61ZOdA5JThIS1qEhO',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1ChuanCauTrucSample/preview',
    sample_title: 'Trích đoạn Đọc thử: Đề chuẩn cấu trúc số 01',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [
      { label: 'Số lượng đề', val: '30 đề chuẩn cấu trúc ma trận đề minh họa mới nhất' },
      { label: 'Cấp độ', val: 'B1 - B2 - C1 phù hợp mọi đối tượng học sinh ôn thi tốt nghiệp' },
      { label: 'Lời giải', val: 'Giải thích chi tiết từng câu + Bản dịch bài đọc song ngữ' },
      { label: 'Tặng kèm', val: 'Tài khoản Flashcard luyện từ vựng theo từng đề' }
    ],
    topics: [
      'Đọc điền thông báo & tờ rơi (12 câu): Chuẩn hóa ngữ pháp & từ loại.',
      'Sắp xếp đoạn hội thoại, thư tín, đoạn văn (5 câu): Rèn tư duy mạch lạc.',
      'Đọc điền khuyết mệnh đề & Đọc hiểu 8 câu - 10 câu (23 câu).'
    ],
    features: [
      'Độ phủ từ vựng bám sát các chủ điểm SGK chương trình GDPT 2018.',
      'Tối ưu thời gian làm bài thực chiến 50 phút.'
    ],
    sample_pages_text: [
      {
        page: 1,
        header: 'ĐỀ CHUẨN CẤU TRÚC SỐ 01',
        title: 'PART 1: CLOZE TEST & ARRANGEMENT',
        body: 'Question 14: a. Hi Mark, thanks for sending over the documentary link...\nb. It was truly eye-opening to see how renewable energy is transforming rural areas.',
        note: 'Giải thích: Mở đầu thư cảm ơn (a), tiếp nối bằng nhận xét chi tiết về nội dung video (b)...'
      }
    ],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 180000, original_price: 220000, gdrive_folder_id: '1CHUAN_WORD', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 120000, original_price: 150000, gdrive_folder_id: '1CHUAN_PDF', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 3
  },
  {
    id: 'thuc-chien-b1-b2',
    category_id: 'high-school',
    section_group: 'de-thi-thu',
    title: 'Thực chiến đề thi THPTQG môn Tiếng Anh theo chủ đề (B1-B2)',
    short_title: '30 đề theo chủ đề B1-B2',
    slug: 'thuc-chien-b1-b2',
    google_form_product_name: 'Thực chiến đề thi THPTQG môn Tiếng Anh theo chủ đề (B1-B2)',
    badge: 'Mới',
    subtitle: 'Dành cho Kỳ thi THPTQG từ năm 2025',
    cefr_level: 'B1 - B2',
    grade: 'Lớp 12',
    description: '30 đề biên soạn công phu theo từng chủ đề trọng tâm bám sát ma trận mới của Bộ GD&ĐT.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72s70rFVVIFGcrJIk8E68JkX78G7PEOHGfg9AwLtBGDNo6iOtMKh05umcvwbS3JB4mZP1Mv4uwHjzihGaBvhWrPvRadItLRXG3hwI_gdjshcN6-N7d-YrOjDf_6cxA1H3J5ba9XfZTb9eRC_ACns9ucAYHHs2ehxNgiN637RfOF3VaEVzMPitiaCWI8ZxxqPK6RBw87AzO8ZDp132gAt7xQhF83fONAEfugp5Iqw',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1ThucChienSample/preview',
    sample_title: 'Trích đoạn Đọc thử: Chủ đề Environment & Green Living',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [
      { label: 'Số lượng đề', val: '30 đề phân theo 15 chủ đề cốt lõi trong chương trình THPT' },
      { label: 'Mức độ', val: 'B1 - B2 (Mục tiêu nắm chắc 7.5 - 8.5+ điểm)' }
    ],
    topics: ['Chủ đề 1: Life Stories & Cultural Identity', 'Chủ đề 2: Green Living & Urbanisation', 'Chủ đề 3: Career Paths & Lifelong Learning'],
    features: ['Hệ thống hóa từ vựng theo chủ đề giúp học sinh nhớ sâu và không bị ngợp trước bài đọc dài.'],
    sample_pages_text: [
      {
        page: 1,
        header: 'CHỦ ĐỀ 01: GREEN LIVING',
        title: 'PRACTICE TEST 01',
        body: 'Adopting a zero-waste lifestyle begins with mindful consumption and reducing single-use plastics in daily routines...',
        note: 'Bản dịch: Áp dụng lối sống không rác thải bắt đầu từ việc tiêu dùng có ý thức...'
      }
    ],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 180000, original_price: 220000, gdrive_folder_id: '1THUCCHIEN_W', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 120000, original_price: 150000, gdrive_folder_id: '1THUCCHIEN_P', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 4
  },
  {
    id: '30-de-chot-ha',
    category_id: 'high-school',
    section_group: 'de-thi-thu',
    title: '30 đề chốt hạ - bứt phá 9+',
    short_title: '30 đề chốt hạ',
    slug: '30-de-chot-ha',
    google_form_product_name: '30 đề chốt hạ - bứt phá 9+ kỳ thi tốt nghiệp THPT',
    badge: 'Mới',
    subtitle: 'Dành cho Kỳ thi THPTQG từ năm 2025',
    cefr_level: 'B2 - C1',
    grade: 'Lớp 12',
    description: 'Bộ đề tổng ôn giai đoạn nước rút với các câu hỏi phân loại then chốt và các bẫy thường gặp.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72vMedCMROzOfUS5iOw6SO6dsARSiNc3nrOfJpOWY4_kgwrw9sCzUoghxThApBbucml580z_XuDZ5EXLCuPciKzeyciX0kjEkM0Q0M5Su0ax9iR05rcbwinZDm7nOwws9akl_ET8niXtWx6vtiWtd8iWNlwp5t1d30zY67P0MUr15HSAhWJAQzC8KbcoNyxeDQUItz8Vwa_JzqkADKifC0L8m4aHXyWw2rR7c5mk',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1ChotHaSample/preview',
    sample_title: 'Trích đoạn Đọc thử: Đề chốt hạ số 01',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [
      { label: 'Số lượng đề', val: '30 đề thực chiến giai đoạn về đích' },
      { label: 'Quà tặng kèm', val: 'Flashcard tổng ôn từ vựng trọng điểm' }
    ],
    topics: ['Tổng rà soát các cấu trúc ngữ pháp hay sai và từ vựng đa nghĩa.'],
    features: ['Sát với xu hướng ra đề thực tế của các Sở GD&ĐT trên toàn quốc.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 180000, original_price: 220000, gdrive_folder_id: '1CHOTHA_W', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 120000, original_price: 150000, gdrive_folder_id: '1CHOTHA_P', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 5
  },
  {
    id: 'chuyen-de-nen-tang',
    category_id: 'high-school',
    section_group: 'bo-tro',
    title: 'Chuyên đề nền tảng tốt nghiệp THPT môn Tiếng Anh',
    short_title: 'Chuyên đề nền tảng THPT',
    slug: 'chuyen-de-nen-tang',
    google_form_product_name: 'Chuyên đề nền tảng tốt nghiệp THPT môn tiếng Anh',
    badge: 'Chính chủ',
    subtitle: 'Dành cho Kỳ thi THPTQG',
    cefr_level: 'B1 - B2',
    grade: 'Lớp 12',
    description: 'Tổng hợp hệ thống ngữ pháp cốt lõi và phương pháp xử lý từng dạng bài trong cấu trúc đề thi mới.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72uko-u7GHX1GZ-STp4OuDas4_fvHQWC5K9ew5qvUyBfdXCev_G0ltdKcxgFHx-0Fs_PZ3r5VKEAJW1_38pgoQ808fr9cvCBJp7eGeM05MGOPhFwoqaVKCmPFVlYvaU8JaFh97z6JKo7u5gJpq6AnOvRGzkQzebFuiPQbcdqLzWTchJ1GXLj1cxs9T0vnW4jxGW2eNvP5E0QuxVHkYkJIzsQg4-G_GM40yRIp5iDxRI',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1NenTangSample/preview',
    sample_title: 'Trích đoạn Đọc thử: Chuyên đề Rút gọn mệnh đề quan hệ & Phân từ',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [
      { label: 'Cấu trúc', val: '12 chuyên đề ngữ pháp & kỹ năng đọc điền ứng dụng' }
    ],
    topics: ['Hệ thống thì, câu bị động, mệnh đề quan hệ rút gọn, giới từ, cụm từ cố định.'],
    features: ['Lý thuyết cô đọng kèm bài tập vận dụng trực tiếp vào đoạn văn đọc điền.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 160000, original_price: 200000, gdrive_folder_id: '1NENTANG_W', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 110000, original_price: 140000, gdrive_folder_id: '1NENTANG_P', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 6
  },
  {
    id: '1400-cum-dong-tu',
    category_id: 'gifted-students',
    section_group: 'bo-tro',
    title: '1400 câu cụm động từ (English Phrasal Verbs in Use - Intermediate)',
    short_title: '1400 Cụm động từ HSG',
    slug: '1400caucumdongtuintermediate',
    google_form_product_name: '1400 câu cụm động từ (English Phrasal Verbs in Use - Intermediate)',
    badge: 'Mới',
    subtitle: 'Ôn thi HSG & Ôn nâng cao THPTQG',
    cefr_level: 'B1 - C1',
    grade: 'Lớp 9 - 12 & Chuyên Anh',
    description: 'Tài liệu ôn thi Học sinh giỏi cấp Tỉnh/Quốc gia & Chuyên Anh THPT. Hệ thống 1400 câu trắc nghiệm và điền từ chia theo 70 Unit Cambridge.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72squPVGTqxgZbBsT1DAsfCHE31cNBfO0gZtBzlliTw-qHW9601EDs2QiquuuCpREY1XW4_3l7Ax-u9lUpK-4sVHsyJ6VEDtWhvS9778O2loZmYrK2iLwpr_Qh6N8uKy951DI7TxnNwh9Q-YqP2vgZhzd1mp9ioQtE0pBIHxWAk_alv65z5kAHe40C9ps36f4lIDbS25fdlyn-350qugyp_YgfteH45Ep5X_ng',
    r2_demo_images_urls: [
      'https://media.huytutor.edu.vn/previews/phrasal-page-1.webp',
      'https://media.huytutor.edu.vn/previews/phrasal-page-2.webp'
    ],
    preview_type: 'pdf',
    sample_pdf_source: 'r2',
    sample_pdf_url: 'https://media.huytutor.edu.vn/samples/sample_1400_phrasal_verbs.pdf',
    sample_title: 'Trích đoạn Đọc thử: Unit 1 - Phrasal Verbs with UP & DOWN',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [
      { label: 'Số lượng câu hỏi', val: '1400 câu hỏi trắc nghiệm & điền từ phân chia 70 chuyên đề logic' },
      { label: 'Giáo trình tham khảo', val: 'Biên soạn dựa trên giáo trình kinh điển Cambridge English Phrasal Verbs in Use' },
      { label: 'Bản dịch & Giải thích', val: 'Giải thích chi tiết 100% câu hỏi kèm ví dụ và bảng từ đồng nghĩa' },
      { label: 'Quà tặng kèm', val: 'Tặng kèm Flashcard online học toàn bộ 1400 Phrasal Verbs' }
    ],
    topics: [
      'Unit 1 - 20: Cụm động từ cốt lõi theo tiểu từ (UP, DOWN, IN, OUT, ON, OFF).',
      'Unit 21 - 45: Cụm động từ theo chủ đề (Học tập, Công việc, Giao tiếp, Du lịch, Công nghệ).',
      'Unit 46 - 70: Cụm động từ nâng cao thường xuất hiện trong đề thi Chuyên Anh & HSG Tỉnh.'
    ],
    features: [
      'Mỗi Unit gồm 20 câu hỏi ngữ cảnh thực tế giúp học sinh nắm trọn các sắc thái nghĩa của Phrasal Verbs.',
      'Giải thích cặn kẽ từng đáp án A, B, C, D kèm dịch nghĩa toàn câu.',
      'File Word sạch 100% không watermark, cực kỳ tiện lợi cho thầy cô trích xuất làm đề kiểm tra đội tuyển.'
    ],
    sample_pages_text: [
      {
        page: 1,
        header: 'UNIT 01: PHRASAL VERBS WITH UP',
        title: 'MULTIPLE CHOICE & CONTEXTUAL EXERCISES',
        body: "Question 1: Don't forget to ________ your coat before heading out into the freezing blizzard.\nA. do up      B. make up      C. take up      D. set up\n\nQuestion 2: The committee decided to ________ a special inquiry into the environmental incident.\nA. bring up      B. set up      C. hold up      D.owning up",
        note: 'Bản dịch & Giải thích: Câu 1: do up = fasten/button (cài khuy/kéo khóa áo khoác). Câu 2: set up an inquiry = thành lập một cuộc điều tra đặc biệt.'
      },
      {
        page: 2,
        header: 'UNIT 01: ANSWER KEY & DETAILED EXPLANATIONS',
        title: 'BẢNG PHÂN TÍCH NGỮ NGHĨA CHI TIẾT',
        body: '• do up (phr.v): cài, buộc, trang trí tân trang lại (do up an old house)\n• make up (phr.v): bịa chuyện, trang điểm, làm hòa, chiếm tỉ lệ\n• take up (phr.v): bắt đầu một sở thích/môn thể thao, chiếm (thời gian/không gian)',
        note: 'Mỗi câu hỏi đều được giải nghĩa toàn bộ 4 phương án A, B, C, D giúp mở rộng vốn từ gấp 4 lần.'
      }
    ],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 170000, original_price: 210000, gdrive_folder_id: '1PHRASAL_W', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 115000, original_price: 150000, gdrive_folder_id: '1PHRASAL_P', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 7
  },
  {
    id: '2500-collocations',
    category_id: 'high-school',
    section_group: 'bo-tro',
    title: '2500 cụm từ cố định thông dụng kèm theo 4 dạng bài luyện tập',
    short_title: '2500 Collocations',
    slug: '2500-collocations',
    google_form_product_name: '2500 cụm từ cố định thông dụng kèm theo 4 dạng bài luyện tập',
    badge: 'Mới',
    subtitle: 'Dành cho nhiều kỳ thi',
    cefr_level: 'B1 - C1',
    grade: 'THPT & HSG',
    description: 'Bộ tài liệu chuyên sâu 2500 Collocations thông dụng kèm 4 dạng bài tập rèn phản xạ nhận biết và vận dụng.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72v3QY32Qx6m0EjYvgZIWa9U8mvlnEZuE7csrG-dvgv00EEbmlnatZ2frwFmuDxDS8Jeooq0oe3-QPUAIDmOsvopfLnv7ffSsCoQFraYi3Gw0pNmvxB2uEK9nOBZk1yQAR3AQmIPIxpxavjL4OXx6rp20O1XnqFsPjM1fz2yppV0L2y4eKikFb7GOoPKbdb7YGrEHqxLw9L0GCbTihN1HvUze0Bxnf58LqEoTAJ0k9c',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1CollocationsSample/preview',
    sample_title: 'Trích đoạn Đọc thử: Collocations with MAKE, DO, HAVE, TAKE',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [
      { label: 'Quy mô', val: '2500 cụm từ cố định (Collocations) trọng tâm thi THPTQG & HSG' }
    ],
    topics: ['Bảng tra cứu Collocations A-Z kèm 4 dạng bài tập thực hành chuyên sâu.'],
    features: ['Giải thích chi tiết ngữ cảnh sử dụng và nghĩa tiếng Việt chuẩn xác.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 175000, original_price: 220000, gdrive_folder_id: '1COLLOC_W', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 120000, original_price: 150000, gdrive_folder_id: '1COLLOC_P', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 8
  },
  {
    id: 'so-tay-tu-vung',
    category_id: 'high-school',
    section_group: 'tu-vung-gs',
    title: 'Sổ tay từ vựng Tiếng Anh trọng tâm chương trình mới',
    short_title: 'Sổ tay từ vựng trọng tâm',
    slug: 'so-tay-tu-vung',
    google_form_product_name: 'Sổ tay từ vựng tiếng Anh trọng tâm chương trình mới',
    badge: 'Nâng cao',
    subtitle: 'Cốt lõi 1500 từ vựng',
    cefr_level: 'B1 - B2',
    grade: 'Lớp 10 - 11 - 12',
    description: 'Cuốn cẩm nang bỏ túi gom gọn 1500 từ vựng và cụm từ cốt lõi có tần suất xuất hiện cao nhất trong kỳ thi tốt nghiệp THPT.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72tOvxija2ykWrdXWfHLQGESkPTcGOJmt3mBIv0foy6TftSw-FYSWn1pOqAF6Zy_2a5DBBXeXDgWZxfx8ngH5luBedGBNdE0vEHT-f-heyIN1pYE49WaHeHcrKpo3qaFcn5ySRUCOIsc99no1jyIWXujPKsv2WAiOOfwgKeirZ2g7D2Ss6iZqFDGw-THdIqJKjXVyvxGSrDoenLv6p_EyVGeNJhIrxdZZJsPHg',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1SoTaySample/preview',
    sample_title: 'Trích đoạn Đọc thử: Sổ tay từ vựng theo chủ đề',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [{ label: 'Số lượng từ', val: '1500 từ vựng và cấu trúc trọng tâm xuất hiện nhiều nhất' }],
    topics: ['Phân chia theo 20 chủ đề xuyên suốt lớp 10, 11, 12.'],
    features: ['Ghi chú các cặp từ dễ nhầm lẫn (Confusing words) và từ đồng nghĩa/trái nghĩa.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 140000, original_price: 180000, gdrive_folder_id: '1SOTAY_W', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 95000, original_price: 130000, gdrive_folder_id: '1SOTAY_P', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 9
  },
  {
    id: 'tu-vung-12',
    category_id: 'high-school',
    section_group: 'tu-vung-gs',
    title: 'Tuyển tập từ vựng chi tiết Tiếng Anh 12 kèm bài tập bổ trợ',
    short_title: 'Từ vựng Tiếng Anh 12',
    slug: 'tu-vung-12',
    google_form_product_name: 'Tuyển tập từ vựng chi tiết Tiếng Anh 12 (Global Success)',
    badge: 'Mới',
    subtitle: 'Bám sát SGK Tiếng Anh 12',
    cefr_level: 'B1 - B2',
    grade: 'Lớp 12',
    description: 'Trọn bộ từ vựng 10 Unit chương trình mới kèm phiên âm, từ loại, dịch nghĩa, câu ví dụ và bài tập thực hành theo định dạng đề thi.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72s3Pad7NNaLtohYNpmuOsh_pFQpMGazP2dtV0wOP3mBZQ7MiEibRPM4cSt1tKyCcwitgzi7QZXHzkh6WXz3brYH-yRBn5h4TnedrMAKoilobz7iwJghj9jnaAqNmCSFYCDb0ubrYJnXrfDM4GJTXMkJ_A62SSczH978xmbXnUCh8FOWs0SPhpjARTQXtJtLaLMo3BFxz08NMN6YBDGjmeXY3c4VaYnpJZn7doPUPQs',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1TuVung12Sample/preview',
    sample_title: 'Trích đoạn Đọc thử: Unit 1 - Life stories we admire',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [{ label: 'Nội dung', val: 'Toàn bộ 10 Unit Tiếng Anh 12 Global Success kèm bài tập' }],
    topics: ['Unit 1 - Unit 10 kèm bảng Collocations, Phrasal Verbs và bài tập đọc điền.'],
    features: ['Tích hợp Flashcard nghe phát âm từng từ chuẩn giọng bản xứ.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 180000, original_price: 220000, gdrive_folder_id: '1TV12_W', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 120000, original_price: 150000, gdrive_folder_id: '1TV12_P', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 10
  },
  {
    id: 'tu-vung-11',
    category_id: 'high-school',
    section_group: 'tu-vung-gs',
    title: 'Tuyển tập từ vựng chi tiết Tiếng Anh 11 kèm bài tập bổ trợ',
    short_title: 'Từ vựng Tiếng Anh 11',
    slug: 'tu-vung-11',
    google_form_product_name: 'Tuyển tập từ vựng chi tiết Tiếng Anh 11 (Global Success)',
    badge: 'Mới',
    subtitle: 'Bám sát SGK Tiếng Anh 11',
    cefr_level: 'B1 - B2',
    grade: 'Lớp 11',
    description: 'Bám sát toàn bộ 10 Unit SGK Tiếng Anh 11 mới, phân loại chi tiết collocations, idioms và bài tập vận dụng.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72sBwCqWRvB-mMawLdTCW36SLTrBJmXlWLwQqf9lXQqC2-r9zCoHnjwpHT0V6PkOLWYcMocE0cz3n01BbvUGPY2DbEmhXLup2IdAvA_eJL5i4Kxg0GOXtpbgyQs9memYdA_PY9TXbe0yvduXlVjIvX_o070zkcAIfkRcyuTKsGdWrqBqRmoQQFhFe6K_JUKLUH2uOdo6RESQTQLY2Rw_-giq2bLS6NV_O_b9R2fv',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1TuVung11Sample/preview',
    sample_title: 'Trích đoạn Đọc thử: Unit 1 - A long and healthy life',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [{ label: 'Nội dung', val: 'Toàn bộ 10 Unit Tiếng Anh 11 Global Success' }],
    topics: ['10 Unit từ vựng chi tiết và hệ thống bài tập kiểm tra định kỳ.'],
    features: ['Giải thích chi tiết đáp án cho từng câu hỏi trắc nghiệm và tự luận.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 180000, original_price: 220000, gdrive_folder_id: '1TV11_W', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 120000, original_price: 150000, gdrive_folder_id: '1TV11_P', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 11
  },
  {
    id: 'tu-vung-10',
    category_id: 'high-school',
    section_group: 'tu-vung-gs',
    title: 'Tuyển tập từ vựng chi tiết Tiếng Anh 10 kèm bài tập bổ trợ',
    short_title: 'Từ vựng Tiếng Anh 10',
    slug: 'tu-vung-10',
    google_form_product_name: 'Tuyển tập từ vựng chi tiết Tiếng Anh 10 (Global Success)',
    badge: 'Mới',
    subtitle: 'Bám sát SGK Tiếng Anh 10',
    cefr_level: 'A2 - B1',
    grade: 'Lớp 10',
    description: 'Tài liệu chuẩn mực cho giáo viên giảng dạy và học sinh lớp 10 củng cố kiến thức từ vựng ngay từ đầu cấp.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72siSwb7cdRvyV47RUb6GvJtIyIvS9cwArgBAw8birpQIdm6xWjkB-DU9pUUN1oq8Fx-vQzV1C_5je9QF7MlE7ldYtCLNEBNR4RBLYd1uAWsl0Nhm5llIwU1A3UmXujCAoQwsovoQCT_f2Sb8QUbutEN7p3ct3zO2UeDSVzRmBnAg7yUpJq14j0FzyK82Z6cr3HDbwLg-QQDnliAmcG5Plo5M1Bt_oKGsD2Z6wvcIc4',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1TuVung10Sample/preview',
    sample_title: 'Trích đoạn Đọc thử: Unit 1 - Family Life',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [{ label: 'Nội dung', val: 'Toàn bộ 10 Unit Tiếng Anh 10 Global Success' }],
    topics: ['10 Unit từ vựng cốt lõi và mở rộng kèm bài tập thực hành.'],
    features: ['Bản dịch ví dụ song ngữ, tặng kèm Flashcard luyện tập.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 180000, original_price: 220000, gdrive_folder_id: '1TV10_W', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 120000, original_price: 150000, gdrive_folder_id: '1TV10_P', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 12
  },
  {
    id: 'reading-g9',
    category_id: 'secondary-school',
    section_group: 'lop-9',
    title: 'Đọc điền - Đọc hiểu Tiếng Anh cơ bản | Lớp 9',
    short_title: 'Đọc điền - Đọc hiểu Lớp 9',
    slug: 'reading-g9',
    google_form_product_name: 'Đọc điền - Đọc hiểu Tiếng Anh cơ bản & nâng cao | Lớp 9',
    badge: 'Mới',
    subtitle: 'Dành cho Ôn thi vào 10',
    cefr_level: 'A2 - B1',
    grade: 'Lớp 9 & Thi vào 10',
    description: 'Chuyên luyện kỹ năng đọc điền và đọc hiểu bám sát ma trận thi tuyển sinh vào Lớp 10 các tỉnh thành trên toàn quốc.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72vOJ_i7fvuW1ed5VRvrSW4WlzjrMmRhMUrDLOg4-WOPl8plcuswJBOvi0wu-iUxK7MKn0BK1QzE8lhFMANbsp8g1U3knZzNfwRQ4fDP8uytigE65GHzk7jox2ih_P7Cf1YoSUZySEnq7-1x2yrKDuBwcbGfSW52DvJQzAETiyWfsG6dbfC57_M6VZuZLftBzkim-Tn9Ot8iu24sQ_gpcvpUs5gRXlaf1Uh62vUZ',
    r2_demo_images_urls: [
      'https://media.huytutor.edu.vn/previews/reading-g9-1.webp',
      'https://media.huytutor.edu.vn/previews/reading-g9-2.webp'
    ],
    preview_type: 'images',
    sample_pdf_source: 'r2',
    sample_pdf_url: 'https://media.huytutor.edu.vn/samples/sample_reading_g9.pdf',
    sample_title: 'Trích đoạn Đọc thử: Chủ đề 1 - Habitats & Local Community',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [
      { label: 'Số lượng bài đọc', val: '50 bài đọc điền + 50 bài đọc hiểu phân loại cơ bản đến nâng cao' },
      { label: 'Cấu trúc bám sát', val: 'Bám sát toàn bộ 12 Unit SGK Tiếng Anh 9 Global Success mới nhất' },
      { label: 'Bản dịch & Giải thích', val: '100% bản dịch tiếng Việt song song từng đoạn văn và phân tích đáp án' },
      { label: 'Quà tặng kèm', val: 'Tặng kèm Flashcard từ vựng Lớp 9 trực tuyến có audio phát âm chuẩn' }
    ],
    topics: [
      'Chủ đề 1 - 4: Local Community, City Life, Healthy Living for Teens, Remembering the Past.',
      'Chủ đề 5 - 8: Our Experiences, Vietnamese Lifestyle: Then and Now, Natural Wonders, Tourism.',
      'Chủ đề 9 - 12: World Englishes, Planet Earth (Habitats), Electronic Devices, Career Choices.'
    ],
    features: [
      'Mỗi bài đọc đều có bảng bóc tách từ vựng trọng tâm (Vocabulary Highlight) ngay sau đề.',
      'Hướng dẫn kỹ năng xác định Keywords và định vị thông tin (Scanning & Skimming) cho học sinh Lớp 9.',
      'File Word chỉnh sửa linh hoạt, trình bày chuẩn mực cho giáo viên in phiếu bài tập.'
    ],
    sample_pages_text: [
      {
        page: 1,
        header: 'BÀI ĐỌC ĐIỀN TỪ - TOPIC 1: HABITATS & LOCAL COMMUNITY',
        title: 'CLOZE READING PASSAGE 01',
        body: "Traditional craft villages are an integral part of Vietnam's cultural heritage. For centuries, artisans in these communities have preserved ancient techniques passed down through generations. However, rapid modernization has posed unprecedented (1)________ to the survival of many traditional crafts...\n1. A. opportunities      B. challenges      C. solutions      D. benefits",
        note: 'Bản dịch & Lời giải: Các làng nghề truyền thống là một phần không thể tách rời... Tuy nhiên sự hiện đại hóa nhanh chóng đã đặt ra những thách thức (challenges) chưa từng có. Chọn B (challenges).'
      },
      {
        page: 2,
        header: 'BÀI ĐỌC HIỂU - TOPIC 1: NATURAL HABITATS',
        title: 'READING COMPREHENSION PASSAGE 02',
        body: 'Wetlands are among the most productive ecosystems in the world, comparable to rain forests and coral reefs. An immense variety of species of microbes, plants, insects, amphibians, reptiles, birds, fish, and mammals can be part of a wetland ecosystem...',
        note: 'Bản dịch song ngữ: Các vùng đất ngập nước nằm trong số những hệ sinh thái có năng suất sinh học cao nhất trên thế giới, tương đương với rừng mưa nhiệt đới và rạn san hô...'
      }
    ],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 160000, original_price: 200000, gdrive_folder_id: '1G9_WORD', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 110000, original_price: 140000, gdrive_folder_id: '1G9_PDF', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 13
  },
  {
    id: 'doc-dien-hieu-8',
    category_id: 'secondary-school',
    section_group: 'lop-8',
    title: 'Đọc điền - Đọc hiểu Tiếng Anh cơ bản & nâng cao | Lớp 8',
    short_title: 'Đọc điền - Đọc hiểu Lớp 8',
    slug: 'reading-g8',
    google_form_product_name: 'Đọc điền - Đọc hiểu Tiếng Anh cơ bản & nâng cao | Lớp 8',
    badge: 'Mới',
    subtitle: 'Bám sát CT GDPT 2018',
    cefr_level: 'A2',
    grade: 'Lớp 8',
    description: 'Tài liệu phát triển kỹ năng đọc hiểu toàn diện bám sát chương trình Giáo dục Phổ thông 2018 lớp 8.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72veAxOLba4eC7pniSd4rDxwdsEhYFEUojbNzhnpRBw-prh8ZdiRhOujmAyGJkitvyLHkFPUAz80FoQyYaaNFE5iZUk5tImpnYTudMZGv2eojIoGp1c9YsYLuTgeQsX0S6yTdSK5e6-8kqDvBl5YxpUXv5dGpatF5U1U0xzTBr4v6RTCLClozlVxR_f8RcDLcJSZ2bWTHH1ABn3gkR1FudmCJlDIoemdKOFYeVlI',
    r2_demo_images_urls: [],
    preview_type: 'pdf',
    sample_pdf_source: 'drive',
    sample_pdf_url: 'https://drive.google.com/file/d/1ReadingG8Sample/preview',
    sample_title: 'Trích đoạn Đọc thử: Unit 1 - Leisure Time',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ - ZALO 0356999147 - HUYTUTOR.EDU.VN',
    specs: [{ label: 'Nội dung', val: 'Bám sát 12 chủ điểm SGK Tiếng Anh 8 mới' }],
    topics: ['Leisure Time, Life in the Countryside, Teenagers, Ethnic Groups of Viet Nam...'],
    features: ['Bản dịch chi tiết và bảng từ vựng sau mỗi bài đọc.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Word', form_mapped_note: 'Word dài', price: 160000, original_price: 200000, gdrive_folder_id: '1G8_WORD', is_default: false, is_active: true },
      { ui_format_name: 'PDF', form_mapped_note: 'PDF dài', price: 110000, original_price: 140000, gdrive_folder_id: '1G8_PDF', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 14
  },
  {
    id: 'flashcard-thpt-ielts',
    category_id: 'high-school',
    section_group: 'bo-tro',
    title: 'Flashcard từ vựng - tổng hợp mọi tài liệu',
    short_title: 'Flashcard Trực Tuyến',
    slug: 'flashcard-tu-vung',
    google_form_product_name: 'Gói flashcard trực tuyến THPT, ĐGNL & IELTS',
    badge: 'Mới',
    subtitle: 'Học từ vựng cơ bản đến nâng cao',
    cefr_level: 'B1 - C2',
    grade: 'Mọi cấp học',
    description: 'Hệ thống thẻ học từ vựng trực tuyến với 4 chế độ luyện tập, phát âm chuẩn UK/US và ví dụ song ngữ.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72sURglK36-Vlnk2gHmVvj0jern3KIcfbWrdCI61_LSgRa_vPy6oStJ1VilLufVx_7xVBEj7vSmA9WZDbqkUh48ebcn56AE3yNqusUhsfXZMUgJThUpNCD5jZ7o0-igVvGyOY1SoxnivH-9fH0zMkrNUtPAoVaop2aIxVwAyd_dnQxcsDj0r3BThG5ad',
    r2_demo_images_urls: [],
    preview_type: 'none',
    sample_pdf_source: 'drive',
    sample_pdf_url: '',
    sample_title: '',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR - BẢN ĐỌC THỬ MIỄN PHÍ',
    specs: [
      { label: 'Chế độ học', val: '4 chế độ luyện tập từ vựng thông minh trên Web/Mobile' },
      { label: 'Âm thanh', val: 'Nghe phát âm từ/cụm từ không giới hạn số lần' }
    ],
    topics: ['Bao gồm toàn bộ từ vựng các bộ đề THPTQG, ĐGNL, SGK 10-11-12 và 1400 Phrasal Verbs.'],
    features: ['Cấp quyền trực tiếp qua Gmail, hỗ trợ gói cá nhân và gói nhóm cho giáo viên.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Flashcard', form_mapped_note: 'Flashcard', price: 100000, original_price: 150000, gdrive_folder_id: '1FLASHCARD_SYS', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 15
  },
  {
    id: 'mau-thu-hoc-phi',
    category_id: 'high-school',
    section_group: 'utilities',
    title: 'Mẫu thu học phí kết hợp lập sổ doanh thu tự động cho Giáo viên & Gia sư',
    short_title: 'Mẫu thu học phí tự động',
    slug: 'mau-thu-hoc-phi',
    google_form_product_name: 'Mẫu thu học phí kết hợp lập sổ doanh thu tự động cho Giáo viên & Gia sư',
    badge: 'Google Sheet',
    subtitle: 'Tự động tính toán & gửi phiếu',
    cefr_level: 'Tiện ích',
    grade: 'Giáo viên & Gia sư',
    description: 'Trang tính Google Sheet tối ưu quản lý điểm danh, theo dõi học phí từng buổi, tính tổng doanh thu và xuất phiếu báo học phí tự động.',
    r2_thumbnail_url: 'https://lh7-us.googleusercontent.com/sitesv-images-rt/AMxu72th-NHQ4TyRfYhJVZCeUyKh-qskeMpq1kUUXD1d6DpPNqqbLlBpRvQ9WrD2Vn2btopfN-RDuq5u8WuKpxuxboCRqbxLiQYiMmU8tEMxcrvtBzBE0nX4bbnNmeYqJgrzmhiHcb6GQP6ycRvN9FtX-lQjfLCw5ss8WYr3_pllem2NWQCxunJ1M4cUwzp5BpM',
    r2_demo_images_urls: [],
    preview_type: 'none',
    sample_pdf_source: 'drive',
    sample_pdf_url: '',
    sample_title: '',
    watermark_enabled: true,
    watermark_text: 'HUY TUTOR',
    specs: [
      { label: 'Định dạng', val: 'Google Sheet tự động hóa 100% công thức' },
      { label: 'Thời hạn', val: 'Sử dụng trọn đời trên Google Drive cá nhân' }
    ],
    topics: ['Quản lý danh sách lớp, điểm danh tự động, xuất phiếu học phí cá nhân hóa.'],
    features: ['Bảo mật tuyệt đối trên tài khoản Google của thầy cô, dễ sử dụng.'],
    sample_pages_text: [],
    formats: [
      { ui_format_name: 'Trang tính', form_mapped_note: 'Trang tính', price: 150000, original_price: 200000, gdrive_folder_id: '1SHEET_FOLDER', is_default: true, is_active: true }
    ],
    is_published: true,
    order_index: 16
  }
];

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
