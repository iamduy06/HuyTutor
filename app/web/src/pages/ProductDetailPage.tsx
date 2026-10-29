import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { WatermarkViewer } from '../components/WatermarkViewer';
import { useStore } from '../context/StoreContext';
import {
  FORMAT_TO_GOOGLE_FORM_MAP,
  formatVnd,
  Product,
  UiFormatCode,
} from '../types';

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
  const { productSlug = '' } = useParams<{
    categorySlug: string;
    productSlug: string;
  }>();

  const { products, addToCart, buyNow, showToast } = useStore();
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

  if (!product) {
    return (
      <main className="max-w-[680px] mx-auto px-4 py-14 text-center">
        <p className="text-xs text-gray-500">
          Đang tải thông tin chi tiết tài liệu từ Backend API...
        </p>
      </main>
    );
  }

  const activeFormats =
    product.formats.filter((f) => f.is_active).length > 0
      ? product.formats.filter((f) => f.is_active)
      : product.formats;

  const currentFormatObj =
    activeFormats.find((f) => f.format_code === selectedFormat) || activeFormats[0];
  const currentPrice = currentFormatObj ? currentFormatObj.price : 150000;
  const isFreeGift = currentPrice === 0 || product.category_slug === 'gifts';
  const coverLines = (product.cover_tag || 'Dành cho\nKỳ thi THPTQG\ntừ năm 2027').split('\n');

  return (
    <main className="max-w-[680px] mx-auto px-4 py-8">
      {/* 1. TOP PRODUCT SUMMARY BOX CHUẨN MẪU SCREENSHOT 5 */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-8">
        <div className="md:col-span-5 bg-[#f8f9fa] border border-gray-200 rounded-md p-5 flex items-center justify-between relative shadow-sm">
          {product.badge_text && (
            <span className="absolute top-2.5 right-2.5 bg-[#e60049] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-sm">
              {product.badge_text}
            </span>
          )}
          <div className="w-[46%] flex justify-center">
            {product.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.title}
                className="book-3d w-24 h-32 rounded-sm object-cover border border-white/20"
              />
            ) : (
              <div className="book-3d w-24 h-32 rounded-sm bg-gradient-to-br from-orange-500 via-pink-600 to-purple-800 p-2.5 flex flex-col justify-between text-white">
                <span className="text-[6px] font-bold uppercase opacity-80">HUY TUTOR</span>
                <div className="font-extrabold text-[8px] leading-tight uppercase">
                  {product.code || product.title}
                </div>
                <span className="text-[6px] bg-white/20 px-1 py-0.5 rounded-sm w-fit">2026</span>
              </div>
            )}
          </div>
          <div className="w-[52%] pl-2">
            <p className="text-[11px] text-gray-600 leading-snug">
              {coverLines.map((line, i) => (
                <React.Fragment key={i}>
                  {i === coverLines.length - 1 ? (
                    <strong className="text-gray-800">{line}</strong>
                  ) : (
                    line
                  )}
                  {i < coverLines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
            <div className="h-[2px] w-16 bg-[#e60049] mt-1.5" />
          </div>
        </div>

        <div className="md:col-span-7">
          <h1 className="text-base sm:text-lg font-extrabold text-[#e60049] leading-snug mb-2">
            {product.title}
          </h1>

          <div className="mb-3 flex items-baseline gap-2">
            <span className="inline-block bg-[#e60049] text-white text-xs font-extrabold px-2.5 py-0.5 rounded-sm">
              {isFreeGift ? 'Miễn phí 100%' : formatVnd(currentPrice)}
            </span>
            {!isFreeGift && (
              <span className="text-[10px] text-gray-500 font-medium">
                Định dạng: <strong>{selectedFormat}</strong> (Ghi chú Form:{' '}
                <strong>{FORMAT_TO_GOOGLE_FORM_MAP[selectedFormat]}</strong>)
              </span>
            )}
          </div>

          {!isFreeGift && (
            <div className="mb-3">
              <div className="text-[10px] font-bold text-gray-700 uppercase mb-1">
                Chọn định dạng tài liệu cần mua:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeFormats.map((fmt) => {
                  const isSelected = fmt.format_code === selectedFormat;
                  return (
                    <button
                      key={fmt.format_code}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.format_code)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-sm border transition ${
                        isSelected
                          ? 'bg-[#e60049] text-white border-[#e60049]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#e60049]'
                      }`}
                    >
                      {fmt.format_code} ({formatVnd(fmt.price)})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.specs && product.specs.length > 0 && (
            <ul className="text-[11px] text-gray-700 space-y-1 mb-4 leading-relaxed">
              {product.specs.map((sp, idx) => (
                <li key={idx}>
                  • <strong>{sp.label}:</strong> {sp.val}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            {isFreeGift ? (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="#khu-vuc-doc-thu"
                  onClick={() =>
                    showToast('Đang mở bản xem & tải miễn phí tài liệu quà tặng.')
                  }
                  className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2 rounded-sm text-center transition"
                >
                  Tải về miễn phí
                </a>
                <Link
                  to="/donate"
                  className="w-full bg-[#fff0f3] hover:bg-pink-100 text-[#e60049] border border-[#e60049] font-bold text-xs py-2 rounded-sm text-center transition"
                >
                  Ủng hộ tác giả
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => buyNow(product, selectedFormat, 1)}
                  className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2 rounded-sm transition"
                >
                  Mua ngay
                </button>
                <button
                  type="button"
                  onClick={() => addToCart(product, selectedFormat, 1)}
                  className="w-full bg-[#fff0f3] hover:bg-pink-100 text-[#e60049] border border-[#e60049] font-bold text-xs py-2 rounded-sm transition"
                >
                  Thêm vào giỏ hàng
                </button>
              </div>
            )}
            <div className="text-center">
              <a
                href="#khu-vuc-doc-thu"
                className="text-[11px] text-gray-600 underline hover:text-[#e60049]"
              >
                Đọc thử
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MÔ TẢ CHI TIẾT, CHỦ ĐỀ (TOPICS) & ĐẶC ĐIỂM NỔI BẬT (FEATURES) */}
      <section className="text-[11px] text-gray-700 leading-relaxed space-y-3 mb-8 border-t border-gray-100 pt-5">
        {product.short_desc && <p>{product.short_desc}</p>}

        {product.topics && product.topics.length > 0 && (
          <div>
            <p className="font-bold text-[#e60049] mb-1">
              Nội dung &amp; các chủ đề trọng tâm trong tài liệu:
            </p>
            <ul className="space-y-1 pl-3">
              {product.topics.map((topic, idx) => (
                <li key={idx}>• {topic}</li>
              ))}
            </ul>
          </div>
        )}

        {product.features && product.features.length > 0 && (
          <div>
            <p className="font-bold text-gray-900 mb-1">Đặc điểm nổi bật của bộ tài liệu:</p>
            <ul className="space-y-1 pl-3">
              {product.features.map((feat, idx) => (
                <li key={idx}>• {feat}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 3. KHU VỰC ĐỌC THỬ DUY NHẤT 1 CHẾ ĐỘ KÈM WATERMARK BẮT BUỘC */}
      <WatermarkViewer product={product} />

      {/* 4. THANH CTA CUỐI TRANG */}
      <section className="mb-12">
        <p className="text-[11px] font-bold text-[#e60049] mb-2">
          {isFreeGift
            ? 'Chia sẻ tài liệu hữu ích này tới đồng nghiệp và học sinh!'
            : 'Đặt mua ngay hôm nay để nhận ưu đãi tốt nhất!'}
        </p>
        {isFreeGift ? (
          <Link
            to="/donate"
            className="block w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2 rounded-sm text-center transition mb-2"
          >
            Ủng hộ tác giả
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => buyNow(product, selectedFormat, 1)}
            className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2 rounded-sm transition mb-2"
          >
            Mua ngay
          </button>
        )}
        <div className="text-center">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-[11px] text-gray-500 underline hover:text-[#e60049]"
          >
            Trở về đầu trang ↑
          </button>
        </div>
      </section>

      {/* 5. TÀI LIỆU LIÊN QUAN */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-[#e60049] font-bold text-sm mb-4">Tài liệu liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
