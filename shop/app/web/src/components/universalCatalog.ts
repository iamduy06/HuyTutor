import {
  CategoryBannerBlockConfig,
  CategoryHeroBlockConfig,
  CategoryNoticeBlockConfig,
  CategorySectionBlockConfig,
  ComboBannerBlockConfig,
  ComboBottomCtaBlockConfig,
  ComboHeroBlockConfig,
  ComboNoticeBlockConfig,
  ComboPackagesBlockConfig,
  ComboSectionsBlockConfig,
  FlashcardBannerBlockConfig,
  FlashcardContactNoticeBlockConfig,
  FlashcardFeaturesBlockConfig,
  FlashcardFreeTierBlockConfig,
  FlashcardGroupPricingBlockConfig,
  FlashcardHeroBlockConfig,
  FlashcardPricingBlockConfig,
  HomepageBlockItem,
  HomepageBottomBannerConfig,
  HomepageCategoriesGridConfig,
  HomepageCategoryTile,
  HomepageHeroConfig,
  HomepageNoticeTextConfig,
  HomepageSectionGroupsConfig,
  HomepageTopBannerConfig,
  ProductHeroBlockConfig,
  ProductIntroBlockConfig,
  RelatedProductsBlockConfig,
  SampleGroupsBlockConfig,
  TopicAccordionBlockConfig,
  UniversalBlockCategory,
  UniversalBlockItem,
  UniversalBlockMeta,
  UniversalPageContext,
} from '../types';

export const UNIVERSAL_CATEGORY_TABS: { key: 'all' | UniversalBlockCategory; label: string }[] = [
  { key: 'all', label: 'TẤT CẢ (25+ KHỐI)' },
  { key: 'hero_banner', label: 'HERO & BANNER' },
  { key: 'products', label: 'SẢN PHẨM & BÁN HÀNG' },
  { key: 'content', label: 'NỘI DUNG & ĐỌC THỬ' },
  { key: 'pricing', label: 'BẢNG GIÁ & CHÍNH SÁCH' },
  { key: 'cta', label: 'CHUYỂN ĐỔI & CTA' },
];

export const UNIVERSAL_BLOCK_CATALOG: UniversalBlockMeta[] = [
  // --- NHÓM 1: HERO & BANNER ---
  {
    type: 'campaign_frame',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Khung Ảnh & Chiến Dịch (Campaign Frame Overlay)',
    badgeColor: 'bg-gradient-to-r from-red-600 to-amber-500 text-white',
    desc: 'Khung ảnh chiến dịch lễ Tết, Siêu Sale, Mùa Thi, Giáng Sinh hoặc tải PNG trong suốt từ R2 áp dụng cho sản phẩm và banner chuyển đổi.',
    originPage: 'Toàn trang',
  },
  {
    type: 'hero',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Hero Tác Giả & Cam Kết (Thầy Huy)',
    badgeColor: 'bg-rose-700 text-white',
    desc: 'Phần đầu trang gồm tiêu đề lớn đỏ đậm, 4 gạch đầu dòng cam kết chất lượng, 2 huy hiệu và ảnh tác giả Thầy Huy.',
    originPage: 'Trang chủ',
  },
  {
    type: 'combo_hero',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Hero Slogan & Bìa Sách 3D Combo THPT',
    badgeColor: 'bg-[#e60049] text-white',
    desc: 'Slogan đôi Mua nhiều. Giảm sâu. Tích điểm cao và Banner lớn (chọn tải ảnh R2 thiết kế sẵn hoặc tạo chữ + 3 cuốn sách 3D).',
    originPage: 'Trang Combo',
  },
  {
    type: 'flashcard_hero',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Video Giới Thiệu & Slogan Flashcard',
    badgeColor: 'bg-indigo-600 text-white',
    desc: 'Tiêu đề, phụ đề và nhúng video YouTube hoặc video MP4 từ R2 giới thiệu phương pháp học Flashcard thông minh.',
    originPage: 'Trang Flashcard',
  },
  {
    type: 'category_hero',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Hero Đầu Trang Cấp 1 & Mục Lục Nhảy Nhanh',
    badgeColor: 'bg-blue-600 text-white',
    desc: 'Tiêu đề lớn màu đỏ, mô tả phụ và danh sách liên kết gạch chân cuộn mượt xuống từng nhóm tài liệu.',
    originPage: 'Trang Cấp 1',
  },
  {
    type: 'product_hero',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Hero Chi Tiết Sản Phẩm & Chọn Định Dạng',
    badgeColor: 'bg-sky-600 text-white',
    desc: 'Khung đầu trang gồm ảnh bìa/sách bên trái và thông tin giá niêm yết, chọn Word/PDF, thông số và nút mua hàng.',
    originPage: 'Trang Cấp 2',
  },
  {
    type: 'top_banner',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Top Banner Ưu Đãi / Nổi Bật',
    badgeColor: 'bg-purple-700 text-white',
    desc: 'Banner quảng cáo ảnh ngang rộng toàn màn hình, hỗ trợ liên kết nội bộ hoặc ngoài.',
    originPage: 'Trang chủ',
  },
  {
    type: 'combo_banner',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Banner Ngang Độc Lập Combo',
    badgeColor: 'bg-purple-600 text-white',
    desc: 'Banner ảnh ngang độc lập chèn vào bất kỳ vị trí nào trên trang.',
    originPage: 'Trang Combo',
  },
  {
    type: 'category_banner',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Banner Ngang Độc Lập Danh Mục',
    badgeColor: 'bg-indigo-700 text-white',
    desc: 'Banner ảnh ngang đứng độc lập một mình, chèn linh hoạt theo nhu cầu.',
    originPage: 'Trang Cấp 1',
  },
  {
    type: 'flashcard_banner',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Banner Sự Kiện & Khuyến Mãi Flashcard',
    badgeColor: 'bg-teal-600 text-white',
    desc: 'Banner hình ảnh full-width chèn vào giữa các phần trang Flashcard.',
    originPage: 'Trang Flashcard',
  },
  {
    type: 'bottom_banner',
    category: 'hero_banner',
    categoryLabel: 'Hero & Banner',
    label: 'KHỐI: Bottom Banner Chân Trang',
    badgeColor: 'bg-emerald-700 text-white',
    desc: 'Banner chân trang tải ảnh banner rộng hoặc thiết kế bìa sách kèm link dẫn.',
    originPage: 'Trang chủ',
  },

  // --- NHÓM 2: SẢN PHẨM & BÁN HÀNG ---
  {
    type: 'categories_grid',
    category: 'products',
    categoryLabel: 'SẢN PHẨM',
    label: 'KHỐI: Lưới 6 Ô Danh Mục Vàng Nổi Bật',
    badgeColor: 'bg-amber-600 text-white',
    desc: 'Lưới các ô vuông danh mục nổi bật, admin tự do đổi icon, nhãn, ảnh đại diện và đường dẫn.',
    originPage: 'Trang chủ',
  },
  {
    type: 'combo_packages',
    category: 'products',
    categoryLabel: 'SẢN PHẨM',
    label: 'KHỐI: Lưới Các Gói Combo Ưu Đãi (Giảm sâu đến 25%)',
    badgeColor: 'bg-[#e60049] text-white',
    desc: 'Danh sách các thẻ gói Combo ưu đãi (Word/PDF, % giảm giá, chọn các sách thuộc gói).',
    originPage: 'Trang Combo',
  },
  {
    type: 'category_section',
    category: 'products',
    categoryLabel: 'SẢN PHẨM',
    label: 'KHỐI: Lưới Tài Liệu 3 Cột Chuẩn Hóa',
    badgeColor: 'bg-rose-600 text-white',
    desc: 'Lưới 3 cột thẻ tài liệu, hỗ trợ ảnh độc lập nguyên bản, nút Đọc thử và tên sách căn giữa in đậm.',
    originPage: 'Trang Cấp 1',
  },
  {
    type: 'section_groups',
    category: 'products',
    categoryLabel: 'SẢN PHẨM',
    label: 'KHỐI: Nhóm Tài Liệu & Sản Phẩm Trang Chủ',
    badgeColor: 'bg-purple-800 text-white',
    desc: 'Các nhóm tài liệu (THPT, THCS...) với card sách 3D + badge + nút Đọc thử + tên sách.',
    originPage: 'Trang chủ',
  },
  {
    type: 'combo_sections',
    category: 'products',
    categoryLabel: 'SẢN PHẨM',
    label: 'KHỐI: Phân Nhóm Tài Liệu Thành Phần Combo',
    badgeColor: 'bg-emerald-600 text-white',
    desc: 'Các phân nhóm tài liệu chi tiết (3 bộ đề mới, Từ vựng, ĐGNL...), chọn sách từ kho tài liệu.',
    originPage: 'Trang Combo',
  },
  {
    type: 'related_products',
    category: 'products',
    categoryLabel: 'SẢN PHẨM',
    label: 'KHỐI: Tài Liệu Gợi Ý / Bán Kèm ("Nhiều Thầy/Cô cũng chọn")',
    badgeColor: 'bg-teal-600 text-white',
    desc: 'Lưới 3 cột giới thiệu các tài liệu liên quan ở cuối trang để tăng tỉ lệ chuyển đổi.',
    originPage: 'Trang Cấp 2',
  },
  {
    type: 'gift_cross_sell',
    category: 'products',
    categoryLabel: 'SẢN PHẨM',
    label: 'KHỐI: Gợi Ý Tài Liệu Trọng Tâm Bán Kèm',
    badgeColor: 'bg-amber-700 text-white',
    desc: 'Lưới 3 cột gợi ý các tài liệu trọng tâm có phí để kích thích mua hàng từ trang tài liệu miễn phí.',
    originPage: 'Trang Quà Tặng',
  },

  // --- NHÓM 3: NỘI DUNG & ĐỌC THỬ ---
  {
    type: 'product_intro',
    category: 'content',
    categoryLabel: 'NỘI DUNG',
    label: 'KHỐI: Hộp Xám Giới Thiệu & Điểm Nổi Bật',
    badgeColor: 'bg-gray-800 text-white',
    desc: 'Khung nền xám nhạt giới thiệu tổng quan tài liệu và danh sách dấu chấm tròn điểm nổi bật.',
    originPage: 'Trang Cấp 2',
  },
  {
    type: 'topic_accordion',
    category: 'content',
    categoryLabel: 'NỘI DUNG',
    label: 'KHỐI: Hộp Thu Gọn / Mở Rộng Danh Sách Chủ Đề (Accordion)',
    badgeColor: 'bg-amber-500 text-white',
    desc: 'Tiêu đề Bản xem thử kèm hộp đóng/mở (Accordion) liệt kê danh sách các đề/chủ đề mượt mà.',
    originPage: 'Trang Cấp 2',
  },
  {
    type: 'sample_groups',
    category: 'content',
    categoryLabel: 'NỘI DUNG',
    label: 'KHỐI: Các Nhóm Ảnh Đọc Thử A4 Watermark Độc Lập',
    badgeColor: 'bg-[#e60049] text-white',
    desc: 'Nhiều nhóm đọc thử nối tiếp nhau (Đề thi, Đáp án, Từ vựng...). Mỗi nhóm có danh sách trang A4 kèm Watermark chống sao chép.',
    originPage: 'Trang Cấp 2',
  },
  {
    type: 'flashcard_features',
    category: 'content',
    categoryLabel: 'NỘI DUNG',
    label: 'KHỐI: Dải Đỏ Tính Năng & Trải Nghiệm Học Flashcard',
    badgeColor: 'bg-red-700 text-white',
    desc: 'Dải đỏ nổi bật gồm thẻ từ vựng demo tương tác và 9 tính năng học thông minh.',
    originPage: 'Trang Flashcard',
  },
  {
    type: 'notice_text',
    category: 'content',
    categoryLabel: 'NỘI DUNG',
    label: 'KHỐI: Thông Báo & Nút Liên Kết (Notice / CTA)',
    badgeColor: 'bg-zinc-700 text-white',
    desc: 'Dòng thông báo & nút điều hướng (Tham gia nhóm Facebook / Xem toàn bộ tài liệu).',
    originPage: 'Trang chủ',
  },
  {
    type: 'category_notice',
    category: 'content',
    categoryLabel: 'NỘI DUNG',
    label: 'KHỐI: Hộp Ghi Chú & Lưu Ý Danh Mục',
    badgeColor: 'bg-amber-600 text-white',
    desc: 'Hộp văn bản thông báo hoặc ghi chú ngắn với nền hồng, xám hoặc trắng.',
    originPage: 'Trang Cấp 1',
  },
  {
    type: 'combo_notice',
    category: 'content',
    categoryLabel: 'NỘI DUNG',
    label: 'KHỐI: Hộp Ghi Chú & Lưu Ý Combo',
    badgeColor: 'bg-zinc-700 text-white',
    desc: 'Hộp thông báo hoặc lưu ý chính sách với các tông màu hồng, vàng, xanh.',
    originPage: 'Trang Combo',
  },
  {
    type: 'flashcard_contact_notice',
    category: 'content',
    categoryLabel: 'NỘI DUNG',
    label: 'KHỐI: Hướng Dẫn Đăng Ký Lớn & Kênh Hỗ Trợ Flashcard',
    badgeColor: 'bg-zinc-800 text-white',
    desc: 'Ghi chú gửi quyền qua email và thông tin liên hệ báo giá trường học cho số lượng lớn học sinh.',
    originPage: 'Trang Flashcard',
  },
  {
    type: 'gift_form_embed',
    category: 'content',
    categoryLabel: 'NỘI DUNG',
    label: 'KHỐI: Khung Form Nhúng Nhận Tài Liệu Miễn Phí',
    badgeColor: 'bg-pink-600 text-white',
    desc: 'Nhúng Google Form hoặc form nội bộ để khách hàng nhập Gmail nhận tài liệu miễn phí.',
    originPage: 'Trang Quà Tặng',
  },
  {
    type: 'custom_html',
    category: 'content',
    categoryLabel: 'Nội dung',
    label: 'Mã HTML tùy biến',
    badgeColor: '#ec4899',
    desc: 'Nhúng mã HTML, CSS và nội dung tùy chỉnh an toàn trong Shadow DOM',
    originPage: 'Tất cả trang',
  },

  // --- NHÓM 4: BẢNG GIÁ & CHÍNH SÁCH ---
  {
    type: 'flashcard_free_tier',
    category: 'pricing',
    categoryLabel: 'BẢNG GIÁ',
    label: 'KHỐI: Gói Trải Nghiệm Học Thử Miễn Phí',
    badgeColor: 'bg-emerald-600 text-white',
    desc: 'Khu vực cho phép học sinh hoặc giáo viên trải nghiệm flashcard miễn phí mà không cần thanh toán.',
    originPage: 'Trang Flashcard',
  },
  {
    type: 'flashcard_pricing_packages',
    category: 'pricing',
    categoryLabel: 'BẢNG GIÁ',
    label: 'KHỐI: Gói Trả Phí Cá Nhân Flashcard',
    badgeColor: 'bg-amber-600 text-white',
    desc: 'Cấu hình các gói tài khoản cá nhân (1 năm, 2 năm, 3 năm) kèm giá niêm yết và quyền lợi chi tiết.',
    originPage: 'Trang Flashcard',
  },
  {
    type: 'flashcard_group_pricing',
    category: 'pricing',
    categoryLabel: 'BẢNG GIÁ',
    label: 'KHỐI: Bảng Giá Quy Mô Nhóm & Nút Đăng Ký Flashcard',
    badgeColor: 'bg-purple-600 text-white',
    desc: 'Ma trận giá chiết khấu theo số lượng tài khoản (Nhóm 2-10, 11-50, >50) và nút bấm thanh toán nhanh.',
    originPage: 'Trang Flashcard',
  },

  // --- NHÓM 5: CHUYỂN ĐỔI & CTA ---
  {
    type: 'bottom_cta',
    category: 'cta',
    categoryLabel: 'CTA & Chuyển Đổi',
    label: 'KHỐI: Lời Cảm Ơn & Cụm Nút Đặt Hàng Cuối Trang',
    badgeColor: 'bg-purple-600 text-white',
    desc: 'Dòng chữ cảm ơn Quý Thầy/Cô sau khi xem hết bản đọc thử kèm nút Đặt hàng toàn chiều rộng.',
    originPage: 'Trang Cấp 2',
  },
  {
    type: 'combo_bottom_cta',
    category: 'cta',
    categoryLabel: 'CTA & Chuyển Đổi',
    label: 'KHỐI: Banner Mua Ngay Cuối Trang Combo (Nút CTA lớn + Nhãn % ưu đãi)',
    badgeColor: 'bg-amber-600 text-white',
    desc: 'Nút bấm lớn kích hoạt mua combo nhanh và dòng ghi chú tích điểm chân trang.',
    originPage: 'Trang Combo',
  },
  {
    type: 'gift_hero_anchors',
    category: 'cta',
    categoryLabel: 'CTA & Chuyển Đổi',
    label: 'KHỐI: Quà Tặng Tiêu Đề & Cụm Nút Anchor Chuyển Mục',
    badgeColor: 'bg-emerald-600 text-white',
    desc: 'Tiêu đề lớn Tài liệu miễn phí và danh sách các nút đỏ bo góc dẫn đến từng chuyên mục quà tặng.',
    originPage: 'Trang Quà Tặng',
  },
  {
    type: 'gift_preview_download',
    category: 'cta',
    categoryLabel: 'CTA & Chuyển Đổi',
    label: 'KHỐI: Xem Thử Watermark & Nút TẢI NGAY Miễn Phí',
    badgeColor: 'bg-emerald-600 text-white',
    desc: 'Hiển thị các trang đọc thử kèm nút Tải ngay màu đỏ lớn cho tài liệu miễn phí.',
    originPage: 'Trang Quà Tặng',
  },
  {
    type: 'gift_donate_cta',
    category: 'cta',
    categoryLabel: 'CTA & Chuyển Đổi',
    label: 'KHỐI: Khung Kêu Gọi Ủng Hộ Tác Giả (Donate CTA)',
    badgeColor: 'bg-red-600 text-white',
    desc: 'Dòng text kêu gọi ủng hộ tác giả kèm nút đỏ dẫn trực tiếp sang trang /donate.',
    originPage: 'Trang Quà Tặng',
  },
];

/**
 * Khởi tạo cấu hình mặc định an toàn cho bất kỳ block nào
 */
export function createDefaultUniversalBlock(
  type: string,
  sortOrder: number,
  context?: UniversalPageContext
): UniversalBlockItem {
  const meta = UNIVERSAL_BLOCK_CATALOG.find((m) => m.type === type);
  const id = `blk_${type}_${Date.now()}`;
  const label = meta ? meta.label : type;

  let config: Record<string, any> = {};

  switch (type) {
    // --- Hero & Banner ---
    case 'hero':
      config = {
        mode: 'structured',
        title: 'Dạy & học tiếng Anh với tài nguyên',
        subtitle: 'Chuẩn mực & Chi tiết',
        bullets: [
          '150+ đề thi thử, 9+ tài liệu bổ sung',
          'Hệ thống flashcard trực tuyến',
          'Sử dụng dễ dàng',
          'Bám sát xu hướng mới',
        ],
        image_url: '',
        is_active: true,
      } as HomepageHeroConfig;
      break;

    case 'combo_hero':
      config = {
        top_slogan: 'Mua nhiều. Giảm sâu. Tích điểm cao*.',
        bottom_slogan: 'Giảm giá lên đến 25%.',
        mode: 'custom_builder',
        headline: 'Combo 90 ĐỀ THI THỬ',
        sub_headline: 'THI THPT MÔN TIẾNG ANH',
        badge_text: 'CƠ BẢN + NÂNG CAO',
        gradient_theme: 'amber',
        book_cover_urls: [],
      } as ComboHeroBlockConfig;
      break;

    case 'flashcard_hero':
      config = {
        title: 'Học từ vựng thông minh cùng Flashcard',
        subtitle: 'Phương pháp lặp lại ngắt quãng khoa học, ghi nhớ từ vựng lâu dài và hiệu quả.',
        video_type: 'youtube',
        youtube_url_or_id: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        badge_text: 'TÍNH NĂNG ĐẶC BIỆT',
      } as FlashcardHeroBlockConfig;
      break;

    case 'category_hero':
      config = {
        title: context?.category?.name || 'Tài liệu Tiếng Anh Chuẩn Mực',
        subtitle: context?.category?.description || 'Tuyển tập tài liệu chất lượng cao, chọn lọc kỹ lưỡng.',
        show_pink_glow: true,
        anchor_mode: 'auto_from_sections',
        custom_anchors: [],
        is_active: true,
      } as CategoryHeroBlockConfig;
      break;

    case 'product_hero':
      config = {
        title: context?.product?.title || 'Tên tài liệu',
        badge_tag: context?.product?.cover_tag || 'MỚI XUẤT BẢN',
        headline: 'BỘ ĐỀ THI THỬ THPT QUỐC GIA',
        sub_headline: 'MÔN TIẾNG ANH',
        is_active: true,
      } as ProductHeroBlockConfig;
      break;

    case 'top_banner':
      config = {
        mode: 'image_text',
        header_label: 'ƯU ĐÃI ĐẶC BIỆT',
        tag: 'HOT',
        title: 'Ưu đãi từ 15% khi mua combo',
        subtitle: 'Tích lũy điểm thưởng thành viên trọn đời',
        cta_badge: 'Xem ngay',
        link_url: '/combo-thpt',
        image_url: '',
        is_active: true,
      } as HomepageTopBannerConfig;
      break;

    case 'combo_banner':
    case 'category_banner':
    case 'flashcard_banner':
      config = {
        banner_url: '',
        link_url: '',
        alt_text: 'Banner ưu đãi',
        is_active: true,
      };
      break;

    case 'bottom_banner':
      config = {
        mode: 'structured',
        title: 'Tài liệu Tiếng Anh Huy Tutor',
        link_url: '/combo-thpt',
        books: [],
        is_active: true,
      } as HomepageBottomBannerConfig;
      break;

    // --- Sản Phẩm & Bán Hàng ---
    case 'categories_grid':
      config = {
        title: 'Danh mục sản phẩm',
        items: [
          { id: 'cat_fc', category_slug: 'flashcard', label: 'Flashcard', icon_code: 'flashcard', image_url: '', to: '/flashcard', is_active: true },
          { id: 'cat_thpt', category_slug: 'high-school', label: 'TÀI LIỆU THPT', icon_code: 'high-school', image_url: '', to: '/high-school', is_active: true },
          { id: 'cat_hsg', category_slug: 'gifted-students', label: 'TÀI LIỆU HSG', icon_code: 'gifted-students', image_url: '', to: '/gifted-students', is_active: true },
          { id: 'cat_thcs', category_slug: 'secondary-school', label: 'TÀI LIỆU THCS', icon_code: 'secondary-school', image_url: '', to: '/secondary-school', is_active: true },
          { id: 'cat_template', category_slug: 'template', label: 'MẪU TRANG TÍNH', icon_code: 'template', image_url: '', to: '/template', is_active: true },
          { id: 'cat_gifts', category_slug: 'gifts', label: 'TÀI LIỆU MIỄN PHÍ', icon_code: 'gifts', image_url: '', to: '/gifts', is_active: true },
        ],
        is_active: true,
      } as HomepageCategoriesGridConfig;
      break;

    case 'combo_packages':
      config = {
        section_title: 'Ưu đãi cao nhất',
        sub_text: 'Sử dụng ưu đãi thành viên để được giảm thêm trên đơn hàng.',
        packages: [],
      } as ComboPackagesBlockConfig;
      break;

    case 'category_section':
      config = {
        title: 'Nhóm tài liệu nổi bật',
        anchor_id: `sec-${Date.now()}`,
        mode: 'manual',
        items: [],
        is_active: true,
      } as CategorySectionBlockConfig;
      break;

    case 'section_groups':
      config = {
        sections: [
          {
            id: 'sec_thpt',
            title: 'Tài liệu THPT',
            category_slug: 'high-school',
            is_active: true,
            sort_order: 1,
            items: [
              {
                id: 'item_thpt_1',
                display_title: '30 đề thi thử ngôn ngữ Anh - Đánh giá năng lực Bộ Công an',
                image_url: '',
                target_url: '/high-school/dgnlbca',
                badge_text: 'Mới',
                tag_text: 'Luyện từ cơ bản đến nâng cao bám sát đề thi',
                is_active: true,
                sort_order: 1,
              },
              {
                id: 'item_thpt_2',
                display_title: 'Đột phá đề thi THPTQG môn Tiếng Anh (B2 - C2)',
                image_url: '',
                target_url: '/high-school/de-nang-cao-b2-c2',
                badge_text: 'Hot',
                tag_text: 'Dành cho kỳ thi THPTQG từ năm 2025',
                is_active: true,
                sort_order: 2,
              },
              {
                id: 'item_thpt_3',
                display_title: 'Bộ đề chuẩn cấu trúc (B1 - C1)',
                image_url: '',
                target_url: '/high-school/bo-de-chuan-cau-truc',
                badge_text: 'Bán chạy',
                tag_text: 'Dành cho Kỳ thi THPTQG từ năm 2025',
                is_active: true,
                sort_order: 3,
              },
            ],
          },
        ],
        is_active: true,
      } as HomepageSectionGroupsConfig;
      break;

    case 'combo_sections':
      config = {
        group_header: 'Xem chi tiết từng bộ tài liệu',
        groups: [],
      } as ComboSectionsBlockConfig;
      break;

    case 'related_products':
      config = {
        title: 'Nhiều Thầy/Cô cũng chọn',
        mode: 'manual',
        product_ids: [],
        is_active: true,
      } as RelatedProductsBlockConfig;
      break;

    case 'gift_cross_sell':
      config = {
        heading: 'Các bộ tài liệu nổi bật do Huy Tutor biên soạn',
        product_ids: [],
      };
      break;

    // --- Nội Dung & Đọc Thử ---
    case 'product_intro':
      config = {
        bg_style: 'gray',
        paragraphs: ['Tài liệu được biên soạn kỹ lưỡng bám sát cấu trúc mới nhất của Bộ GD&ĐT.'],
        bullets_title: 'ĐIỂM NỔI BẬT:',
        bullets: [
          { id: `b_${Date.now()}_1`, text: 'Đáp án chi tiết, dịch nghĩa toàn bộ câu hỏi và bài đọc.', is_highlight: true },
          { id: `b_${Date.now()}_2`, text: 'File Word chuẩn font, dễ dàng chỉnh sửa phục vụ giảng dạy.', is_highlight: false },
          { id: `b_${Date.now()}_3`, text: 'Tích hợp hệ thống từ vựng học kèm trên Flashcard.', is_highlight: false },
        ],
        is_active: true,
      } as ProductIntroBlockConfig;
      break;

    case 'topic_accordion':
      config = {
        section_heading: 'Bản xem thử',
        show_quick_anchor_nav: false,
        accordions: [
          {
            id: `acc_${Date.now()}`,
            title: 'Danh sách chủ đề & Đề thi mẫu',
            default_open: true,
            items: ['Đề 01: Khởi động cơ bản', 'Đề 02: Tăng tốc nâng cao', 'Đề 03: Về đích chuyên sâu'],
          },
        ],
        is_active: true,
      } as TopicAccordionBlockConfig;
      break;

    case 'sample_groups':
      config = {
        groups: [
          {
            id: `sgrp_${Date.now()}`,
            title: 'Demo đề thi',
            description: 'Trích đoạn các trang mẫu thực tế của tài liệu',
            media_type: 'images',
            images: [],
            watermark_enabled: true,
            watermark_text: 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
            is_active: true,
            sort_order: 1,
          },
        ],
        is_active: true,
      } as SampleGroupsBlockConfig;
      break;

    case 'flashcard_features':
      config = {
        demo_card: {
          unit_title: 'Unit 1: Life Stories',
          word: 'accomplishment',
          phonetic: '/əˈkʌm.plɪʃ.mənt/',
          meaning: 'thành tựu, sự hoàn thành xuất sắc',
        },
        cta_button: {
          text: 'Trải nghiệm học ngay',
          action_type: 'link',
          target_url: '/flashcard',
        },
        features: [
          'Thuật toán lặp lại ngắt quãng thông minh',
          'Phát âm chuẩn giọng bản xứ Anh - Mỹ',
          'Ví dụ câu thực tế kèm dịch nghĩa song ngữ',
          'Đồng bộ tiến độ học trên mọi thiết bị',
        ],
      } as FlashcardFeaturesBlockConfig;
      break;

    case 'notice_text':
      config = {
        text: 'Tham gia nhóm Thảo luận & Hỗ trợ chuyên môn giáo viên tiếng Anh trên Facebook',
        cta_button_text: 'Tham gia ngay',
        cta_button_link: 'https://web.facebook.com/huytutor',
        is_active: true,
      } as HomepageNoticeTextConfig;
      break;

    case 'category_notice':
    case 'combo_notice':
      config = {
        title: 'Lưu ý khi sử dụng tài liệu',
        content: 'Tài liệu được bảo vệ bản quyền. Vui lòng không sao chép hoặc chia sẻ công khai.',
        bg_style: 'pink',
        is_active: true,
      };
      break;

    case 'flashcard_contact_notice':
      config = {
        bulk_order_text:
          'Thầy/Cô cần đăng ký trọn bộ hệ thống cho số lượng lớn học sinh vui lòng liên hệ fanpage hoặc email để nhận báo giá ưu đãi.',
        delivery_notice_text:
          'Sau khi hoàn tất đăng ký, Huy Tutor sẽ cấp quyền truy cập và gửi thông báo kích hoạt qua email trong vòng 5 phút.',
        is_active: true,
      } as FlashcardContactNoticeBlockConfig;
      break;

    case 'gift_form_embed':
      config = {
        form_title: 'Nhận tài liệu miễn phí từ Huy Tutor',
        form_description: 'Điền địa chỉ email để nhận ngay link tải Google Drive tài liệu miễn phí chất lượng cao.',
        form_url: '',
        is_active: true,
      };
      break;

    // --- Bảng Giá & Chính Sách ---
    case 'flashcard_free_tier':
      config = {
        title: '1. Gói dùng thử miễn phí',
        description: 'Trải nghiệm học thử các bộ từ vựng căn bản hoàn toàn miễn phí.',
        rules: [
          'Đăng ký tài khoản miễn phí để học ngay.',
          'Truy cập không giới hạn các chủ đề từ vựng mẫu.',
        ],
      } as FlashcardFreeTierBlockConfig;
      break;

    case 'flashcard_pricing_packages':
      config = {
        title: 'Bảng giá gói tài khoản cá nhân',
        benefit_text: 'Quyền lợi: Truy cập toàn bộ kho từ vựng và tính năng ôn tập nâng cao.',
        packages: [
          { id: 'pkg-1y', label: 'GÓI 1 NĂM', price: 100000, price_text: '100.000đ', badge_text: '1 tài khoản cá nhân' },
          { id: 'pkg-2y', label: 'GÓI 2 NĂM', price: 180000, price_text: '180.000đ', badge_text: 'Tiết kiệm 20.000đ' },
        ],
        is_active: true,
      } as FlashcardPricingBlockConfig;
      break;

    case 'flashcard_group_pricing':
      config = {
        columns: ['Gói 1 năm', 'Gói 2 năm', 'Gói 3 năm'],
        tiers: [
          { tier_name: 'Cá nhân', prices: ['100.000 đ', '180.000 đ', '250.000 đ'] },
          { tier_name: 'Nhóm 2-10', prices: ['80.000 đ/tk', '140.000 đ/tk', '190.000 đ/tk'] },
        ],
        cta_button_text: 'Đăng ký ngay tài khoản',
        default_price: 100000,
        is_active: true,
      } as FlashcardGroupPricingBlockConfig;
      break;

    // --- Chuyển Đổi & CTA ---
    case 'bottom_cta':
      config = {
        thank_you_text: 'CẢM ƠN QUÝ THẦY/CÔ ĐÃ QUAN TÂM TÀI LIỆU',
        btn_title: 'ĐẶT MUA NGAY TÀI LIỆU NÀY',
        discount_badge: 'Ưu đãi thành viên',
        format_badge: 'Word + PDF',
        is_active: true,
      };
      break;

    case 'combo_bottom_cta':
      config = {
        btn_title: 'Mua ngay trọn bộ combo',
        discount_text: 'Giảm tới 25%',
        note_text: '* Điểm thành viên được tích lũy tự động dựa trên số tiền thực tế thanh toán.',
        is_active: true,
      } as ComboBottomCtaBlockConfig;
      break;

    case 'gift_hero_anchors':
      config = {
        title: 'Tài liệu miễn phí',
        subtitle: 'Kho tài liệu ôn tập và đề thi bổ trợ hoàn toàn miễn phí dành cho học sinh và giáo viên.',
        anchors: [
          { id: 'anc_1', label: 'Đề chính thức Bộ GD', target_url: '/gifts/de-chinh-thuc' },
          { id: 'anc_2', label: 'Đề trường, sở giáo dục', target_url: '/gifts/de-truong-so' },
        ],
        is_active: true,
      };
      break;

    case 'gift_preview_download':
      config = {
        title: 'Tài liệu miễn phí',
        subtitle: 'File PDF có đáp án chi tiết',
        download_url: '',
        preview_images: [],
        watermark_text: 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
        is_active: true,
      };
      break;

    case 'campaign_frame':
      config = {
        title: 'CHIẾN DỊCH KHUYẾN MÃI ĐẶC BIỆT',
        subtitle: 'Khung ảnh ưu đãi giới hạn áp dụng độc quyền',
        frame_type: 'preset',
        preset_name: 'sale',
        custom_frame_url: '',
        scope: 'global',
        applied_product_ids: [],
        banner_text: 'Săn tài liệu ôn thi trọng tâm - Chiết khấu đặc biệt tới 35%',
        cta_label: 'Khám phá ngay',
        cta_url: '#',
        show_sample_products: true,
        aspect_ratio: '3:4',
        is_active: true,
      };
      break;

    case 'gift_donate_cta':
      config = {
        prompt_text: 'Ủng hộ tác giả để có thêm nhiều tài liệu miễn phí chất lượng!',
        button_text: 'Ủng hộ tác giả',
        target_url: '/donate',
        is_active: true,
      };
      break;

    case 'custom_html':
      config = {
        html_content: '<div style="padding: 24px; text-align: center;">\n  <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 8px;">Khối HTML tùy biến</h3>\n  <p style="color: #6b7280;">Chỉnh sửa nội dung HTML/CSS trong trình soạn thảo.</p>\n</div>',
        container_mode: 'boxed',
        no_padding: false,
        admin_label: 'Khối HTML',
        is_active: true,
      };
      break;

    default:
      config = { is_active: true };
      break;
  }

  return {
    id,
    type,
    title_label: label,
    is_active: true,
    sort_order: sortOrder,
    config,
  };
}

/**
 * Cấu hình 6 khối mặc định chuẩn nguyên bản của Trang Chủ Huy Tutor
 * Sử dụng để khởi tạo ban đầu hoặc phục hồi qua nút "Khôi phục Cấu hình Gốc"
 */
export const DEFAULT_HOMEPAGE_BLOCKS: HomepageBlockItem[] = [
  {
    id: 'block_hero_default',
    type: 'hero',
    title_label: 'Hero Header (Phần đầu trang)',
    is_active: true,
    sort_order: 1,
    config: {
      mode: 'structured',
      title: 'Dạy & học tiếng Anh với tài nguyên',
      subtitle: 'Chuẩn mực & Chi tiết',
      bullets: [
        '150+ đề thi thử, 9+ tài liệu bổ sung',
        'Hệ thống flashcard trực tuyến',
        'Sử dụng dễ dàng',
        'Bám sát xu hướng mới',
      ],
      image_url: '',
      is_active: true,
    } as HomepageHeroConfig,
  },
  {
    id: 'block_banner_default',
    type: 'top_banner',
    title_label: 'Top Banner (Ưu đãi / Nổi bật)',
    is_active: true,
    sort_order: 2,
    config: {
      mode: 'image_text',
      header_label: 'ƯU ĐÃI ĐẶC BIỆT',
      tag: 'HOT',
      title: 'Ưu đãi từ 15% khi mua combo',
      subtitle: 'Tích lũy điểm thưởng thành viên trọn đời',
      cta_badge: 'Xem ngay',
      link_url: '/combo-thpt',
      image_url: '',
      is_active: true,
    } as HomepageTopBannerConfig,
  },
  {
    id: 'block_cat_grid_default',
    type: 'categories_grid',
    title_label: 'Danh mục sản phẩm',
    is_active: true,
    sort_order: 3,
    config: {
      title: 'Danh mục sản phẩm',
      items: [
        { id: 'cat_fc', category_slug: 'flashcard', label: 'Flashcard', icon_code: 'flashcard', image_url: '', to: '/flashcard', is_active: true },
        { id: 'cat_thpt', category_slug: 'high-school', label: 'Tài liệu THPT', icon_code: 'high-school', image_url: '', to: '/high-school', is_active: true },
        { id: 'cat_hsg', category_slug: 'gifted-students', label: 'Tài liệu HSG', icon_code: 'gifted-students', image_url: '', to: '/gifted-students', is_active: true },
        { id: 'cat_thcs', category_slug: 'secondary-school', label: 'Tài liệu THCS', icon_code: 'secondary-school', image_url: '', to: '/secondary-school', is_active: true },
        { id: 'cat_template', category_slug: 'template', label: 'Mẫu trang tính', icon_code: 'template', image_url: '', to: '/template', is_active: true },
        { id: 'cat_gifts', category_slug: 'gifts', label: 'Tài liệu miễn phí', icon_code: 'gifts', image_url: '', to: '/gifts', is_active: true },
      ],
      is_active: true,
    } as HomepageCategoriesGridConfig,
  },
  {
    id: 'block_sec_groups_default',
    type: 'section_groups',
    title_label: 'Nhóm tài liệu & Sản phẩm',
    is_active: true,
    sort_order: 4,
    config: {
      sections: [
        {
          id: 'sec_thpt',
          title: 'Tài liệu THPT',
          category_slug: 'high-school',
          is_active: true,
          sort_order: 1,
          items: [
            {
              id: 'item_thpt_1',
              display_title: '30 đề thi thử ngôn ngữ Anh - Đánh giá năng lực Bộ Công an',
              image_url: '',
              target_url: '/high-school/dgnlbca',
              badge_text: 'Mới',
              tag_text: 'Luyện từ cơ bản đến nâng cao bám sát đề thi',
              is_active: true,
              sort_order: 1,
            },
            {
              id: 'item_thpt_2',
              display_title: 'Đột phá đề thi THPTQG môn Tiếng Anh (B2 - C2)',
              image_url: '',
              target_url: '/high-school/de-nang-cao-b2-c2',
              badge_text: 'Hot',
              tag_text: 'Dành cho kỳ thi THPTQG từ năm 2025',
              is_active: true,
              sort_order: 2,
            },
            {
              id: 'item_thpt_3',
              display_title: 'Bộ đề chuẩn cấu trúc (B1 - C1)',
              image_url: '',
              target_url: '/high-school/bo-de-chuan-cau-truc',
              badge_text: 'Bán chạy',
              tag_text: 'Dành cho Kỳ thi THPTQG từ năm 2025',
              is_active: true,
              sort_order: 3,
            },
          ],
        },
      ],
      is_active: true,
    } as HomepageSectionGroupsConfig,
  },
  {
    id: 'block_notice_default',
    type: 'notice_text',
    title_label: 'Thông báo & Kêu gọi hành động',
    is_active: true,
    sort_order: 5,
    config: {
      text: 'Tham gia nhóm Thảo luận & Hỗ trợ chuyên môn giáo viên tiếng Anh trên Facebook',
      cta_button_text: 'Tham gia ngay',
      cta_button_link: 'https://web.facebook.com/huytutor',
      is_active: true,
    } as HomepageNoticeTextConfig,
  },
  {
    id: 'block_btm_banner_default',
    type: 'bottom_banner',
    title_label: 'Bottom Banner (Chân trang)',
    is_active: true,
    sort_order: 6,
    config: {
      mode: 'structured',
      title: 'Tài liệu Tiếng Anh Huy Tutor',
      tag: 'TÀI LIỆU CHÍNH HÃNG',
      badge_text: 'CAM KẾT CHẤT LƯỢNG',
      link_url: '/combo-thpt',
      books: [],
      is_active: true,
    } as HomepageBottomBannerConfig,
  },
];
