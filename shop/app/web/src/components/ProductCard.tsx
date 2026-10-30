import React from 'react';
import { Product } from '../types';
import { SmartLink } from './SmartLink';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const detailUrl = `/${product.category_slug || 'high-school'}/${product.slug}`;
  const coverLines = product.cover_tag
    ? product.cover_tag.split('\n').map((l) => l.trim()).filter(Boolean)
    : [];

  const hasTag = coverLines.length > 0 || Boolean(product.badge_text);

  return (
    <div className="product-card flex flex-col">
      {/* Khung phía trên: Ảnh bìa + Tag (nếu có) */}
      <SmartLink
        to={detailUrl}
        className="bg-white border border-gray-200 rounded-md p-4 mb-2 min-h-[160px] flex items-center justify-center gap-4 relative shadow-2xs hover:border-[#e60049]/50 transition overflow-hidden group"
      >
        {product.badge_text && (
          <span className="absolute top-2.5 right-2.5 bg-[#e60049] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-xs">
            {product.badge_text}
          </span>
        )}

        {/* Thumbnail từ Cloudflare R2 */}
        <div className={hasTag ? 'w-[45%] flex justify-center shrink-0' : 'w-full flex justify-center'}>
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className="max-h-[135px] w-auto max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200 block"
            />
          ) : (
            <div className="w-20 h-28 bg-gray-100 rounded border border-dashed flex items-center justify-center text-gray-400 font-bold text-[11px]">
              Tài liệu
            </div>
          )}
        </div>

        {/* Cover Tag bên phải kèm gạch chân đỏ (Chỉ hiện khi có tag thật, không fallback giả) */}
        {hasTag && coverLines.length > 0 && (
          <div className="w-[55%] pl-2 text-left">
            <p className="text-[11px] text-gray-600 leading-snug line-clamp-3">
              {coverLines.map((line, idx) => (
                <React.Fragment key={idx}>
                  {idx === coverLines.length - 1 ? (
                    <strong className="text-gray-900 font-bold">{line}</strong>
                  ) : (
                    line
                  )}
                  {idx < coverLines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
            <div className="h-[2px] w-14 bg-[#e60049] mt-1.5" />
          </div>
        )}
      </SmartLink>

      {/* Nút Đọc thử: bo nhẹ rounded-xs, màu đỏ thương hiệu */}
      <SmartLink
        to={detailUrl}
        className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-[12px] py-1.5 rounded-xs text-center transition mb-2 shadow-xs"
      >
        Đọc thử
      </SmartLink>

      {/* Tên tài liệu căn giữa */}
      <h3 className="text-[12px] font-bold text-gray-900 text-center leading-snug px-1 line-clamp-2">
        <SmartLink to={detailUrl} className="hover:text-[#e60049] transition">
          {product.title}
        </SmartLink>
      </h3>
    </div>
  );
};
