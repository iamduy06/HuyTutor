/**
 * Danh sách các slug danh mục cấp 1 hợp lệ trong hệ sinh thái Huy Tutor
 */
export const KNOWN_CATEGORY_SLUGS: string[] = [
  'high-school',
  'secondary-school',
  'gifted-students',
  'gifts',
  'combo-thpt',
  'flashcard',
  'other',
  'template',
  'do-dung-day-hoc',
];

/**
 * Xây dựng URL chuẩn mực 2 cấp cho trang Chi tiết Sản phẩm:
 * Cấu trúc chuẩn: /<categorySlug>/<productSlug>
 *
 * - Tự động loại bỏ các dấu gạch chéo dư thừa
 * - Tự động chuẩn hóa categorySlug về 'high-school' nếu thiếu hoặc bị gán tiền tố legacy (tai-lieu, san-pham, catalog)
 * - Đảm bảo luôn luôn có đúng 1 dấu '/' ở đầu và đúng 1 dấu '/' phân tách giữa 2 cấp
 */
export function buildProductUrl(
  categorySlug?: string | null,
  productSlug?: string | null
): string {
  let cleanCat = (categorySlug || 'high-school').trim().replace(/^\/+|\/+$/g, '');
  const cleanProd = (productSlug || '').trim().replace(/^\/+|\/+$/g, '');

  // Chuẩn hóa các tiền tố legacy cũ về high-school
  if (!cleanCat || cleanCat === 'tai-lieu' || cleanCat === 'san-pham' || cleanCat === 'catalog') {
    cleanCat = 'high-school';
  }

  if (!cleanProd) {
    return `/${cleanCat}`;
  }

  return `/${cleanCat}/${cleanProd}`;
}

/**
 * Tự động phát hiện và sửa chữa các URL bị lỗi dính liền slug cấp 1 và cấp 2.
 * Ví dụ:
 * - "high-schoolde-nang-cao-b2-c2" -> "/high-school/de-nang-cao-b2-c2"
 * - "/high-schoolde-nang-cao-b2-c2" -> "/high-school/de-nang-cao-b2-c2"
 * - "/tai-lieu/de-nang-cao-b2-c2" -> "/high-school/de-nang-cao-b2-c2"
 * - "/san-pham/de-nang-cao-b2-c2" -> "/high-school/de-nang-cao-b2-c2"
 * - "/catalog/high-school/de-nang-cao-b2-c2" -> "/high-school/de-nang-cao-b2-c2"
 */
export function fixMalformedSlugUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed === '#' ||
    trimmed.startsWith('#') ||
    /^(https?:)?\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed)
  ) {
    return trimmed;
  }

  // Bỏ dấu gạch chéo đầu để phân tích
  const pathWithoutLeadingSlash = trimmed.replace(/^\/+/, '');

  // 1. Kiểm tra trường hợp dính liền slug cấp 1 và cấp 2 (ví dụ: high-schoolde-nang-cao-b2-c2)
  for (const catSlug of KNOWN_CATEGORY_SLUGS) {
    if (pathWithoutLeadingSlash.startsWith(catSlug)) {
      const remainder = pathWithoutLeadingSlash.slice(catSlug.length);
      // Nếu phần còn lại bắt đầu bằng ký tự khác '/' (tức là bị dính liền)
      if (remainder.length > 0 && !remainder.startsWith('/')) {
        return `/${catSlug}/${remainder}`;
      }
    }
  }

  // 2. Chuẩn hóa các tiền tố legacy
  if (pathWithoutLeadingSlash.startsWith('tai-lieu/')) {
    return `/high-school/${pathWithoutLeadingSlash.slice('tai-lieu/'.length)}`;
  }
  if (pathWithoutLeadingSlash.startsWith('san-pham/')) {
    return `/high-school/${pathWithoutLeadingSlash.slice('san-pham/'.length)}`;
  }
  if (pathWithoutLeadingSlash.startsWith('catalog/')) {
    const subPath = pathWithoutLeadingSlash.slice('catalog/'.length);
    const parts = subPath.split('/');
    if (parts.length >= 2 && KNOWN_CATEGORY_SLUGS.includes(parts[0])) {
      return `/${parts.join('/')}`;
    }
    return `/high-school/${subPath}`;
  }

  // Luôn đảm bảo bắt đầu bằng dấu gạch chéo
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
