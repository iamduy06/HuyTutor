import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildProductUrl } from '../utils/urlHelper';
import { apiClient } from '../api/client';
import { buildInitialDetailBlocksFromProduct } from '../components/DynamicProductDetailBlocks';
import { UniversalBlockRenderer } from '../components/UniversalBlockRenderer';
import { useStore } from '../context/StoreContext';
import { Product, UiFormatCode } from '../types';

const FRONTEND_SLUG_ALIAS_MAP: Record<string, string> = {
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

export const ProductDetailPage: React.FC = () => {
  const { categorySlug = '', productSlug = '' } = useParams<{
    categorySlug: string;
    productSlug: string;
  }>();
  const navigate = useNavigate();

  const { products, addToCart, buyNow } = useStore();

  // Tự động chuẩn hóa nếu người dùng truy cập qua tiền tố cũ (tai-lieu, san-pham, catalog)
  useEffect(() => {
    if (categorySlug === 'tai-lieu' || categorySlug === 'san-pham' || categorySlug === 'catalog') {
      navigate(buildProductUrl('high-school', productSlug), { replace: true });
    }
  }, [categorySlug, productSlug, navigate]);
  const [remoteProduct, setRemoteProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<UiFormatCode>('Word');

  const resolvedSlug = FRONTEND_SLUG_ALIAS_MAP[productSlug] || productSlug;

  const product = useMemo(() => {
    return (
      remoteProduct ||
      products.find(
        (p) =>
          p.slug === resolvedSlug ||
          p.slug === productSlug ||
          p.id === productSlug
      ) ||
      null
    );
  }, [remoteProduct, products, resolvedSlug, productSlug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!productSlug) return;

    apiClient
      .getProductDetail(productSlug)
      .then((res) => {
        setRemoteProduct(res.product);
        setRelatedProducts(res.relatedProducts);
        const firstActive =
          res.product.formats.find((f) => f.is_active) || res.product.formats[0];
        if (firstActive) {
          setSelectedFormat(firstActive.format_code);
        }
      })
      .catch(() => {
        const localMatch = products.find(
          (p) => p.slug === resolvedSlug || p.slug === productSlug
        );
        if (localMatch) {
          const firstActive =
            localMatch.formats.find((f) => f.is_active) || localMatch.formats[0];
          if (firstActive) setSelectedFormat(firstActive.format_code);
          setRelatedProducts(
            products
              .filter(
                (p) =>
                  p.category_slug === localMatch.category_slug &&
                  p.slug !== localMatch.slug
              )
              .slice(0, 3)
          );
        }
      });
  }, [productSlug, resolvedSlug, products]);

  const activeBlocks = useMemo(() => {
    if (!product) return [];
    const allBlocks = buildInitialDetailBlocksFromProduct(product);
    return allBlocks.filter((b) => b.is_active !== false);
  }, [product]);

  if (!product) {
    return (
      <main className="max-w-[820px] mx-auto px-4 py-14 text-center">
        <p className="text-xs text-gray-500">Đang tải thông tin tài liệu...</p>
      </main>
    );
  }

  return (
    <main className="max-w-[820px] mx-auto px-4 py-8 sm:py-10 space-y-8 sm:space-y-10">
      <UniversalBlockRenderer
        blocks={activeBlocks}
        context={{
          pageType: 'product_detail',
          product,
          allProducts: relatedProducts.length > 0 ? relatedProducts : products,
        }}
        selectedFormat={selectedFormat}
        onSelectFormat={setSelectedFormat}
        onBuyNow={(fmt) => buyNow(product, fmt, 1)}
        onAddToCart={(fmt) => addToCart(product, fmt, 1)}
      />
    </main>
  );
};
