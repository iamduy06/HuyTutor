/**
 * HUY TUTOR - CAMPAIGN FRAME SLUG REGISTRY MODULE
 * File: shop/app/web/src/utils/slugRegistry.ts
 *
 * Single Source of Truth for all static & dynamic routes/slugs in web shop.
 * Used by AdminCampaignFrameCms and ProductImageFrame.
 * Tuân thủ quy chuẩn: GEMINI.md & strict-env-urls (không hardcode URL/domain, dùng relative path)
 */

import {
  CategoryItem,
  Product,
  CustomPageItem,
  CampaignSlugMatchMode,
} from '../types';

/**
 * Phân nhóm tuyến đường (Slug Groups)
 */
export type SlugGroupKey =
  | 'core'
  | 'category_level1'
  | 'product_level2'
  | 'utility_policy_custom';

export interface SlugGroupMeta {
  key: SlugGroupKey;
  title: string;
  badge: string;
  description: string;
}

export const SLUG_GROUPS: Record<SlugGroupKey, SlugGroupMeta> = {
  core: {
    key: 'core',
    title: '[NHÓM 1: TUYẾN ĐƯỜNG CỐT LÕI (CORE HUBS)] - Các trung tâm trang chính: Trang chủ, Combo THPT, Flashcard, Tủ sách cá nhân',
    badge: 'Core Hub',
    description: 'Các trung tâm trang chính: Trang chủ, Combo THPT, Flashcard, Tủ sách cá nhân',
  },
  category_level1: {
    key: 'category_level1',
    title: '[NHÓM 2: TRANG DANH MỤC CẤP 1 ĐỘNG (LEVEL-1 CATEGORIES)] - Các trang danh mục cha cấp 1',
    badge: 'Cấp 1',
    description: 'Các trang danh mục cha cấp 1 (THPT, HSG, THCS, Quà tặng, v.v.)',
  },
  product_level2: {
    key: 'product_level2',
    title: '[NHÓM 3: CHI TIẾT SẢN PHẨM CẤP 2 ĐỘNG (LEVEL-2 PRODUCTS)] - Từng trang chi tiết tài liệu/sản phẩm cụ thể',
    badge: 'Cấp 2',
    description: 'Từng trang chi tiết tài liệu/sản phẩm cụ thể trong hệ thống',
  },
  utility_policy_custom: {
    key: 'utility_policy_custom',
    title: '[NHÓM 4: TIỆN ÍCH, CHÍNH SÁCH & TRANG ĐỘNG (UTILITY, POLICIES & CUSTOM)] - Các trang soạn tài liệu, donate, faq, chính sách song ngữ & trang tùy biến',
    badge: 'Tiện ích & CS',
    description: 'Các trang soạn tài liệu, donate, faq, chính sách song ngữ & trang tùy biến',
  },
};

/**
 * Định nghĩa chi tiết của từng Slug Item
 */
export interface SlugItem {
  slug: string;                 // Đường dẫn chuẩn hóa (e.g. '/', '/high-school', '/dieu-khoan-su-dung')
  label: string;                // Tiêu đề hiển thị thân thiện bằng tiếng Việt
  group: SlugGroupKey;          // Nhóm phân loại
  badge: string;                // Huy hiệu hiển thị ('Core Hub', 'Cấp 1', 'Cấp 2', 'Tiện ích', 'Chính sách', 'Trang tuỳ biến')
  aliases: string[];            // Toàn bộ đường dẫn tương thích/song ngữ (khi chọn item này thì kích hoạt tất cả aliases)
  count?: number;               // Số lượng sản phẩm trực thuộc (dành cho Cấp 1)
  productId?: string;           // Mã ID sản phẩm (dành cho Cấp 2)
  categorySlug?: string;        // Slug danh mục cha (dành cho Cấp 2)
  categoryName?: string;        // Tên danh mục cha (dành cho Cấp 2)
  isDynamic?: boolean;          // true: lấy từ database; false: tĩnh từ router
}

/**
 * Danh sách Slug Tuyến đường Cốt lõi tĩnh
 */
export const STATIC_CORE_SLUGS: SlugItem[] = [
  {
    slug: '/',
    label: 'Trang chủ (Homepage)',
    group: 'core',
    badge: 'Core Hub',
    aliases: ['/', '/home'],
    isDynamic: false,
  },
  {
    slug: '/combo-thpt',
    label: 'Trang Combo THPT Toàn diện',
    group: 'core',
    badge: 'Core Hub',
    aliases: ['/combo-thpt'],
    isDynamic: false,
  },
  {
    slug: '/flashcard',
    label: 'Phân hệ Flashcard Học tập',
    group: 'core',
    badge: 'Core Hub',
    aliases: ['/flashcard'],
    isDynamic: false,
  },
  {
    slug: '/my-library',
    label: 'Tủ sách Cá nhân',
    group: 'core',
    badge: 'Core Hub',
    aliases: ['/my-library'],
    isDynamic: false,
  },
];

/**
 * Danh sách danh mục Cấp 1 mặc định (fallback khi DB chưa load hoặc trống)
 */
export const DEFAULT_STATIC_CATEGORIES: { slug: string; name: string }[] = [
  { slug: 'high-school', name: 'Ôn thi THPT Quốc Gia & ĐGNL' },
  { slug: 'gifted-students', name: 'Ôn thi Học sinh giỏi & Chuyên khối' },
  { slug: 'secondary-school', name: 'Tài liệu Cấp 2 THCS cơ bản & nâng cao' },
  { slug: 'gifts', name: 'Tài liệu Quà tặng & Tri ân' },
  { slug: 'do-dung-day-hoc', name: 'Giáo án & Đồ dùng dạy học' },
  { slug: 'other', name: 'Tài liệu khác & Tổng hợp' },
  { slug: 'template', name: 'Biểu mẫu & Template soạn thảo' },
];

/**
 * Danh sách Tuyến đường Tiện ích & Chính sách tĩnh chuẩn hóa (hợp nhất song ngữ EN/VI)
 */
export const STATIC_UTILITY_POLICY_SLUGS: SlugItem[] = [
  // 1. Tiện ích
  {
    slug: '/soan-tai-lieu',
    label: 'Soạn tài liệu theo yêu cầu',
    group: 'utility_policy_custom',
    badge: 'Tiện ích',
    aliases: ['/soan-tai-lieu'],
    isDynamic: false,
  },
  {
    slug: '/donate',
    label: 'Ủng hộ tác giả & Quỹ phát triển',
    group: 'utility_policy_custom',
    badge: 'Tiện ích',
    aliases: ['/donate', '/ung-ho-tac-gia'],
    isDynamic: false,
  },
  {
    slug: '/faq',
    label: 'Câu hỏi thường gặp & Trợ giúp (FAQ)',
    group: 'utility_policy_custom',
    badge: 'Tiện ích',
    aliases: ['/faq', '/cau-hoi-thuong-gap'],
    isDynamic: false,
  },
  {
    slug: '/hc-rewards',
    label: 'Hc Rewards - Thưởng & Tích điểm',
    group: 'utility_policy_custom',
    badge: 'Tiện ích',
    aliases: ['/hc-rewards'],
    isDynamic: false,
  },
  // 2. Chính sách (Gộp cặp song ngữ chuẩn hóa tiếng Việt)
  {
    slug: '/dieu-khoan-su-dung',
    label: 'Điều khoản dịch vụ & sử dụng',
    group: 'utility_policy_custom',
    badge: 'Chính sách',
    aliases: ['/dieu-khoan-su-dung', '/terms-of-service'],
    isDynamic: false,
  },
  {
    slug: '/chinh-sach-bao-mat',
    label: 'Chính sách bảo mật thông tin',
    group: 'utility_policy_custom',
    badge: 'Chính sách',
    aliases: ['/chinh-sach-bao-mat', '/privacy-policy'],
    isDynamic: false,
  },
  {
    slug: '/thanh-toan-va-giao-hang',
    label: 'Chính sách thanh toán & giao hàng',
    group: 'utility_policy_custom',
    badge: 'Chính sách',
    aliases: [
      '/thanh-toan-va-giao-hang',
      '/chinh-sach-thanh-toan-giao-hang',
      '/payment-delivery-policy',
    ],
    isDynamic: false,
  },
  {
    slug: '/chinh-sach-hoan-tien',
    label: 'Chính sách hoàn tiền & khiếu nại',
    group: 'utility_policy_custom',
    badge: 'Chính sách',
    aliases: ['/chinh-sach-hoan-tien', '/refund-policy'],
    isDynamic: false,
  },
  {
    slug: '/chinh-sach-ban-quyen',
    label: 'Bản quyền & sở hữu trí tuệ',
    group: 'utility_policy_custom',
    badge: 'Chính sách',
    aliases: [
      '/chinh-sach-ban-quyen',
      '/ban-quyen-va-so-huu',
      '/copyright-policy',
    ],
    isDynamic: false,
  },
];

/**
 * Trích xuất toàn bộ slug tĩnh & động trong hệ thống theo 4 nhóm chuẩn hóa
 */
export function extractAllSlugs(
  categories?: CategoryItem[],
  products?: Product[],
  customPages?: CustomPageItem[]
): SlugItem[] {
  const result: SlugItem[] = [];

  // 1. Nhóm Core Hubs (4 trang tĩnh chính)
  result.push(...STATIC_CORE_SLUGS);

  // 2. Nhóm Category Cấp 1 động (hoặc fallback tĩnh)
  const catList =
    Array.isArray(categories) && categories.length > 0
      ? categories
      : DEFAULT_STATIC_CATEGORIES;

  for (const cat of catList) {
    const rawSlug = (cat.slug || '').replace(/^\/+/, '').replace(/\/+$/, '').trim();
    if (!rawSlug) continue;
    const catPath = `/${rawSlug}`;
    const productCount = Array.isArray(products)
      ? products.filter((p) => {
          const pCat = (p.category_slug || '').replace(/^\/+/, '').replace(/\/+$/, '').trim();
          return pCat === rawSlug;
        }).length
      : 0;

    result.push({
      slug: catPath,
      label: cat.name,
      group: 'category_level1',
      badge: 'Cấp 1',
      aliases: [catPath, `/category/${rawSlug}`],
      count: productCount,
      isDynamic: true,
    });
  }

  // 3. Nhóm Product Cấp 2 động
  if (Array.isArray(products) && products.length > 0) {
    for (const prod of products) {
      const catSlug = (prod.category_slug || '').replace(/^\/+/, '').replace(/\/+$/, '').trim();
      const prodSlug = (prod.slug || '').replace(/^\/+/, '').replace(/\/+$/, '').trim();
      if (!catSlug || !prodSlug) continue;

      const fullPath = `/${catSlug}/${prodSlug}`;
      const prodTitle = prod.title || (prod as any).name || prod.code || 'Sản phẩm';
      result.push({
        slug: fullPath,
        label: prodTitle,
        group: 'product_level2',
        badge: 'Cấp 2',
        aliases: [fullPath, `/${prodSlug}`],
        productId: prod.id,
        categorySlug: catSlug,
        categoryName: prod.category_name,
        isDynamic: true,
      });
    }
  }

  // 4. Nhóm Utility, Policy & Custom Pages
  // 4.1. Static Utilities & Policies (Đã hợp nhất song ngữ)
  result.push(...STATIC_UTILITY_POLICY_SLUGS);

  // 4.2. Dynamic Custom Pages (lấy từ custom_pages_config.pages)
  if (Array.isArray(customPages) && customPages.length > 0) {
    for (const cp of customPages) {
      if (cp.is_active === false) continue;
      const rawSlug = (cp.slug || '').replace(/^\/+/, '').replace(/\/+$/, '').trim();
      if (!rawSlug) continue;

      const path = `/${rawSlug}`;
      result.push({
        slug: path,
        label: cp.title || `Trang /${rawSlug}`,
        group: 'utility_policy_custom',
        badge: 'Trang tuỳ biến',
        aliases: [path, `/p/${rawSlug}`],
        isDynamic: true,
      });
    }
  }

  return result;
}

/**
 * Tích chọn hoặc bỏ chọn một SlugItem:
 * Tự động đồng bộ toàn bộ aliases của item đó vào applied_slugs
 */
export function toggleSlugItem(
  currentApplied: string[],
  item: SlugItem,
  selected: boolean
): string[] {
  const currentSet = new Set(currentApplied || []);
  const targets = [item.slug, ...(item.aliases || [])];

  if (selected) {
    targets.forEach((t) => currentSet.add(t));
  } else {
    targets.forEach((t) => currentSet.delete(t));
  }

  return Array.from(currentSet);
}

/**
 * Kiểm tra xem một SlugItem có đang được chọn hay không:
 * Chỉ cần slug chính hoặc bất kỳ alias nào có trong applied_slugs
 */
export function isSlugSelected(
  currentApplied: string[],
  item: SlugItem
): boolean {
  if (!currentApplied || currentApplied.length === 0) return false;
  const currentSet = new Set(currentApplied);
  if (currentSet.has(item.slug)) return true;
  return item.aliases?.some((alias) => currentSet.has(alias)) ?? false;
}

/**
 * Chọn tất cả slug từ danh sách các items được truyền vào
 */
export function selectAllSlugs(
  currentApplied: string[],
  items: SlugItem[]
): string[] {
  const currentSet = new Set(currentApplied || []);
  for (const item of items) {
    currentSet.add(item.slug);
    if (item.aliases) {
      item.aliases.forEach((a) => currentSet.add(a));
    }
  }
  return Array.from(currentSet);
}

/**
 * Bỏ chọn tất cả slug từ danh sách items truyền vào
 */
export function deselectAllSlugs(
  currentApplied: string[],
  items: SlugItem[]
): string[] {
  const currentSet = new Set(currentApplied || []);
  for (const item of items) {
    currentSet.delete(item.slug);
    if (item.aliases) {
      item.aliases.forEach((a) => currentSet.delete(a));
    }
  }
  return Array.from(currentSet);
}

/**
 * Kiểm tra xem một đường dẫn (rawPath) có khớp với danh sách applied_slugs hay không
 * theo chế độ matchMode: 'exact' | 'include_children'
 */
export function isPathMatchingAppliedSlugs(
  rawPath: string,
  appliedSlugs: string[],
  matchMode: CampaignSlugMatchMode = 'exact'
): boolean {
  if (!appliedSlugs || appliedSlugs.length === 0) return false;

  // Chuẩn hóa path: bỏ trailing slash (trừ root '/'), nếu rỗng thì là '/'
  const normalizedPath = rawPath.replace(/\/+$/, '') || '/';
  const appliedSet = new Set(appliedSlugs.map((s) => s.replace(/\/+$/, '') || '/'));

  if (matchMode === 'exact') {
    return appliedSet.has(normalizedPath);
  }

  // matchMode === 'include_children'
  for (const slug of appliedSet) {
    if (slug === '/') {
      if (normalizedPath === '/') return true;
    } else {
      if (normalizedPath === slug || normalizedPath.startsWith(slug + '/')) {
        return true;
      }
    }
  }

  return false;
}
