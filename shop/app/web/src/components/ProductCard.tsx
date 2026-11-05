import React from 'react';
import { Product } from '../types';
import { SmartLink } from './SmartLink';
import { buildProductUrl } from '../utils/urlHelper';
import { ProductImageFrame } from './ProductImageFrame';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const detailUrl = buildProductUrl(product.category_slug, product.slug);
  const coverLines = product.cover_tag
    ? product.cover_tag.split('\n').map((l) => l.trim()).filter(Boolean)
    : [];

  const hasTag = coverLines.length > 0;
  const cfg = product.image_frame_config;

  return (
    <div className="product-card flex flex-col group">
      {/* Khung phía trên: Khung hình sản phẩm chuẩn bo tròn 16px, viền xám, đổ bóng & Khung đè Campaign */}
      <SmartLink to={detailUrl} className="block mb-2 relative">
        {!hasTag ? (
          // Chế độ Full Cover Card (Huy thiết kế full tấm tải lên, chuẩn tỉ lệ 3:4 hoặc custom)
          <ProductImageFrame
            src={product.thumbnail_url}
            alt={product.title}
            ratioMode={cfg?.ratio_mode || 'preset'}
            presetRatio={cfg?.preset_ratio || '3:4'}
            customRatioW={cfg?.custom_ratio_w}
            customRatioH={cfg?.custom_ratio_h}
            maxWidthPx={cfg?.max_width_px}
            objectFit={cfg?.object_fit || 'contain'}
            rounded={cfg?.border_rounded || '2xl'}
            showBorder={cfg?.show_border !== false}
            showShadow={cfg?.show_shadow !== false}
            hoverEffect={true}
            productId={product.id}
            customCampaignFrameUrl={product.custom_campaign_frame_url}
            disableCampaignFrame={product.disable_campaign_frame}
            badgeText={product.badge_text}
            fallbackText="Tài liệu"
          />
        ) : (
          // Chế độ Split View (Thumbnail bên trái + Text Cover Tag bên phải)
          <div className="bg-white border border-gray-200 rounded-2xl p-3 min-h-[160px] flex items-center justify-between gap-3 shadow-md hover:shadow-lg transition overflow-hidden">
            {product.badge_text && (
              <span className="absolute top-2.5 right-2.5 z-20 bg-[#e60049] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-xs shadow-xs">
                {product.badge_text}
              </span>
            )}

            {/* Thumbnail với ProductImageFrame thu nhỏ có bo góc và khung đè */}
            <div className="w-[45%] shrink-0">
              <ProductImageFrame
                src={product.thumbnail_url}
                alt={product.title}
                ratioMode="preset"
                presetRatio="3:4"
                objectFit="contain"
                rounded="xl"
                showBorder={true}
                showShadow={false}
                hoverEffect={false}
                productId={product.id}
                customCampaignFrameUrl={product.custom_campaign_frame_url}
                disableCampaignFrame={product.disable_campaign_frame}
                fallbackText="Tài liệu"
              />
            </div>

            {/* Cover Tag bên phải kèm gạch chân đỏ */}
            <div className="w-[55%] pl-1 text-left">
              <p className="text-[11px] text-gray-600 leading-snug line-clamp-4">
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
              <div className="h-[2px] w-12 bg-[#e60049] mt-2" />
            </div>
          </div>
        )}
      </SmartLink>

      {/* Nút Đọc thử: bo nhẹ rounded-xs, màu đỏ thương hiệu */}
      <SmartLink
        to={detailUrl}
        className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-[12px] py-1.5 rounded-xs text-center transition mb-2 shadow-xs group-hover:bg-[#cc0041]"
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
