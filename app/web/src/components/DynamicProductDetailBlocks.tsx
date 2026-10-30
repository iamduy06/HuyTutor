import React, { useState } from 'react';
import {
  BottomCtaBlockConfig,
  formatVnd,
  Product,
  ProductDetailBlockItem,
  ProductHeroBlockConfig,
  ProductIntroBlockConfig,
  RelatedProductCustomCard,
  RelatedProductsBlockConfig,
  SampleGroupsBlockConfig,
  SamplePreviewGroup,
  TopicAccordionBlockConfig,
  UiFormatCode,
} from '../types';
import { SmartLink } from './SmartLink';

/**
 * Khởi tạo danh sách các khối (detail_blocks) từ dữ liệu thực tế của sản phẩm
 * nếu sản phẩm chưa từng lưu detail_blocks riêng (Tuyệt đối Zero-Fallback: không bịa dữ liệu mẫu)
 */
export function buildInitialDetailBlocksFromProduct(product: Product): ProductDetailBlockItem[] {
  if (Array.isArray(product.detail_blocks) && product.detail_blocks.length > 0) {
    return [...product.detail_blocks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  const sampleGroups: SamplePreviewGroup[] = [];
  if (product.preview_type === 'pdf' && product.sample_pdf_url?.trim()) {
    sampleGroups.push({
      id: 'grp_pdf_1',
      title: 'Bản đọc thử PDF',
      description: '',
      media_type: 'pdf',
      images: [],
      pdf_url: product.sample_pdf_url,
      watermark_enabled: product.watermark_enabled ?? false,
      watermark_text: product.watermark_text || '',
      is_active: true,
      sort_order: 1,
    });
  } else if (
    product.preview_type !== 'none' &&
    Array.isArray(product.preview_images) &&
    product.preview_images.length > 0
  ) {
    sampleGroups.push({
      id: 'grp_img_1',
      title: 'Demo đề thi',
      description: '',
      media_type: 'images',
      images: [...product.preview_images],
      pdf_url: '',
      watermark_enabled: product.watermark_enabled ?? false,
      watermark_text: product.watermark_text || '',
      is_active: true,
      sort_order: 1,
    });
  }

  const hasTopics = Array.isArray(product.topics) && product.topics.some((t) => t?.trim());
  const hasIntro =
    Boolean(product.short_desc?.trim()) ||
    (Array.isArray(product.features) && product.features.some((f) => f?.trim()));

  return [
    {
      id: 'block_product_hero',
      type: 'product_hero',
      title_label: 'Phần 1: Đầu trang & Mua hàng',
      is_active: true,
      sort_order: 1,
      config: {
        image_mode: 'standalone',
        image_url: product.thumbnail_url || '',
        badge_text: product.badge_text || '',
        cover_tag: product.cover_tag || '',
        title: product.title || '',
        price_override_text: '',
        show_format_selector: true,
        specs: Array.isArray(product.specs) ? [...product.specs] : [],
        primary_cta_text: 'Đặt hàng',
        primary_cta_action: 'buy_now',
        primary_cta_link: '',
        show_add_to_cart_button: true,
        secondary_cta_text: product.is_combo_eligible ? 'Mua combo ưu đãi' : '',
        secondary_cta_link: product.is_combo_eligible ? '/combo-thpt' : '',
        is_active: true,
      } as ProductHeroBlockConfig,
    },
    {
      id: 'block_product_intro',
      type: 'product_intro',
      title_label: 'Phần 2: Giới thiệu & Điểm nổi bật',
      is_active: hasIntro,
      sort_order: 2,
      config: {
        bg_style: 'gray',
        paragraphs: product.short_desc?.trim() ? [product.short_desc.trim()] : [],
        bullets_title: '',
        bullets: Array.isArray(product.features)
          ? product.features
              .filter((f) => f && f.trim())
              .map((f, idx) => ({
                id: `feat_${idx + 1}`,
                text: f,
                is_highlight: idx === 0,
              }))
          : [],
        is_active: true,
      } as ProductIntroBlockConfig,
    },
    {
      id: 'block_topic_accordion',
      type: 'topic_accordion',
      title_label: 'Phần 3: Tiêu đề Xem thử & Danh sách chủ đề',
      is_active: hasTopics || sampleGroups.length > 0,
      sort_order: 3,
      config: {
        section_heading: 'Bản xem thử',
        show_quick_anchor_nav: true,
        accordions: hasTopics
          ? [
              {
                id: 'acc_topics_1',
                title: 'Danh sách chủ đề',
                default_open: true,
                items: product.topics.filter((t) => t && t.trim()),
              },
            ]
          : [],
        is_active: true,
      } as TopicAccordionBlockConfig,
    },
    {
      id: 'block_sample_groups',
      type: 'sample_groups',
      title_label: 'Phần 4: Các nhóm ảnh/PDF Đọc thử',
      is_active: sampleGroups.length > 0,
      sort_order: 4,
      config: {
        groups: sampleGroups,
        is_active: true,
      } as SampleGroupsBlockConfig,
    },
    {
      id: 'block_bottom_cta',
      type: 'bottom_cta',
      title_label: 'Phần 5: Lời cảm ơn & Đặt hàng cuối trang',
      is_active: true,
      sort_order: 5,
      config: {
        thank_you_text: 'Cảm ơn Quý Thầy/Cô và các bạn đã tham khảo tài liệu này!',
        sub_text: '',
        primary_button_text: 'Đặt hàng',
        primary_button_action: 'buy_now',
        primary_button_link: '',
        secondary_link_text: product.is_combo_eligible ? 'Mua combo ưu đãi' : '',
        secondary_link_url: product.is_combo_eligible ? '/combo-thpt' : '',
        is_active: true,
      } as BottomCtaBlockConfig,
    },
    {
      id: 'block_related_products',
      type: 'related_products',
      title_label: 'Phần 6: Sản phẩm gợi ý (Nhiều Thầy/Cô cũng chọn)',
      is_active: true,
      sort_order: 6,
      config: {
        title: 'Nhiều Thầy/Cô cũng chọn',
        mode: 'auto',
        max_items: 3,
        items: [],
        is_active: true,
      } as RelatedProductsBlockConfig,
    },
  ];
}

/**
 * ============================================================================
 * PHẦN 1: KHỐI ĐẦU TRANG & MUA HÀNG (ProductHeroBlock)
 * ============================================================================
 */
export const ProductHeroBlock: React.FC<{
  config?: ProductHeroBlockConfig | null;
  product: Product;
  selectedFormat: UiFormatCode;
  onSelectFormat: (fmt: UiFormatCode) => void;
  onBuyNow: (fmt: UiFormatCode) => void;
  onAddToCart: (fmt: UiFormatCode) => void;
}> = ({ config, product, selectedFormat, onSelectFormat, onBuyNow, onAddToCart }) => {
  if (!config || config.is_active === false) return null;

  const activeFormats =
    Array.isArray(product.formats) && product.formats.filter((f) => f.is_active).length > 0
      ? product.formats.filter((f) => f.is_active)
      : product.formats || [];

  const currentFormatObj =
    activeFormats.find((f) => f.format_code === selectedFormat) || activeFormats[0];
  const currentPrice = currentFormatObj ? currentFormatObj.price : 0;
  const isFreeGift = currentPrice === 0 || product.category_slug === 'gifts';

  const displayTitle = config.title?.trim() || product.title;
  const displayImage = config.image_url?.trim() || product.thumbnail_url;
  const displayBadge = config.badge_text !== undefined ? config.badge_text : product.badge_text;
  const displayCoverTag = config.cover_tag !== undefined ? config.cover_tag : product.cover_tag;
  const coverLines = (displayCoverTag || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const specs = Array.isArray(config.specs)
    ? config.specs.filter((sp) => (sp.label && sp.label.trim()) || (sp.val && sp.val.trim()))
    : [];

  const primaryCtaText =
    config.primary_cta_text?.trim() || (isFreeGift ? 'Tải về miễn phí' : 'Đặt hàng');
  const primaryAction = config.primary_cta_action || 'buy_now';

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Cột Trái: Hình ảnh tài liệu (Đứng độc lập hoặc Card Box bìa sách 3D) */}
        <div className="md:col-span-5 flex justify-center items-center">
          {config.image_mode === 'card_box' ? (
            <div className="w-full bg-white border border-gray-200 rounded-xl p-5 min-h-[190px] flex items-center justify-center gap-4 shadow-2xs relative">
              {displayBadge && (
                <span className="absolute top-3 right-3 bg-[#e60049] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-xs">
                  {displayBadge}
                </span>
              )}
              <div className="shrink-0 flex justify-center">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={displayTitle}
                    className="max-h-[155px] w-auto max-w-full object-contain drop-shadow-md block"
                  />
                ) : null}
              </div>
              {coverLines.length > 0 && (
                <div className="flex-1 min-w-0 pl-1">
                  <p className="text-xs sm:text-[13px] text-gray-700 leading-snug">
                    {coverLines.map((line, i) => (
                      <React.Fragment key={i}>
                        {i === coverLines.length - 1 ? (
                          <strong className="text-gray-900 font-bold">{line}</strong>
                        ) : (
                          line
                        )}
                        {i < coverLines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                  <div className="h-[2px] w-16 bg-[#e60049] mt-2" />
                </div>
              )}
            </div>
          ) : (
            /* Chế độ mặc định (standalone): Ảnh tải lên đứng độc lập một mình, không nhốt trong khung */
            displayImage && (
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-full h-auto max-h-[320px] object-contain rounded-xl block mx-auto"
              />
            )
          )}
        </div>

        {/* Cột Phải: Tiêu đề, Giá bán, Thông số gạch đầu dòng */}
        <div className="md:col-span-7 space-y-3">
          {displayTitle && (
            <h1 className="text-lg sm:text-2xl font-extrabold text-[#e60049] leading-snug">
              {displayTitle}
            </h1>
          )}

          {/* Huy hiệu giá bán */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-block bg-[#e60049] text-white text-xs sm:text-sm font-extrabold px-3 py-1 rounded-xs shadow-2xs">
              {config.price_override_text?.trim()
                ? config.price_override_text.trim()
                : isFreeGift
                  ? 'Miễn phí 100%'
                  : formatVnd(currentPrice)}
            </span>

            {/* Bộ chọn định dạng (nếu có nhiều hơn 1 định dạng đang bật) */}
            {config.show_format_selector !== false && !isFreeGift && activeFormats.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {activeFormats.map((fmt) => {
                  const isSelected = fmt.format_code === selectedFormat;
                  return (
                    <button
                      key={fmt.format_code}
                      type="button"
                      onClick={() => onSelectFormat(fmt.format_code)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-xs border transition ${
                        isSelected
                          ? 'bg-pink-50 text-[#e60049] border-[#e60049]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#e60049]'
                      }`}
                    >
                      {fmt.format_code} ({formatVnd(fmt.price)})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Danh sách thông số gạch đầu dòng */}
          {specs.length > 0 && (
            <ul className="text-xs sm:text-[13px] text-gray-800 space-y-1.5 pt-1 leading-relaxed">
              {specs.map((sp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-900 rounded-2xs mt-1.5 shrink-0 inline-block" />
                  <span>
                    {sp.label && sp.val ? (
                      <>
                        <strong className="font-bold text-gray-900">{sp.label}:</strong> {sp.val}
                      </>
                    ) : (
                      <span className="font-medium">{sp.val || sp.label}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Cụm Nút Đặt Hàng / Mua Ngay & Link Phụ (Trải rộng chuẩn mẫu huytutor.io.vn) */}
      <div className="space-y-2.5 pt-1">
        {primaryAction === 'custom_link' && config.primary_cta_link?.trim() ? (
          <SmartLink
            to={config.primary_cta_link}
            className="block w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs sm:text-sm py-2.5 rounded-xs text-center transition shadow-xs"
          >
            {primaryCtaText}
          </SmartLink>
        ) : config.show_add_to_cart_button && !isFreeGift ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <button
              type="button"
              onClick={() =>
                primaryAction === 'add_to_cart'
                  ? onAddToCart(selectedFormat)
                  : onBuyNow(selectedFormat)
              }
              className="sm:col-span-8 w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs sm:text-sm py-2.5 rounded-xs transition shadow-xs"
            >
              {primaryCtaText}
            </button>
            <button
              type="button"
              onClick={() => onAddToCart(selectedFormat)}
              className="sm:col-span-4 w-full bg-[#fff0f3] hover:bg-pink-100 text-[#e60049] border border-[#e60049] font-bold text-xs sm:text-sm py-2.5 rounded-xs transition"
            >
              Thêm vào giỏ hàng
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              primaryAction === 'add_to_cart'
                ? onAddToCart(selectedFormat)
                : onBuyNow(selectedFormat)
            }
            className="block w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs sm:text-sm py-2.5 rounded-xs text-center transition shadow-xs"
          >
            {primaryCtaText}
          </button>
        )}

        {config.secondary_cta_text?.trim() && (
          <div className="text-center">
            <SmartLink
              to={config.secondary_cta_link || '/combo-thpt'}
              className="inline-block text-xs sm:text-[13px] font-medium text-gray-700 underline hover:text-[#e60049] transition"
            >
              {config.secondary_cta_text}
            </SmartLink>
          </div>
        )}
      </div>
    </section>
  );
};

/**
 * ============================================================================
 * PHẦN 2: KHỐI GIỚI THIỆU & ĐIỂM NỔI BẬT (ProductIntroBlock)
 * ============================================================================
 */
export const ProductIntroBlock: React.FC<{
  config?: ProductIntroBlockConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false) return null;

  const paragraphs = (config.paragraphs || []).filter((p) => p && p.trim());
  const bullets = (config.bullets || []).filter((b) => b && b.text && b.text.trim());

  if (paragraphs.length === 0 && bullets.length === 0) return null;

  const isGray = config.bg_style !== 'white';

  return (
    <section
      className={
        isGray
          ? 'bg-[#f3f4f6] rounded-xl p-5 sm:p-7 space-y-3.5 text-xs sm:text-[13px] text-gray-800 leading-relaxed'
          : 'py-2 space-y-3.5 text-xs sm:text-[13px] text-gray-800 leading-relaxed border-t border-gray-100 pt-5'
      }
    >
      {paragraphs.map((para, idx) => (
        <p key={idx} className="whitespace-pre-line leading-relaxed">
          {para}
        </p>
      ))}

      {config.bullets_title?.trim() && (
        <p className="font-bold text-gray-900 pt-1">{config.bullets_title}</p>
      )}

      {bullets.length > 0 && (
        <ul className="space-y-2 pl-1">
          {bullets.map((b) => (
            <li key={b.id} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-gray-900 rounded-2xs mt-1.5 shrink-0 inline-block" />
              <span
                className={
                  b.is_highlight ? 'font-bold text-[#e60049]' : 'font-medium text-gray-800'
                }
              >
                {b.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

/**
 * ============================================================================
 * PHẦN 3: KHỐI MỤC LỤC XEM THỬ & DANH SÁCH CHỦ ĐỀ THU GỌN (TopicAccordionBlock)
 * ============================================================================
 */
export const TopicAccordionBlock: React.FC<{
  config?: TopicAccordionBlockConfig | null;
  sampleGroups?: SamplePreviewGroup[];
}> = ({ config, sampleGroups = [] }) => {
  if (!config || config.is_active === false) return null;

  const accordions = (config.accordions || []).filter(
    (acc) => acc.title?.trim() || (acc.items && acc.items.some((it) => it?.trim()))
  );
  const activeSampleGroups = sampleGroups.filter(
    (g) => g.is_active !== false && g.title?.trim()
  );

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    accordions.forEach((acc) => {
      init[acc.id] = acc.default_open ?? false;
    });
    return init;
  });

  if (
    !config.section_heading?.trim() &&
    accordions.length === 0 &&
    (!config.show_quick_anchor_nav || activeSampleGroups.length <= 1)
  ) {
    return null;
  }

  return (
    <section className="space-y-4">
      {config.section_heading?.trim() && (
        <div className="border-b-2 border-gray-500 pb-2">
          <h2 className="text-sm sm:text-base font-extrabold text-[#e60049]">
            {config.section_heading}
          </h2>
        </div>
      )}

      {/* Thanh nút nhảy nhanh tới từng nhóm đọc thử (nếu có từ 2 nhóm trở lên) */}
      {config.show_quick_anchor_nav && activeSampleGroups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {activeSampleGroups.map((grp) => (
            <a
              key={grp.id}
              href={`#sample-group-${grp.id}`}
              className="px-3 py-1.5 text-xs font-bold text-[#e60049] bg-[#fff0f3] hover:bg-[#e60049] hover:text-white border border-pink-200 rounded-xs transition"
            >
              {grp.title}
            </a>
          ))}
        </div>
      )}

      {/* Các hộp thu gọn / mở rộng (VD: Danh sách chủ đề Đề 1 -> Đề 30) */}
      {accordions.map((acc) => {
        const isOpen = openMap[acc.id] ?? acc.default_open ?? false;
        const cleanItems = (acc.items || []).filter((it) => it && it.trim());

        return (
          <div key={acc.id} className="border-b border-gray-200 pb-3">
            <button
              type="button"
              onClick={() => setOpenMap((prev) => ({ ...prev, [acc.id]: !isOpen }))}
              className="w-full flex items-center justify-between py-2 text-left group"
            >
              <span className="text-xs sm:text-sm font-extrabold text-[#e60049] group-hover:opacity-80 transition">
                {acc.title}
              </span>
              <span className="text-[#e60049] font-bold text-xs px-2">
                {isOpen ? '▴' : '▾'}
              </span>
            </button>

            {isOpen && cleanItems.length > 0 && (
              <ul className="mt-2 space-y-1.5 pl-4 text-xs sm:text-[13px] text-gray-800 leading-relaxed">
                {cleanItems.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-800 rounded-2xs mt-1.5 shrink-0 inline-block" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
};

/**
 * ============================================================================
 * PHẦN 4: KHỐI CÁC NHÓM ĐỌC THỬ ĐA PHÂN MỤC (SampleGroupsBlock)
 * Hiển thị từng nhóm (Demo đề thi, Demo đáp án, Demo bảng từ vựng, Ma trận...)
 * Các trang ảnh A4 đứng độc lập một mình, tuyệt đối không bọc khung giả lập!
 * ============================================================================
 */
export const SampleGroupsBlock: React.FC<{
  config?: SampleGroupsBlockConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false) return null;

  const activeGroups = (config.groups || []).filter((g) => g.is_active !== false);
  if (activeGroups.length === 0) return null;

  return (
    <div id="khu-vuc-doc-thu" className="space-y-10 select-none">
      {activeGroups.map((group) => {
        const cleanImages = (group.images || []).filter((u) => u && u.trim());
        const hasPdf = group.media_type === 'pdf' && Boolean(group.pdf_url?.trim());
        const hasImages = group.media_type === 'images' && cleanImages.length > 0;

        if (!hasPdf && !hasImages) return null;

        return (
          <section
            key={group.id}
            id={`sample-group-${group.id}`}
            onContextMenu={(e) => e.preventDefault()}
            className="space-y-4 scroll-mt-20"
          >
            {group.title?.trim() && (
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-extrabold text-[#e60049]">
                  {group.title}
                </h3>
                {group.description?.trim() && (
                  <p className="text-xs text-gray-600">{group.description}</p>
                )}
              </div>
            )}

            {hasPdf ? (
              <div className="relative bg-white border border-gray-200 rounded-md overflow-hidden shadow-xs">
                {group.watermark_enabled && (
                  <div className="watermark-pattern pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                    {group.watermark_text && (
                      <span className="text-[#e60049]/15 font-extrabold text-lg uppercase -rotate-12 tracking-widest text-center px-4">
                        {group.watermark_text}
                      </span>
                    )}
                  </div>
                )}
                <iframe
                  src={group.pdf_url}
                  title={group.title || 'Bản đọc thử PDF'}
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
                    {group.watermark_enabled && (
                      <div className="watermark-pattern pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                        {group.watermark_text && (
                          <span className="text-[#e60049]/10 font-extrabold text-base sm:text-xl uppercase -rotate-12 tracking-widest text-center px-4">
                            {group.watermark_text}
                          </span>
                        )}
                      </div>
                    )}
                    <img
                      src={imgUrl}
                      alt={`${group.title || 'Trang đọc thử'} - Trang ${idx + 1}`}
                      className="w-full h-auto block pointer-events-none select-none"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

/**
 * ============================================================================
 * PHẦN 5: KHỐI LỜI CẢM ƠN & KÊU GỌI ĐẶT HÀNG CUỐI TRANG (BottomCtaBlock)
 * ============================================================================
 */
export const BottomCtaBlock: React.FC<{
  config?: BottomCtaBlockConfig | null;
  selectedFormat: UiFormatCode;
  onBuyNow: (fmt: UiFormatCode) => void;
  onAddToCart: (fmt: UiFormatCode) => void;
}> = ({ config, selectedFormat, onBuyNow, onAddToCart }) => {
  if (!config || config.is_active === false) return null;

  if (
    !config.thank_you_text?.trim() &&
    !config.primary_button_text?.trim() &&
    !config.secondary_link_text?.trim()
  ) {
    return null;
  }

  const action = config.primary_button_action || 'buy_now';

  return (
    <section className="space-y-3 pt-4 border-t border-gray-200">
      {config.thank_you_text?.trim() && (
        <p className="text-xs sm:text-sm font-extrabold text-[#e60049]">
          {config.thank_you_text}
        </p>
      )}
      {config.sub_text?.trim() && (
        <p className="text-xs text-gray-700 leading-relaxed">{config.sub_text}</p>
      )}

      {config.primary_button_text?.trim() && (
        <div>
          {action === 'custom_link' && config.primary_button_link?.trim() ? (
            <SmartLink
              to={config.primary_button_link}
              className="block w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs sm:text-sm py-2.5 rounded-xs text-center transition shadow-xs"
            >
              {config.primary_button_text}
            </SmartLink>
          ) : (
            <button
              type="button"
              onClick={() =>
                action === 'add_to_cart'
                  ? onAddToCart(selectedFormat)
                  : onBuyNow(selectedFormat)
              }
              className="block w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs sm:text-sm py-2.5 rounded-xs text-center transition shadow-xs"
            >
              {config.primary_button_text}
            </button>
          )}
        </div>
      )}

      {config.secondary_link_text?.trim() && (
        <div className="text-center pt-0.5">
          <SmartLink
            to={config.secondary_link_url || '/combo-thpt'}
            className="inline-block text-xs sm:text-[13px] font-medium text-gray-700 underline hover:text-[#e60049] transition"
          >
            {config.secondary_link_text}
          </SmartLink>
        </div>
      )}
    </section>
  );
};

/**
 * ============================================================================
 * PHẦN 6: KHỐI TÀI LIỆU GỢI Ý ("Nhiều Thầy/Cô cũng chọn") (RelatedProductsBlock)
 * Giao diện Card đồng bộ 100% với Trang chủ:
 * Hộp trắng chứa ảnh bìa sách + Badge & Tag -> Nút đỏ "Đọc thử" -> Tên sách căn giữa
 * ============================================================================
 */
export const RelatedProductsBlock: React.FC<{
  config?: RelatedProductsBlockConfig | null;
  autoRelatedProducts?: Product[];
}> = ({ config, autoRelatedProducts = [] }) => {
  if (!config || config.is_active === false) return null;

  let cards: RelatedProductCustomCard[] = [];

  if (config.mode === 'manual') {
    cards = (config.items || []).filter((it) => it.is_active !== false && it.display_title?.trim());
  } else {
    const limit = config.max_items || 3;
    cards = autoRelatedProducts.slice(0, limit).map((rel) => ({
      id: rel.id,
      display_title: rel.title,
      image_url: rel.thumbnail_url || '',
      badge_text: rel.badge_text || '',
      tag_text: rel.cover_tag || '',
      button_text: 'Đọc thử',
      target_url: `/${rel.category_slug || 'high-school'}/${rel.slug}`,
      is_active: true,
    }));
  }

  if (cards.length === 0) return null;

  return (
    <section className="space-y-4 pt-2">
      {config.title?.trim() && (
        <h2 className="text-[#e60049] font-extrabold text-sm sm:text-base">{config.title}</h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {cards.map((item) => (
          <div key={item.id} className="flex flex-col">
            {/* Hộp trên: Ảnh bìa sách bên trái + Badge & Mô tả bên phải */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[155px] flex items-center justify-center gap-4 shadow-2xs hover:border-gray-300 transition">
              <SmartLink
                to={item.target_url}
                className="h-full flex items-center justify-center shrink-0"
              >
                {item.image_url && item.image_url.trim() ? (
                  <img
                    src={item.image_url}
                    alt={item.display_title}
                    className="max-h-[130px] w-auto max-w-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-200 block"
                  />
                ) : (
                  <div className="w-20 h-28 bg-gray-100 rounded border border-dashed flex items-center justify-center text-gray-400 font-bold text-[11px]">
                    Tài liệu
                  </div>
                )}
              </SmartLink>

              {(item.badge_text || item.tag_text) && (
                <div className="flex flex-col justify-start items-start space-y-1.5 flex-1 min-w-0">
                  {item.badge_text && (
                    <span className="bg-[#e60049] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wide">
                      {item.badge_text}
                    </span>
                  )}
                  {item.tag_text && (
                    <span className="text-[12px] font-medium text-gray-800 leading-snug line-clamp-3 whitespace-pre-line">
                      {item.tag_text}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Nút Đọc thử màu đỏ ngay dưới hộp */}
            <SmartLink
              to={item.target_url}
              className="block w-full text-center py-2 text-xs font-bold text-white bg-[#e60049] hover:bg-[#cc0041] rounded-xs transition shadow-xs mt-2.5"
            >
              {item.button_text?.trim() || 'Đọc thử'}
            </SmartLink>

            {/* Tên tài liệu in đậm căn giữa bên dưới nút Đọc thử */}
            {item.display_title && (
              <SmartLink
                to={item.target_url}
                className="block text-center font-bold text-xs sm:text-[13px] text-gray-900 leading-snug hover:text-[#e60049] transition mt-2 px-1 line-clamp-2"
              >
                {item.display_title}
              </SmartLink>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
