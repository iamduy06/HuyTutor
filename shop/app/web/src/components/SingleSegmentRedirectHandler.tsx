import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { fixMalformedSlugUrl, buildProductUrl } from '../utils/urlHelper';
import { HomePage } from '../pages/HomePage';
import { CustomPageRenderer } from '../pages/UtilityPages';

/**
 * Component xử lý tự động sửa lỗi và điều hướng an toàn cho các đường dẫn 1 cấp (Single Segment):
 * 1. Nhận diện và render trực tiếp các trang tùy biến/chính sách tại Root (/:slug)
 * 2. Tự động nhận diện và sửa lỗi dính liền slug cấp 1 và cấp 2 (ví dụ: high-schoolde-nang-cao-b2-c2 -> /high-school/de-nang-cao-b2-c2)
 * 3. Tự động nhận diện trường hợp người dùng gõ trực tiếp product slug mà không có categorySlug -> điều hướng về /<categorySlug>/<productSlug>
 * 4. Tự động nhận diện category slug chưa được khai báo route tĩnh -> điều hướng về /category/<categorySlug>
 */
export const SingleSegmentRedirectHandler: React.FC = () => {
  const { singleSegment = '' } = useParams<{ singleSegment: string }>();
  const navigate = useNavigate();
  const { products, categories, siteConfigs } = useStore();

  const cleanSlug = (singleSegment || '').toLowerCase().trim();

  // Kiểm tra nếu singleSegment khớp với một Custom Page động tại Root
  const matchedCustomPage = useMemo(() => {
    if (!cleanSlug || !siteConfigs?.custom_pages_config?.pages) return null;
    return siteConfigs.custom_pages_config.pages.find(
      (p) => p.is_active && p.slug.toLowerCase().trim() === cleanSlug
    );
  }, [cleanSlug, siteConfigs?.custom_pages_config]);

  useEffect(() => {
    if (!singleSegment || matchedCustomPage) return;

    // 1. Trường hợp đường link bị dính liền slug cấp 1 và cấp 2 (ví dụ: high-schoolde-nang-cao-b2-c2)
    const fixedUrl = fixMalformedSlugUrl(singleSegment);
    if (fixedUrl && fixedUrl !== `/${singleSegment}`) {
      navigate(fixedUrl, { replace: true });
      return;
    }

    // 2. Trường hợp người dùng gõ trực tiếp slug sản phẩm cấp 2 mà không có categorySlug (ví dụ: /de-nang-cao-b2-c2 hoặc /dot-pha-b2-c2)
    if (products && products.length > 0) {
      const matchedProd = products.find(
        (p) =>
          p.slug.toLowerCase() === cleanSlug ||
          p.id === cleanSlug ||
          (cleanSlug === 'de-nang-cao-b2-c2' && p.slug === 'dot-pha-b2-c2') ||
          (cleanSlug === 'chotha' && p.slug === '30-de-chot-ha')
      );
      if (matchedProd) {
        navigate(buildProductUrl(matchedProd.category_slug, matchedProd.slug), { replace: true });
        return;
      }
    }

    // 3. Trường hợp danh mục chưa được khai báo route tĩnh
    if (categories && categories.length > 0) {
      const matchedCat = categories.find((c) => c.slug.toLowerCase() === cleanSlug);
      if (matchedCat) {
        navigate(`/category/${matchedCat.slug}`, { replace: true });
        return;
      }
    }
  }, [singleSegment, cleanSlug, navigate, products, categories, matchedCustomPage]);

  // Nếu khớp một trang tùy biến/chính sách động tại root, hiển thị ngay trang đó!
  if (matchedCustomPage) {
    return <CustomPageRenderer page={matchedCustomPage} />;
  }

  // Nếu không nhận diện được lỗi, hiển thị Trang chủ an toàn
  return <HomePage />;
};
