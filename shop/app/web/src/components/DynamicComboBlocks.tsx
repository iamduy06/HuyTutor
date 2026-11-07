import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductImageFrame } from './ProductImageFrame';
import {
  ComboBannerBlockConfig,
  ComboBottomCtaBlockConfig,
  ComboHeroBlockConfig,
  ComboNoticeBlockConfig,
  ComboPackageItem,
  ComboPackagesBlockConfig,
  ComboPageBlockItem,
  ComboSectionGroupItem,
  ComboSectionsBlockConfig,
  Product,
  UiFormatCode,
  formatVnd,
} from '../types';
import { ensurePackageFormatPricings, getProductRetailPrice } from '../utils/comboPricingEngine';
import { SmartLink } from './SmartLink';
import { buildProductUrl } from '../utils/urlHelper';

/**
 * Khởi tạo danh sách các khối động cho Trang Combo THPT (100% Dynamic từ Admin CMS, không gán dữ liệu mẫu cứng)
 */
export function buildInitialComboBlocks(
  _products: Product[],
  existingBlocks?: ComboPageBlockItem[]
): ComboPageBlockItem[] {
  if (Array.isArray(existingBlocks) && existingBlocks.length > 0) {
    return [...existingBlocks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  return [
    {
      id: 'block_combo_hero',
      type: 'combo_hero',
      title_label: 'Khối 1: Hero Banner & Slogan đầu trang',
      is_active: true,
      sort_order: 1,
      config: {
        top_slogan: '',
        bottom_slogan: '',
        mode: 'image_banner',
        banner_image_url: '',
        headline: '',
        sub_headline: '',
        badge_text: '',
        gradient_theme: 'amber',
        book_cover_urls: [],
      } as ComboHeroBlockConfig,
    },
    {
      id: 'block_combo_packages',
      type: 'combo_packages',
      title_label: 'Khối 2: Lưới thẻ gói Combo ưu đãi',
      is_active: true,
      sort_order: 2,
      config: {
        section_title: '',
        sub_text: '',
        packages: [],
      } as ComboPackagesBlockConfig,
    },
    {
      id: 'block_combo_sections',
      type: 'combo_sections',
      title_label: 'Khối 3: Lưới nhóm tài liệu thành phần',
      is_active: true,
      sort_order: 3,
      config: {
        group_header: '',
        groups: [],
      } as ComboSectionsBlockConfig,
    },
    {
      id: 'block_combo_bottom_cta',
      type: 'combo_bottom_cta',
      title_label: 'Khối 4: Banner Mua ngay cuối trang',
      is_active: true,
      sort_order: 4,
      config: {
        btn_title: '',
        discount_text: '',
        note_text: '',
      } as ComboBottomCtaBlockConfig,
    },
  ];
}

/**
 * ============================================================================
 * KHỐI 1: HERO BANNER & SLOGAN ĐẦU TRANG (ComboHeroBlock)
 * ============================================================================
 */
export const ComboHeroBlock: React.FC<{
  config?: ComboHeroBlockConfig | null;
  onActionClick?: () => void;
}> = ({ config, onActionClick }) => {
  if (!config) return null;

  const hasBannerImage =
    config.mode === 'image_banner' && Boolean(config.banner_image_url?.trim());
  const validBookCovers = (config.book_cover_urls || []).filter((u) => u && u.trim().length > 0);
  const hasBuilderContent =
    config.mode !== 'image_banner' &&
    Boolean(
      config.headline?.trim() ||
        config.sub_headline?.trim() ||
        config.badge_text?.trim() ||
        validBookCovers.length > 0
    );

  if (
    !config.top_slogan?.trim() &&
    !config.bottom_slogan?.trim() &&
    !hasBannerImage &&
    !hasBuilderContent
  ) {
    return null;
  }

  return (
    <section className="max-w-[920px] mx-auto px-4 pt-8 pb-4 text-center">
      {config.top_slogan?.trim() && (
        <h1 className="text-lg sm:text-xl font-extrabold text-[#e60049] mb-4">
          {config.top_slogan}
        </h1>
      )}

      {hasBannerImage && (
        <div
          onClick={onActionClick}
          className="rounded-md overflow-hidden shadow-sm cursor-pointer hover:opacity-95 transition"
        >
          <img
            src={config.banner_image_url}
            alt={config.headline || config.top_slogan || ''}
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      {hasBuilderContent && (
        <div className="rounded-md overflow-hidden border border-amber-200 shadow-sm bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 p-6 sm:p-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {validBookCovers.length > 0 && (
              <div className="md:col-span-6 flex items-center justify-center gap-3">
                {validBookCovers.slice(0, 3).map((url, idx) => (
                  <div
                    key={idx}
                    className={`rounded-sm overflow-hidden shadow-md border border-white/60 transition ${
                      idx === 1 ? 'w-24 h-34 scale-105 z-10' : 'w-24 h-32 opacity-95'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-contain bg-white" />
                  </div>
                ))}
              </div>
            )}

            <div
              className={`${
                validBookCovers.length > 0 ? 'md:col-span-6 text-center md:text-left' : 'md:col-span-12 text-center'
              }`}
            >
              {config.headline?.trim() && (
                <div className="text-xl sm:text-2xl font-black text-[#e60049] leading-tight">
                  {config.headline}
                </div>
              )}
              {config.sub_headline?.trim() && (
                <div className="text-xs font-extrabold text-amber-900 uppercase mt-1">
                  {config.sub_headline}
                </div>
              )}
              {config.badge_text?.trim() && (
                <div className="inline-block mt-2 bg-sky-600 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-sm uppercase">
                  {config.badge_text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {config.bottom_slogan?.trim() && (
        <p className="text-sm font-extrabold text-[#e60049] mt-6">{config.bottom_slogan}</p>
      )}
    </section>
  );
};

/**
 * ============================================================================
 * KHỐI 2: LƯỚI THẺ GÓI COMBO ƯU ĐÃI (ComboPackagesBlock)
 * ============================================================================
 */
export const ComboPackagesBlock: React.FC<{
  config?: ComboPackagesBlockConfig | null;
  allProducts: Product[];
  onSelectPackage: (pkg: ComboPackageItem, selectedFormat: UiFormatCode) => void;
}> = ({ config, allProducts, onSelectPackage }) => {
  const [selectedFormatMap, setSelectedFormatMap] = useState<Record<string, UiFormatCode>>({});

  if (!config || !Array.isArray(config.packages) || config.packages.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        {config.section_title?.trim() && (
          <h2 className="text-[#e60049] font-bold text-sm mb-1">{config.section_title}</h2>
        )}
        {config.sub_text?.trim() && (
          <p className="text-[11px] text-gray-600 mb-4">{config.sub_text}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {config.packages.map((pkg) => {
          const pkgProducts = (pkg.product_ids || [])
            .map((id) => allProducts.find((p) => p.id === id || p.slug === id))
            .filter(Boolean) as Product[];

          const coverImages =
            pkg.custom_cover_urls && pkg.custom_cover_urls.length > 0
              ? pkg.custom_cover_urls.filter(Boolean)
              : pkgProducts.map((p) => p.thumbnail_url).filter(Boolean);

          const enabledFormats = ensurePackageFormatPricings(pkg).filter(
            (fp) => fp.is_enabled && typeof fp.combo_price === 'number' && fp.combo_price > 0
          );

          const currentFormat: UiFormatCode =
            selectedFormatMap[pkg.id] ||
            enabledFormats[0]?.format_code ||
            ((pkg.format_badge || '').toLowerCase().includes('pdf') ? 'PDF' : 'Word');

          const currentComboPrice =
            enabledFormats.find((fp) => fp.format_code === currentFormat)?.combo_price || 0;

          const totalOriginalPrice = pkgProducts.reduce(
            (sum, p) => sum + getProductRetailPrice(p, currentFormat),
            0
          );

          const discountPct =
            totalOriginalPrice > 0 && typeof currentComboPrice === 'number' && currentComboPrice > 0
              ? Math.round(((totalOriginalPrice - currentComboPrice) / totalOriginalPrice) * 100)
              : 0;

          const badgeText =
            pkg.discount_badge?.trim() ||
            (discountPct > 0 ? `GIẢM ${discountPct}%` : '');

          return (
            <div
              key={pkg.id}
              onClick={() => onSelectPackage(pkg, currentFormat)}
              className="bg-[#f8f9fa] border border-gray-200 rounded-md p-3.5 relative shadow-sm hover:border-[#e60049] transition cursor-pointer flex flex-col justify-between min-h-[190px]"
            >
              {/* Thanh trên cùng: Lựa chọn định dạng & Huy hiệu */}
              <div className="flex justify-between items-center gap-1.5 flex-wrap">
                {enabledFormats.length > 1 ? (
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {enabledFormats.map((fp) => (
                      <button
                        key={fp.format_code}
                        type="button"
                        onClick={() =>
                          setSelectedFormatMap((prev) => ({
                            ...prev,
                            [pkg.id]: fp.format_code,
                          }))
                        }
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-xs transition cursor-pointer ${
                          currentFormat === fp.format_code
                            ? 'bg-[#e60049] text-white shadow-xs'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {fp.format_code}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-600 font-bold bg-gray-100 px-1.5 py-0.5 rounded-xs">
                    {currentFormat}
                  </span>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  {pkg.tag_text?.trim() && (
                    <span className="bg-[#e60049] text-white text-[9px] font-bold px-2 py-0.5 rounded-xs">
                      {pkg.tag_text}
                    </span>
                  )}
                  {badgeText && (
                    <span className="bg-[#b30038] text-white text-[10px] font-black px-2 py-0.5 rounded-xs shrink-0">
                      {badgeText}
                    </span>
                  )}
                </div>
              </div>

              {/* Hàng ảnh sách mini trong gói */}
              {coverImages.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 my-2 overflow-hidden">
                  {coverImages.slice(0, 5).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-9 h-12 object-contain bg-white rounded-xs shadow-xs border border-white"
                    />
                  ))}
                </div>
              )}

              {/* Tên gói và Bảng giá niêm yết chuẩn mực (không hiển thị khấu trừ cá nhân hóa) */}
              <div className="space-y-1 pt-1.5 border-t border-gray-200">
                <div className="text-[11px] font-extrabold text-gray-900 leading-snug line-clamp-2">
                  {pkg.title}
                </div>
                <div className="flex items-baseline justify-between pt-0.5">
                  <div className="flex items-baseline gap-1.5">
                    {totalOriginalPrice > 0 && typeof currentComboPrice === 'number' && totalOriginalPrice > currentComboPrice && (
                      <span className="text-[10px] text-gray-400 line-through font-semibold">
                        {formatVnd(totalOriginalPrice)}
                      </span>
                    )}
                    <span className="text-xs font-black text-[#e60049]">
                      {typeof currentComboPrice === 'number' && currentComboPrice > 0
                        ? formatVnd(currentComboPrice)
                        : formatVnd(totalOriginalPrice)}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    ({pkgProducts.length} tài liệu)
                  </span>
                </div>
              </div>

              {/* Nút bấm hành động */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPackage(pkg, currentFormat);
                }}
                className="w-full mt-2.5 bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-[10px] py-1.5 rounded-xs transition cursor-pointer"
              >
                Thêm gói combo vào giỏ ({typeof currentComboPrice === 'number' && currentComboPrice > 0 ? formatVnd(currentComboPrice) : formatVnd(totalOriginalPrice)})
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

/**
 * ============================================================================
 * KHỐI 3: LƯỚI NHÓM TÀI LIỆU THÀNH PHẦN (ComboSectionsBlock)
 * ============================================================================
 */
export const ComboSectionsBlock: React.FC<{
  config?: ComboSectionsBlockConfig | null;
  allProducts: Product[];
}> = ({ config, allProducts }) => {
  if (!config || !Array.isArray(config.groups) || config.groups.length === 0) return null;

  const nonEmptyGroups = config.groups
    .map((group) => {
      const groupProducts = (group.product_ids || [])
        .map((id) => allProducts.find((p) => p.id === id || p.slug === id))
        .filter(Boolean) as Product[];
      return { group, groupProducts };
    })
    .filter((item) => item.groupProducts.length > 0);

  if (nonEmptyGroups.length === 0) return null;

  return (
    <div className="space-y-10">
      {config.group_header?.trim() && (
        <p className="text-[11px] text-gray-600 font-semibold -mb-6">{config.group_header}</p>
      )}

      {nonEmptyGroups.map(({ group, groupProducts }) => (
        <section key={group.id} className="space-y-4">
          {group.title?.trim() && (
            <h2 className="text-[#e60049] font-bold text-sm">{group.title}</h2>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {groupProducts.map((prod) => {
              const targetUrl = buildProductUrl(prod.category_slug, prod.slug);

              return (
                <div
                  key={prod.id}
                  className="flex flex-col items-center justify-between space-y-2.5"
                >
                  <SmartLink to={targetUrl} className="block w-full">
                    <ProductImageFrame
                      src={prod.thumbnail_url}
                      alt={prod.title}
                      ratioMode="preset"
                      presetRatio="3:4"
                      objectFit="contain"
                      rounded="2xl"
                      showBorder={true}
                      showShadow={true}
                      hoverEffect={true}
                      productId={prod.id}
                      customCampaignFrameUrl={prod.custom_campaign_frame_url}
                      disableCampaignFrame={prod.disable_campaign_frame}
                      fallbackText={prod.title}
                    />
                  </SmartLink>

                  <SmartLink
                    to={targetUrl}
                    className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2 rounded-sm text-center transition shadow-sm block"
                  >
                    Đọc thử
                  </SmartLink>

                  <SmartLink
                    to={targetUrl}
                    className="text-xs font-bold text-gray-900 text-center hover:text-[#e60049] transition leading-snug line-clamp-2"
                  >
                    {prod.title}
                  </SmartLink>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

/**
 * ============================================================================
 * KHỐI 4: BANNER MUA NGAY CUỐI TRANG (ComboBottomCtaBlock)
 * ============================================================================
 */
export const ComboBottomCtaBlock: React.FC<{
  config?: ComboBottomCtaBlockConfig | null;
  onActionClick: () => void;
}> = ({ config, onActionClick }) => {
  if (
    !config ||
    (!config.btn_title?.trim() && !config.discount_text?.trim() && !config.note_text?.trim())
  ) {
    return null;
  }

  return (
    <section className="bg-gradient-to-b from-[#fff5f7] to-white py-10 px-4 text-center border-t border-pink-100 mt-8">
      <div className="max-w-[520px] mx-auto">
        {(config.btn_title?.trim() || config.discount_text?.trim()) && (
          <button
            type="button"
            onClick={onActionClick}
            className="inline-flex items-center overflow-hidden rounded-md shadow-md border border-[#e60049] hover:opacity-95 transition"
          >
            {config.btn_title?.trim() && (
              <span className="bg-[#e60049] text-white font-extrabold text-base sm:text-lg px-7 py-3">
                {config.btn_title}
              </span>
            )}
            {config.discount_text?.trim() && (
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 text-[#e60049] font-black text-xs px-4 py-2 leading-tight">
                {config.discount_text}
              </span>
            )}
          </button>
        )}

        {config.note_text?.trim() && (
          <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">{config.note_text}</p>
        )}
      </div>
    </section>
  );
};

/**
 * ============================================================================
 * KHỐI PHỤ: BANNER NGANG ĐỘC LẬP (ComboBannerBlock)
 * ============================================================================
 */
export const ComboBannerBlock: React.FC<{
  config?: ComboBannerBlockConfig | null;
}> = ({ config }) => {
  if (!config || !config.banner_url) return null;

  const content = (
    <div className="w-full rounded-md overflow-hidden shadow-sm my-6">
      <img
        src={config.banner_url}
        alt={config.alt_text || 'Banner Combo'}
        className="w-full h-auto object-contain"
      />
    </div>
  );

  if (config.link_url) {
    return (
      <SmartLink to={config.link_url} className="block">
        {content}
      </SmartLink>
    );
  }

  return content;
};

/**
 * ============================================================================
 * KHỐI PHỤ: THÔNG BÁO / GHI CHÚ (ComboNoticeBlock)
 * ============================================================================
 */
export const ComboNoticeBlock: React.FC<{
  config?: ComboNoticeBlockConfig | null;
}> = ({ config }) => {
  if (!config || !config.content) return null;

  return (
    <div className="bg-[#fff5f7] border border-pink-200 rounded-md p-4 text-xs text-gray-700 leading-relaxed my-4 flex items-start gap-2.5">
      {config.badge_label && (
        <span className="bg-[#e60049] text-white font-bold text-[10px] px-2 py-0.5 rounded shrink-0">
          {config.badge_label}
        </span>
      )}
      <div className="flex-1 whitespace-pre-line">{config.content}</div>
    </div>
  );
};

