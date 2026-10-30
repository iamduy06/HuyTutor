import React from 'react';
import {
  CategoryBannerBlockConfig,
  CategoryBlockItem,
  CategoryHeroBlockConfig,
  CategoryItem,
  CategoryNoticeBlockConfig,
  CategorySectionBlockConfig,
  CategorySectionCardItem,
  Product,
} from '../types';
import { SmartLink } from './SmartLink';

/**
 * Khởi tạo danh sách các khối động (category_blocks) từ dữ liệu thực tế của danh mục
 * và các sản phẩm thuộc danh mục (Tuyệt đối Zero-Fallback: không bịa dữ liệu mẫu)
 */
export function buildInitialCategoryBlocks(
  category: CategoryItem,
  categoryProducts: Product[]
): CategoryBlockItem[] {
  if (Array.isArray(category.blocks) && category.blocks.length > 0) {
    return [...category.blocks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  // Tự động gom nhóm các sản phẩm theo sub_section
  const sectionMap = new Map<string, Product[]>();
  for (const prod of categoryProducts) {
    const sec = prod.sub_section?.trim() || 'Tài liệu trọng tâm';
    const arr = sectionMap.get(sec) || [];
    arr.push(prod);
    sectionMap.set(sec, arr);
  }

  const generatedSections: CategoryBlockItem[] = [];
  let sortOrder = 2;

  for (const [sectionTitle, items] of sectionMap.entries()) {
    const cleanAnchorId = `sec-${sectionTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`;

    const cardItems: CategorySectionCardItem[] = items.map((p) => ({
      id: p.id,
      display_title: p.title,
      image_url: p.thumbnail_url || '',
      image_mode: 'card_box',
      badge_text: p.badge_text || '',
      tag_text: p.cover_tag || '',
      button_text: 'Đọc thử',
      target_url: `/${p.category_slug || category.slug}/${p.slug}`,
      is_active: p.is_active !== false,
    }));

    generatedSections.push({
      id: `block_sec_${sortOrder}`,
      type: 'category_section',
      title_label: `Nhóm: ${sectionTitle}`,
      is_active: true,
      sort_order: sortOrder++,
      config: {
        title: sectionTitle,
        anchor_id: cleanAnchorId,
        mode: 'manual',
        items: cardItems,
        is_active: true,
      } as CategorySectionBlockConfig,
    });
  }

  return [
    {
      id: 'block_cat_hero',
      type: 'category_hero',
      title_label: 'Phần 1: Đầu trang Danh mục & Mục lục',
      is_active: true,
      sort_order: 1,
      config: {
        title: category.name || 'Danh mục tài liệu',
        subtitle: category.description || '',
        show_pink_glow: true,
        anchor_mode: 'auto_from_sections',
        custom_anchors: [],
        is_active: true,
      } as CategoryHeroBlockConfig,
    },
    ...generatedSections,
  ];
}

/**
 * ============================================================================
 * PHẦN 1: KHỐI ĐẦU TRANG & MỤC LỤC NHẢY NHANH (CategoryHeroBlock)
 * ============================================================================
 */
export const CategoryHeroBlock: React.FC<{
  config?: CategoryHeroBlockConfig | null;
  sections?: CategorySectionBlockConfig[];
}> = ({ config, sections = [] }) => {
  if (!config || config.is_active === false) return null;

  const displayTitle = config.title?.trim();
  const displaySubtitle = config.subtitle?.trim();

  // Xác định danh sách các liên kết mục lục nhảy nhanh
  let anchorLinks: { label: string; anchor_id: string; target_url?: string }[] = [];

  if (config.anchor_mode === 'manual' && Array.isArray(config.custom_anchors)) {
    anchorLinks = config.custom_anchors
      .filter((a) => a.label?.trim())
      .map((a) => ({
        label: a.label.trim(),
        anchor_id: a.target_url?.startsWith('#') ? a.target_url.slice(1) : '',
        target_url: a.target_url,
      }));
  } else if (config.anchor_mode !== 'none') {
    // Tự động lấy từ các khối category_section bên dưới
    anchorLinks = sections
      .filter((s) => s.is_active !== false && s.title?.trim())
      .map((s) => ({
        label: s.title.trim(),
        anchor_id:
          s.anchor_id?.trim() ||
          `sec-${s.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')}`,
      }));
  }

  const handleScrollToAnchor = (e: React.MouseEvent, anchorId: string) => {
    if (!anchorId) return;
    const el = document.getElementById(anchorId);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-2 pb-6">
      {/* Hiệu ứng ánh hồng phấn mờ ảo ở góc phải đầu trang chuẩn huytutor.io.vn */}
      {config.show_pink_glow !== false && (
        <div
          className="pointer-events-none absolute -top-12 -right-16 w-80 h-80 rounded-full bg-pink-100/60 blur-3xl -z-10"
          aria-hidden="true"
        />
      )}

      <div className="space-y-3">
        {displayTitle && (
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#e60049] leading-snug tracking-tight whitespace-pre-line">
            {displayTitle}
          </h1>
        )}

        {displaySubtitle && (
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl whitespace-pre-line">
            {displaySubtitle}
          </p>
        )}

        {/* Danh sách Mục lục nhảy nhanh có gạch chân */}
        {anchorLinks.length > 0 && (
          <div className="space-y-1 pt-1 text-xs font-medium text-gray-700">
            {anchorLinks.map((link, idx) => (
              <div key={idx}>
                {link.anchor_id ? (
                  <a
                    href={`#${link.anchor_id}`}
                    onClick={(e) => handleScrollToAnchor(e, link.anchor_id)}
                    className="underline hover:text-[#e60049] transition inline-block cursor-pointer"
                  >
                    {link.label}
                  </a>
                ) : link.target_url ? (
                  <SmartLink
                    to={link.target_url}
                    className="underline hover:text-[#e60049] transition inline-block"
                  >
                    {link.label}
                  </SmartLink>
                ) : (
                  <span className="underline">{link.label}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/**
 * ============================================================================
 * PHẦN 2, 3, 4: KHỐI NHÓM TÀI LIỆU LƯỚI 3 CỘT (CategorySectionBlock)
 * Hỗ trợ hiển thị ảnh độc lập nguyên bản (không bó vào khung giả hay chữ mẫu)
 * ============================================================================
 */
export const CategorySectionBlock: React.FC<{
  config?: CategorySectionBlockConfig | null;
  allCategoryProducts?: Product[];
}> = ({ config, allCategoryProducts = [] }) => {
  if (!config || config.is_active === false) return null;

  let cards: CategorySectionCardItem[] = [];

  if (config.mode === 'auto_sub_section' && config.sub_section_filter) {
    const filter = config.sub_section_filter.trim().toLowerCase();
    cards = allCategoryProducts
      .filter((p) => (p.sub_section || '').trim().toLowerCase() === filter)
      .map((p) => ({
        id: p.id,
        display_title: p.title,
        image_url: p.thumbnail_url || '',
        image_mode: 'card_box',
        badge_text: p.badge_text || '',
        tag_text: p.cover_tag || '',
        button_text: 'Đọc thử',
        target_url: `/${p.category_slug || 'high-school'}/${p.slug}`,
        is_active: p.is_active !== false,
      }));
  } else {
    cards = (config.items || []).filter((it) => it.is_active !== false);
  }

  if (cards.length === 0) return null;

  const anchorId =
    config.anchor_id?.trim() ||
    `sec-${config.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`;

  return (
    <section id={anchorId} className="space-y-4 scroll-mt-20">
      {config.title?.trim() && (
        <h2 className="text-[#e60049] font-bold text-sm sm:text-base leading-snug">
          {config.title}
        </h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {cards.map((item) => {
          const isCardBox = item.image_mode === 'card_box';
          const coverLines = (item.tag_text || '')
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

          return (
            <div key={item.id} className="flex flex-col">
              {/* Hộp trên cùng: Ảnh bìa sách (Độc lập hoặc Card box có tag) */}
              {isCardBox ? (
                <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[160px] flex items-center justify-center gap-4 shadow-2xs hover:border-gray-300 transition relative">
                  <SmartLink
                    to={item.target_url}
                    className="h-full flex items-center justify-center shrink-0"
                  >
                    {item.image_url && item.image_url.trim() ? (
                      <img
                        src={item.image_url}
                        alt={item.display_title || ''}
                        className="max-h-[135px] w-auto max-w-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-200 block"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gray-100 rounded border border-dashed flex items-center justify-center text-gray-400 font-bold text-[11px]">
                        Tài liệu
                      </div>
                    )}
                  </SmartLink>

                  {(item.badge_text || coverLines.length > 0) && (
                    <div className="flex flex-col justify-start items-start space-y-1.5 flex-1 min-w-0">
                      {item.badge_text && (
                        <span className="bg-[#e60049] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wide">
                          {item.badge_text}
                        </span>
                      )}
                      {coverLines.length > 0 && (
                        <p className="text-[12px] font-medium text-gray-800 leading-snug line-clamp-3">
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
                      )}
                      <div className="h-[2px] w-14 bg-[#e60049] mt-1" />
                    </div>
                  )}
                </div>
              ) : (
                /* Chế độ Mặc định: Ảnh đứng độc lập nguyên bản (không bị bó khung nhỏ hay chữ mẫu) */
                <SmartLink
                  to={item.target_url}
                  className="bg-white rounded-lg border border-gray-200 p-3 min-h-[160px] flex items-center justify-center shadow-2xs hover:border-gray-300 transition overflow-hidden group"
                >
                  {item.image_url && item.image_url.trim() ? (
                    <img
                      src={item.image_url}
                      alt={item.display_title || ''}
                      className="max-h-[145px] w-auto max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200 block mx-auto"
                    />
                  ) : (
                    <div className="w-full h-28 bg-gray-100 rounded border border-dashed flex items-center justify-center text-gray-400 font-bold text-[11px]">
                      Tài liệu
                    </div>
                  )}
                </SmartLink>
              )}

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
          );
        })}
      </div>
    </section>
  );
};

/**
 * ============================================================================
 * PHẦN MỞ RỘNG: BANNER ĐỘC LẬP TRANG CẤP 1 (CategoryBannerBlock)
 * ============================================================================
 */
export const CategoryBannerBlock: React.FC<{
  config?: CategoryBannerBlockConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false || !config.image_url?.trim()) return null;

  return (
    <section className="space-y-3">
      {config.header_label?.trim() && (
        <h2 className="text-[#e60049] font-bold text-sm sm:text-base leading-snug">
          {config.header_label}
        </h2>
      )}
      <SmartLink
        to={config.link_url}
        className="block w-full overflow-hidden rounded-2xl shadow-sm hover:opacity-95 transition"
      >
        <img
          src={config.image_url}
          alt={config.header_label || 'Banner'}
          className="w-full h-auto object-cover rounded-2xl block"
        />
      </SmartLink>
    </section>
  );
};

/**
 * ============================================================================
 * PHẦN MỞ RỘNG: HỘP GHI CHÚ / THÔNG BÁO (CategoryNoticeBlock)
 * ============================================================================
 */
export const CategoryNoticeBlock: React.FC<{
  config?: CategoryNoticeBlockConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false || !config.content?.trim()) return null;

  const bgClasses =
    config.bg_style === 'pink'
      ? 'bg-[#fff5f7] border-pink-200 text-[#e60049]'
      : config.bg_style === 'gray'
        ? 'bg-gray-100 border-gray-200 text-gray-800'
        : 'bg-white border-gray-200 text-gray-800';

  return (
    <section className={`border rounded-lg p-4 sm:p-5 shadow-2xs space-y-2 ${bgClasses}`}>
      {config.title?.trim() && (
        <h3 className="font-extrabold text-xs sm:text-sm">{config.title}</h3>
      )}
      <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line">{config.content}</p>
    </section>
  );
};
