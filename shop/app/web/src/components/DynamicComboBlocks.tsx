import React from 'react';
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
} from '../types';
import { SmartLink } from './SmartLink';
import { buildProductUrl } from '../utils/urlHelper';

/**
 * Khởi tạo danh sách các khối động cho Trang Combo THPT (Zero-Breaking: tự động map dữ liệu hiện có)
 */
export function buildInitialComboBlocks(
  products: Product[],
  existingBlocks?: ComboPageBlockItem[]
): ComboPageBlockItem[] {
  if (Array.isArray(existingBlocks) && existingBlocks.length > 0) {
    return [...existingBlocks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  const threeLatestExams = products.filter(
    (p) =>
      p.slug.includes('dot-pha') ||
      p.slug.includes('chuan-cau-truc') ||
      p.slug.includes('thuc-chien')
  );

  const supportBooks = products.filter(
    (p) =>
      p.slug.includes('nen-tang') ||
      p.slug.includes('dien-tu') ||
      p.slug.includes('1400')
  );

  const globalSuccessBooks = products.filter(
    (p) =>
      p.sub_section?.toLowerCase().includes('global success') ||
      p.slug.includes('global-success') ||
      p.slug.includes('tu-vung-tieng-anh-1')
  );

  const dgnlBooks = products.filter((p) => p.slug.includes('dgnl'));

  const defaultPackages: ComboPackageItem[] = [
    {
      id: 'combo_pkg_1',
      title: 'Trọn bộ tài liệu THPT + ĐGNL\n(& từ vựng chi tiết 10-11-12)',
      discount_badge: 'GIẢM 25%',
      format_badge: 'File Word',
      tag_text: 'Combo',
      product_ids: products.slice(0, 6).map((p) => p.id),
      action_type: 'add_to_cart',
    },
    {
      id: 'combo_pkg_2',
      title: 'Trọn bộ tài liệu ôn thi THPT\n(& từ vựng chi tiết 10-11-12)',
      discount_badge: 'GIẢM 25%',
      format_badge: 'File Word',
      tag_text: 'Combo',
      product_ids: products.slice(0, 5).map((p) => p.id),
      action_type: 'add_to_cart',
    },
    {
      id: 'combo_pkg_3',
      title: 'Trọn bộ tài liệu ôn thi THPT\n(không gồm từ vựng 10-11-12)',
      discount_badge: 'GIẢM 24%',
      format_badge: 'File Word',
      tag_text: 'Combo',
      product_ids: products.slice(0, 4).map((p) => p.id),
      action_type: 'add_to_cart',
    },
    {
      id: 'combo_pkg_4',
      title: '5 TÀI LIỆU MỚI ÔN THI THPT',
      discount_badge: 'GIẢM 20%',
      format_badge: 'File Word',
      tag_text: 'Combo',
      product_ids: (threeLatestExams.length > 0 ? threeLatestExams : products.slice(0, 3)).map(
        (p) => p.id
      ),
      action_type: 'add_to_cart',
    },
    {
      id: 'combo_pkg_5',
      title: '3 BỘ ĐỀ MỚI ÔN THI THPT',
      discount_badge: 'GIẢM 15%',
      format_badge: 'File Word',
      tag_text: 'Combo',
      product_ids: (threeLatestExams.length > 0 ? threeLatestExams : products.slice(0, 3)).map(
        (p) => p.id
      ),
      action_type: 'add_to_cart',
    },
    {
      id: 'combo_pkg_6',
      title: 'TỪ VỰNG CHI TIẾT 10-11-12',
      discount_badge: 'GIẢM 24%',
      format_badge: 'File Word',
      tag_text: 'Combo',
      product_ids: (globalSuccessBooks.length > 0 ? globalSuccessBooks : products.slice(0, 3)).map(
        (p) => p.id
      ),
      action_type: 'add_to_cart',
    },
  ];

  const defaultGroups: ComboSectionGroupItem[] = [
    {
      id: 'sec_3_bo_de',
      title: '3 bộ đề mới nhất, bám sát form đề thi thật 2026',
      product_ids: (threeLatestExams.length > 0 ? threeLatestExams : products.slice(0, 3)).map(
        (p) => p.id
      ),
    },
  ];

  if (supportBooks.length > 0) {
    defaultGroups.push({
      id: 'sec_support',
      title: 'Tài liệu từ vựng - ngữ pháp, củng cố kiến thức phần điền từ vào đoạn văn',
      product_ids: supportBooks.slice(0, 3).map((p) => p.id),
    });
  }

  if (globalSuccessBooks.length > 0) {
    defaultGroups.push({
      id: 'sec_global',
      title: 'Từ vựng chi tiết 10-11-12 kèm bài tập bổ trợ',
      product_ids: globalSuccessBooks.slice(0, 3).map((p) => p.id),
    });
  }

  if (dgnlBooks.length > 0) {
    defaultGroups.push({
      id: 'sec_dgnl',
      title: 'Đề thi thử ĐGNL',
      product_ids: [dgnlBooks[0].id],
    });
  }

  return [
    {
      id: 'block_combo_hero',
      type: 'combo_hero',
      title_label: 'Khối 1: Hero Banner & Slogan đầu trang',
      is_active: true,
      sort_order: 1,
      config: {
        top_slogan: 'Mua nhiều. Giảm sâu. Tích điểm cao*.',
        bottom_slogan: 'Giảm giá lên đến 25%.',
        mode: 'custom_builder',
        headline: 'Combo 90 ĐỀ THI THỬ',
        sub_headline: 'THI THPT MÔN TIẾNG ANH',
        badge_text: 'CƠ BẢN + NÂNG CAO',
        gradient_theme: 'amber',
        book_cover_urls: threeLatestExams.map((p) => p.thumbnail_url).filter(Boolean),
      } as ComboHeroBlockConfig,
    },
    {
      id: 'block_combo_packages',
      type: 'combo_packages',
      title_label: 'Khối 2: Lưới 6 thẻ gói Combo ưu đãi',
      is_active: true,
      sort_order: 2,
      config: {
        section_title: 'Ưu đãi cao nhất',
        sub_text: 'Sử dụng ưu đãi thành viên để được giảm thêm trên đơn hàng.',
        packages: defaultPackages,
      } as ComboPackagesBlockConfig,
    },
    {
      id: 'block_combo_sections',
      type: 'combo_sections',
      title_label: 'Khối 3: Lưới nhóm tài liệu thành phần',
      is_active: true,
      sort_order: 3,
      config: {
        group_header: 'Xem chi tiết từng bộ tài liệu',
        groups: defaultGroups,
      } as ComboSectionsBlockConfig,
    },
    {
      id: 'block_combo_bottom_cta',
      type: 'combo_bottom_cta',
      title_label: 'Khối 4: Banner Mua ngay cuối trang',
      is_active: true,
      sort_order: 4,
      config: {
        btn_title: 'Mua ngay',
        discount_text: 'Giảm tới 25%',
        note_text: '* Điểm thành viên được tích lũy dựa trên số tiền thực tế thanh toán.',
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

  return (
    <section className="max-w-[920px] mx-auto px-4 pt-8 pb-4 text-center">
      {config.top_slogan && (
        <h1 className="text-lg sm:text-xl font-extrabold text-[#e60049] mb-4">
          {config.top_slogan}
        </h1>
      )}

      {config.mode === 'image_banner' && config.banner_image_url ? (
        <div
          onClick={onActionClick}
          className="rounded-md overflow-hidden shadow-sm cursor-pointer hover:opacity-95 transition"
        >
          <img
            src={config.banner_image_url}
            alt={config.headline || 'Combo THPT'}
            className="w-full h-auto object-contain"
          />
        </div>
      ) : (
        <div className="rounded-md overflow-hidden border border-amber-200 shadow-sm bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 p-6 sm:p-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* 3 cuốn sách minh họa */}
            <div className="md:col-span-6 flex items-center justify-center gap-3">
              {config.book_cover_urls && config.book_cover_urls.length > 0 ? (
                config.book_cover_urls.slice(0, 3).map((url, idx) => (
                  <div
                    key={idx}
                    className={`rounded-sm overflow-hidden shadow-md border border-white/60 transition ${
                      idx === 1 ? 'w-24 h-34 scale-105 z-10' : 'w-24 h-32 opacity-95'
                    }`}
                  >
                    <img src={url} alt="Bìa sách" className="w-full h-full object-contain bg-white" />
                  </div>
                ))
              ) : (
                <>
                  <div className="book-3d w-24 h-32 rounded-sm bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700 p-2 text-white flex flex-col justify-between shadow-md">
                    <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                    <div className="font-black text-[10px] leading-tight uppercase">
                      THỰC CHIẾN ĐỀ THI THPT
                    </div>
                    <span className="text-[7px] bg-white/20 px-1 py-0.5 rounded-sm w-fit">B1-B2</span>
                  </div>
                  <div className="book-3d w-24 h-34 rounded-sm bg-gradient-to-br from-amber-700 via-red-800 to-stone-900 p-2 text-white flex flex-col justify-between z-10 scale-105 shadow-lg">
                    <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                    <div className="font-black text-[10px] leading-tight uppercase">
                      ĐỘT PHÁ ĐỀ THI THPT
                    </div>
                    <span className="text-[7px] bg-amber-400 text-black font-bold px-1 py-0.5 rounded-sm w-fit">
                      B2-C2
                    </span>
                  </div>
                  <div className="book-3d w-24 h-32 rounded-sm bg-gradient-to-br from-indigo-900 via-blue-800 to-emerald-600 p-2 text-white flex flex-col justify-between shadow-md">
                    <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                    <div className="font-black text-[10px] leading-tight uppercase">
                      BỘ ĐỀ CHUẨN CẤU TRÚC
                    </div>
                    <span className="text-[7px] bg-white/20 px-1 py-0.5 rounded-sm w-fit">B1-C1</span>
                  </div>
                </>
              )}
            </div>

            <div className="md:col-span-6 text-center md:text-left">
              <div className="inline-block text-[10px] font-bold text-[#e60049] uppercase tracking-wider mb-1">
                HUY TUTOR
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#e60049] leading-tight">
                {config.headline || 'Combo 90 ĐỀ THI THỬ'}
              </div>
              <div className="text-xs font-extrabold text-amber-900 uppercase mt-1">
                {config.sub_headline || 'THI THPT MÔN TIẾNG ANH'}
              </div>
              {config.badge_text && (
                <div className="inline-block mt-2 bg-sky-600 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-sm uppercase">
                  {config.badge_text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {config.bottom_slogan && (
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
  onSelectPackage: (pkg: ComboPackageItem) => void;
}> = ({ config, allProducts, onSelectPackage }) => {
  if (!config || !Array.isArray(config.packages) || config.packages.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        {config.section_title && (
          <h2 className="text-[#e60049] font-bold text-sm mb-1">{config.section_title}</h2>
        )}
        {config.sub_text && (
          <p className="text-[11px] text-gray-600 mb-4">
            {config.sub_text}{' '}
            <button
              type="button"
              onClick={() => onSelectPackage(config.packages[0])}
              className="text-[#e60049] underline font-bold"
            >
              Mua ngay
            </button>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {config.packages.map((pkg) => {
          // Lấy ảnh bìa sản phẩm trong gói
          const pkgProducts = (pkg.product_ids || [])
            .map((id) => allProducts.find((p) => p.id === id || p.slug === id))
            .filter(Boolean) as Product[];

          const coverImages =
            pkg.custom_cover_urls && pkg.custom_cover_urls.length > 0
              ? pkg.custom_cover_urls
              : pkgProducts.map((p) => p.thumbnail_url).filter(Boolean);

          return (
            <div
              key={pkg.id}
              onClick={() => onSelectPackage(pkg)}
              className="bg-[#f8f9fa] border border-gray-200 rounded-md p-3.5 relative shadow-sm hover:border-[#e60049] transition cursor-pointer flex flex-col justify-between h-[165px]"
            >
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500 font-semibold">
                  {pkg.format_badge || 'File Word'}
                </span>
                <span className="bg-[#e60049] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm">
                  {pkg.tag_text || 'Combo'}
                </span>
              </div>

              {/* Hàng ảnh sách mini trong gói */}
              <div className="flex items-center justify-center gap-1.5 my-2 overflow-hidden">
                {coverImages.length > 0 ? (
                  coverImages.slice(0, 5).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Bìa"
                      className="w-8 h-11 object-contain bg-white rounded-sm shadow border border-white"
                    />
                  ))
                ) : (
                  <>
                    <div className="w-8 h-11 bg-gradient-to-br from-orange-500 to-pink-600 rounded-sm shadow" />
                    <div className="w-8 h-11 bg-gradient-to-br from-amber-700 to-red-900 rounded-sm shadow" />
                    <div className="w-8 h-11 bg-gradient-to-br from-indigo-800 to-teal-600 rounded-sm shadow" />
                    <div className="w-8 h-11 bg-gradient-to-br from-emerald-700 to-teal-900 rounded-sm shadow" />
                  </>
                )}
              </div>

              <div className="flex items-end justify-between gap-1 pt-1 border-t border-gray-200">
                <div className="text-[9px] font-extrabold text-[#e60049] leading-tight whitespace-pre-line">
                  {pkg.title}
                </div>
                <span className="bg-[#b30038] text-white text-[10px] font-black px-2 py-1 rounded-sm shrink-0">
                  {pkg.discount_badge || 'GIẢM 25%'}
                </span>
              </div>
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

  return (
    <div className="space-y-10">
      {config.group_header && (
        <p className="text-[11px] text-gray-600 font-semibold -mb-6">{config.group_header}</p>
      )}

      {config.groups.map((group) => {
        const groupProducts = (group.product_ids || [])
          .map((id) => allProducts.find((p) => p.id === id || p.slug === id))
          .filter(Boolean) as Product[];

        if (groupProducts.length === 0) return null;

        return (
          <section key={group.id} className="space-y-4">
            <h2 className="text-[#e60049] font-bold text-sm">{group.title}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {groupProducts.map((prod) => {
                const targetUrl = buildProductUrl(prod.category_slug, prod.slug);

                return (
                  <div
                    key={prod.id}
                    className="flex flex-col items-center justify-between space-y-2.5"
                  >
                    {/* Ảnh bìa đứng độc lập với khung hình chuẩn bo tròn 16px, viền xám, đổ bóng & Khung đè */}
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

                    {/* Nút Đọc thử màu đỏ full-width */}
                    <SmartLink
                      to={targetUrl}
                      className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2 rounded-sm text-center transition shadow-sm block"
                    >
                      Đọc thử
                    </SmartLink>

                    {/* Tên tài liệu căn giữa */}
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
        );
      })}
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
  if (!config) return null;

  return (
    <section className="bg-gradient-to-b from-[#fff5f7] to-white py-10 px-4 text-center border-t border-pink-100 mt-8">
      <div className="max-w-[520px] mx-auto">
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex items-center overflow-hidden rounded-md shadow-md border border-[#e60049] hover:opacity-95 transition"
        >
          <span className="bg-[#e60049] text-white font-extrabold text-base sm:text-lg px-7 py-3">
            {config.btn_title || 'Mua ngay'}
          </span>
          <span className="bg-gradient-to-r from-amber-300 to-yellow-400 text-[#e60049] font-black text-xs px-4 py-2 leading-tight">
            {config.discount_text ? (
              <>
                Giảm tới
                <br />
                <span className="text-lg">{config.discount_text.replace(/[^0-9%]/g, '')}</span>
              </>
            ) : (
              'Giảm tới 25%'
            )}
          </span>
        </button>

        {config.note_text && (
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

