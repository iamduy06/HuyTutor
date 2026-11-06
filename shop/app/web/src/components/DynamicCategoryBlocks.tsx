import React, { useState } from 'react';
import { ProductImageFrame } from './ProductImageFrame';
import {
  CategoryBannerBlockConfig,
  CategoryBlockItem,
  CategoryHeroBlockConfig,
  CategoryItem,
  CategoryNoticeBlockConfig,
  CategorySectionBlockConfig,
  CategorySectionCardItem,
  GiftAnchorItem,
  GiftDonateCtaConfig,
  GiftFormEmbedConfig,
  GiftHeroAnchorsConfig,
  Product,
} from '../types';
import { Link } from 'react-router-dom';
import { SmartLink } from './SmartLink';
import { buildProductUrl, fixMalformedSlugUrl } from '../utils/urlHelper';

/**
 * Khởi tạo danh sách các khối động (category_blocks) từ dữ liệu thực tế của danh mục
 * và các sản phẩm thuộc danh mục (Tuyệt đối Zero-Fallback: không bịa dữ liệu mẫu)
 */
export function buildInitialCategoryBlocks(
  category: CategoryItem,
  categoryProducts: Product[]
): CategoryBlockItem[] {
  if (!category) return [];

  if (Array.isArray(category.blocks) && category.blocks.length > 0) {
    return [...category.blocks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  if (!category.name?.trim() && categoryProducts.length === 0) {
    return [];
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
      target_url: buildProductUrl(p.category_slug || category.slug, p.slug),
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
        title: category.name || '',
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

  if (!displayTitle && !displaySubtitle && anchorLinks.length === 0) {
    return null;
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
        target_url: buildProductUrl(p.category_slug, p.slug),
        is_active: p.is_active !== false,
      }));
  } else {
    cards = (config.items || []).filter((it) => it.is_active !== false);
  }

  // Tự động chuẩn hóa và giải quyết target_url cho tất cả các thẻ sách trong section
  cards = cards.map((it) => {
    let target = it.target_url;
    if (!target) {
      const matchedProd = allCategoryProducts.find(
        (p) => p.id === (it as any).product_id || p.id === it.id || p.slug === it.id
      );
      if (matchedProd) {
        target = buildProductUrl(matchedProd.category_slug, matchedProd.slug);
      }
    }
    return {
      ...it,
      target_url: target ? fixMalformedSlugUrl(target) : target,
    };
  });

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
                /* Chế độ Mặc định: Khung hình chuẩn bo tròn 16px, viền xám, đổ bóng & Khung đè Campaign */
                <SmartLink to={item.target_url} className="block w-full">
                  <ProductImageFrame
                    src={item.image_url}
                    alt={item.display_title || ''}
                    ratioMode="preset"
                    presetRatio="3:4"
                    objectFit="contain"
                    rounded="2xl"
                    showBorder={true}
                    showShadow={true}
                    hoverEffect={true}
                    badgeText={item.badge_text}
                    fallbackText="Tài liệu"
                  />
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
          className="w-full h-auto object-contain rounded-2xl block"
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


/**
 * ============================================================================
 * CÁC COMPONENT DÒNG TRANG TẶNG QUÀ CẤP 1 (GIFTS BLOCKS)
 * ============================================================================
 */

export const GiftHeroAnchorsBlock: React.FC<{
  config?: GiftHeroAnchorsConfig | null;
}> = ({ config }) => {
  if (!config) return null;
  const anchors = (config.anchors || []).filter((a) => a && a.label?.trim());
  if (!config.title?.trim() && !config.subtitle?.trim() && anchors.length === 0) {
    return null;
  }

  return (
    <section className="text-center pt-6 pb-2 space-y-6">
      {config.title?.trim() && (
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] tracking-tight">
          {config.title}
        </h1>
      )}
      {config.subtitle?.trim() && (
        <p className="text-xs text-gray-600 max-w-lg mx-auto">{config.subtitle}</p>
      )}

      {anchors.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto">
          {anchors.map((anc) => (
            <Link
              key={anc.id}
              to={anc.target_url || '#'}
              className="bg-[#e60049] hover:bg-[#cc0041] text-white text-[11px] sm:text-xs font-bold px-4 py-2 rounded-sm shadow-sm transition transform hover:-translate-y-0.5"
            >
              {anc.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export const GiftFormEmbedBlock: React.FC<{
  config?: GiftFormEmbedConfig | null;
}> = ({ config }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Giáo viên THPT');
  const [submitted, setSubmitted] = useState(false);

  if (!config || (!config.form_url?.trim() && !config.form_title?.trim())) return null;

  // Nếu có form_url (Google Form nhúng): render Iframe
  if (config.form_url?.trim()) {
    return (
      <section className="max-w-2xl mx-auto bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
        <iframe
          src={config.form_url}
          title={config.form_title || ''}
          width="100%"
          height={config.iframe_height || 750}
          className="w-full border-0"
        >
          Đang tải form...
        </iframe>
      </section>
    );
  }

  return (
    <section className="max-w-xl mx-auto bg-white border border-gray-200 rounded-md p-6 shadow-sm space-y-4">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-sm sm:text-base font-extrabold text-gray-900 text-center">
          {config.form_title}
        </h2>
      </div>

      {submitted ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs text-center space-y-1">
          <div className="font-bold">✔ Đã tiếp nhận đăng ký nhận tài liệu!</div>
          <div>Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam) sau ít phút.</div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Địa chỉ Email của bạn *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:border-[#e60049] outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-2">
              Quý thầy/cô/bạn đang là? *
            </label>
            <div className="space-y-2 pl-1">
              {[
                'Giáo viên Tiểu học',
                'Giáo viên Trung học cơ sở',
                'Giáo viên Trung học phổ thông',
                'Chuyên viên',
                'Học sinh',
                'Sinh viên',
                'Gia sư',
                'Phụ huynh học sinh',
              ].map((item) => (
                <label key={item} className="flex items-center gap-2 cursor-pointer text-gray-700">
                  <input
                    type="radio"
                    name="role"
                    value={item}
                    checked={role === item}
                    onChange={(e) => setRole(e.target.value)}
                    className="accent-[#e60049]"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold py-2.5 rounded-sm transition shadow-sm text-xs"
          >
            Gửi yêu cầu nhận tài liệu
          </button>
        </form>
      )}
    </section>
  );
};

export const GiftDonateCtaBlock: React.FC<{
  config?: GiftDonateCtaConfig | null;
}> = ({ config }) => {
  if (
    !config ||
    config.is_active === false ||
    (!config.prompt_text?.trim() && !config.button_text?.trim())
  ) {
    return null;
  }

  return (
    <section className="text-center py-6 border-t border-gray-100 space-y-3">
      {config.prompt_text?.trim() && (
        <p className="text-xs font-bold text-gray-800">{config.prompt_text}</p>
      )}
      {config.button_text?.trim() && (
        <div>
          <Link
            to={config.target_url || '/donate'}
            className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white text-xs font-bold px-6 py-2 rounded-sm transition shadow-sm"
          >
            {config.button_text}
          </Link>
        </div>
      )}
    </section>
  );
};
