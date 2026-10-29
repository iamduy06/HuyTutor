import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

const BOOK_GRADIENTS = [
  'from-orange-500 via-pink-600 to-purple-800',
  'from-amber-700 via-orange-800 to-stone-900',
  'from-teal-700 to-emerald-900',
  'from-indigo-900 via-blue-900 to-teal-700',
  'from-red-700 via-orange-700 to-amber-900',
  'from-emerald-800 via-green-900 to-stone-900',
  'from-fuchsia-800 via-purple-800 to-pink-700',
  'from-rose-600 to-red-700',
];

function getBookGradient(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BOOK_GRADIENTS[Math.abs(hash) % BOOK_GRADIENTS.length];
}

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const detailUrl = `/${product.category_slug || 'high-school'}/${product.slug}`;
  const coverLines = (product.cover_tag || 'Dành cho\nKỳ thi THPTQG\ntừ năm 2027').split('\n');
  const gradientClass = getBookGradient(product.slug);

  return (
    <div className="product-card flex flex-col">
      <Link
        to={detailUrl}
        className="bg-[#f8f9fa] border border-gray-200 rounded-md p-4 mb-2 h-[185px] flex items-center justify-between relative shadow-sm hover:border-[#e60049]/50 transition"
      >
        {product.badge_text && (
          <span className="absolute top-2.5 right-2.5 bg-[#e60049] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-sm">
            {product.badge_text}
          </span>
        )}

        {/* 3D Book Cover hoặc Ảnh bìa Thumbnail từ Cloudflare R2 */}
        <div className="w-[44%] flex justify-center">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className="book-3d w-20 h-28 rounded-sm object-cover border border-white/20"
            />
          ) : (
            <div
              className={`book-3d w-20 h-28 rounded-sm bg-gradient-to-br ${gradientClass} p-2 flex flex-col justify-between text-white`}
            >
              <span className="text-[6px] font-bold uppercase opacity-80">HUY TUTOR</span>
              <div className="font-extrabold text-[8px] leading-tight uppercase line-clamp-3">
                {product.code || product.title}
              </div>
              <span className="text-[6px] bg-white/20 px-1 py-0.5 rounded-sm w-fit">2026</span>
            </div>
          )}
        </div>

        {/* Cover Tag bên phải kèm gạch chân đỏ */}
        <div className="w-[54%] pl-2 text-left">
          <p className="text-[11px] text-gray-600 leading-snug">
            {coverLines.map((line, idx) => (
              <React.Fragment key={idx}>
                {idx === coverLines.length - 1 ? (
                  <strong className="text-gray-800">{line}</strong>
                ) : (
                  line
                )}
                {idx < coverLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
          <div className="h-[2px] w-16 bg-[#e60049] mt-1.5" />
        </div>
      </Link>

      {/* Nút Đọc thử nguyên bản: bo nhẹ rounded-sm, chỉ có chữ thuần túy, không icon */}
      <Link
        to={detailUrl}
        className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-[12px] py-1.5 rounded-sm text-center transition mb-2"
      >
        Đọc thử
      </Link>

      {/* Tên tài liệu căn giữa */}
      <h3 className="text-[12px] font-bold text-gray-900 text-center leading-snug px-1">
        <Link to={detailUrl} className="hover:text-[#e60049] transition">
          {product.title}
        </Link>
      </h3>
    </div>
  );
};
