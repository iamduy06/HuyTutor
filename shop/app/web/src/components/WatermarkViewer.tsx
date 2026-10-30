import React from 'react';
import { Product } from '../types';

export const WatermarkViewer: React.FC<{ product: Product }> = ({ product }) => {
  if (product.preview_type === 'none') {
    return null;
  }

  const hasPdf = product.preview_type === 'pdf' && Boolean(product.sample_pdf_url?.trim());
  const cleanImages = Array.isArray(product.preview_images)
    ? product.preview_images.filter((u) => u && u.trim())
    : [];
  const hasImages = product.preview_type === 'images' && cleanImages.length > 0;

  if (!hasPdf && !hasImages) {
    return null;
  }

  const watermarkLabel = product.watermark_text || '';

  return (
    <section
      id="khu-vuc-doc-thu"
      onContextMenu={(e) => e.preventDefault()}
      className="select-none mb-10 space-y-4"
    >
      <div className="border-b-2 border-gray-500 pb-2">
        <span className="text-sm sm:text-base font-extrabold text-[#e60049]">
          Bản xem thử
        </span>
      </div>

      {hasPdf ? (
        <div className="relative bg-white border border-gray-200 rounded-md overflow-hidden shadow-xs">
          {product.watermark_enabled && watermarkLabel && (
            <div className="watermark-pattern pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
              <span className="text-[#e60049]/15 font-extrabold text-lg uppercase -rotate-12 tracking-widest text-center px-4">
                {watermarkLabel}
              </span>
            </div>
          )}
          <iframe
            src={product.sample_pdf_url}
            title={`Đọc thử PDF - ${product.title}`}
            className="w-full h-[680px] border-0"
          />
        </div>
      ) : (
        <div className="space-y-5">
          {cleanImages.map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-sm shadow-xs border border-gray-200/70 bg-white"
            >
              {product.watermark_enabled && watermarkLabel && (
                <div className="watermark-pattern pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                  <span className="text-[#e60049]/10 font-extrabold text-base sm:text-xl uppercase -rotate-12 tracking-widest text-center px-4">
                    {watermarkLabel}
                  </span>
                </div>
              )}
              <img
                src={imgUrl}
                alt={`${product.title} - Trang đọc thử ${idx + 1}`}
                className="w-full h-auto block pointer-events-none select-none"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
