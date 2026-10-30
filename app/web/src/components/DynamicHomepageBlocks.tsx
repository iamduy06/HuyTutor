import React from 'react';
import { Link } from 'react-router-dom';
import {
  HomepageBottomBannerConfig,
  HomepageCategoriesGridConfig,
  HomepageHeroConfig,
  HomepageNoticeTextConfig,
  HomepageSectionGroupsConfig,
  HomepageTopBannerConfig,
} from '../types';

/**
 * 1. Khung Đen: Hero Top Header (Phía trên cùng là hình ảnh, không phải khung chữ)
 */
export const HeroBlock: React.FC<{ config?: HomepageHeroConfig | null }> = ({ config }) => {
  if (!config || config.is_active === false) return null;

  if (config.mode === 'custom_html') {
    if (!config.custom_html?.trim()) return null;
    return (
      <section
        className="w-full overflow-hidden"
        dangerouslySetInnerHTML={{ __html: config.custom_html }}
      />
    );
  }

  if (config.mode === 'custom_image') {
    if (!config.custom_image_url?.trim()) return null;
    return (
      <section className="w-full overflow-hidden">
        <img
          src={config.custom_image_url}
          alt={config.title || ''}
          className="w-full h-auto object-cover"
        />
      </section>
    );
  }

  const bullets = (config.bullets || []).filter((b) => b && b.trim().length > 0);

  // Nếu không có nội dung gì thì không render
  if (!config.title && !config.subtitle && bullets.length === 0 && !config.image_url) {
    return null;
  }

  return (
    <section className="hero-soft-bg pt-10 pb-8 border-b border-pink-50">
      <div className="max-w-[920px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Cột Trái: Chữ (Tiêu đề, phụ đề, gạch đầu dòng) */}
          <div className={config.image_url ? 'md:col-span-7' : 'col-span-12'}>
            {config.subtitle && (
              <p className="text-[#e60049] font-bold text-sm mb-1">{config.subtitle}</p>
            )}
            {config.title && (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#e60049] tracking-tight mb-4">
                {config.title}
              </h1>
            )}
            {bullets.length > 0 && (
              <ul className="space-y-1.5 text-xs sm:text-[13px] text-gray-700 font-medium">
                {bullets.map((b, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-800 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cột Phải: Hình ảnh trực tiếp (Không dùng khung chữ/vòm CSS) */}
          {config.image_url && (
            <div className="md:col-span-5 flex justify-center items-center">
              <img
                src={config.image_url}
                alt={config.title || 'Huy Tutor'}
                className="max-h-[260px] sm:max-h-[300px] w-auto max-w-full object-contain drop-shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/**
 * 2. Khung Xanh Dương: Banner Top (Hỗ trợ Chữ + Up hình ảnh / Sách 3D / HTML / Custom Image)
 */
export const TopBannerBlock: React.FC<{ config?: HomepageTopBannerConfig | null }> = ({
  config,
}) => {
  if (!config || config.is_active === false) return null;

  if (config.mode === 'custom_html') {
    if (!config.custom_html?.trim()) return null;
    return (
      <section
        className="w-full overflow-hidden"
        dangerouslySetInnerHTML={{ __html: config.custom_html }}
      />
    );
  }

  if (config.mode === 'custom_image') {
    if (!config.custom_image_url?.trim()) return null;
    return (
      <section>
        <Link to={config.link_url || '#'}>
          <img
            src={config.custom_image_url}
            alt={config.title || ''}
            className="w-full h-auto object-cover rounded-md shadow-sm"
          />
        </Link>
      </section>
    );
  }

  const isImageText = config.mode === 'image_text' || (!!config.image_url && (!config.books || config.books.length === 0));
  const books = config.books || [];

  if (!config.title && !config.header_label && books.length === 0 && !config.image_url) {
    return null;
  }

  return (
    <section>
      {config.header_label && (
        <h2 className="text-[#e60049] font-bold text-sm mb-3">{config.header_label}</h2>
      )}
      <Link
        to={config.link_url || '#'}
        className="block rounded-md overflow-hidden border border-amber-200 shadow-sm bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 p-6 sm:p-8 relative hover:opacity-95 transition"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Cột Trái: Hình ảnh up lên HOẶC Bộ sách 3D */}
          {isImageText && config.image_url ? (
            <div className="md:col-span-5 flex items-center justify-center p-2">
              <img
                src={config.image_url}
                alt={config.title || 'Banner'}
                className="max-h-[180px] sm:max-h-[220px] w-auto max-w-full object-contain rounded drop-shadow-sm"
              />
            </div>
          ) : books.length > 0 ? (
            <div className="md:col-span-6 flex items-center justify-center gap-3">
              {books.map((b, idx) => (
                <div
                  key={idx}
                  className={`book-3d w-24 rounded-sm bg-gradient-to-br ${b.gradient || ''} p-2 text-white flex flex-col justify-between ${
                    idx === 1 ? 'h-34 z-10 scale-105' : 'h-32'
                  }`}
                >
                  <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                  <div className="font-black text-[10px] leading-tight uppercase">{b.title}</div>
                  {b.badge && (
                    <span
                      className={`text-[7px] px-1 py-0.5 rounded-sm w-fit font-bold ${
                        idx === 1 ? 'bg-amber-400 text-black' : 'bg-white/20 text-white'
                      }`}
                    >
                      {b.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          {/* Cột Phải: Nội dung Chữ */}
          <div className={
            (isImageText && config.image_url)
              ? 'md:col-span-7 text-center md:text-left'
              : books.length > 0
              ? 'md:col-span-6 text-center md:text-left'
              : 'col-span-12 text-center'
          }>
            {config.tag && (
              <div className="inline-block text-[10px] font-bold text-[#e60049] uppercase tracking-wider mb-1">
                {config.tag}
              </div>
            )}
            {config.title && (
              <div className="text-xl sm:text-2xl font-black text-[#e60049] leading-tight">
                {config.title}
              </div>
            )}
            {config.subtitle && (
              <div className="text-xs font-extrabold text-amber-900 uppercase mt-1">
                {config.subtitle}
              </div>
            )}
            {config.cta_badge && (
              <div className="inline-block mt-2 bg-sky-600 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-sm uppercase">
                {config.cta_badge}
              </div>
            )}
          </div>
        </div>
      </Link>
    </section>
  );
};

/**
 * 3. Khung Vàng: Danh mục sản phẩm cấp 1 (Ô vuông động số lượng - Dynamic counts, không cố định 6 khung)
 */
export const CategoriesGridBlock: React.FC<{
  config?: HomepageCategoriesGridConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false) return null;
  const activeItems = (config.items || []).filter((it) => it.is_active !== false);
  if (activeItems.length === 0) return null;

  return (
    <section>
      {config.title && (
        <h2 className="text-[#e60049] font-bold text-sm mb-3">{config.title}</h2>
      )}
      {/* Grid động tự động dàn trải dựa trên số lượng items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {activeItems.map((cat) => (
          <Link
            key={cat.id}
            to={cat.to || (cat.category_slug ? `/${cat.category_slug}` : '#')}
            className="group text-center flex flex-col items-center"
          >
            <div className="w-full aspect-square rounded-md bg-gradient-to-br from-[#e60049] to-[#b30038] p-3 flex items-center justify-center shadow-sm group-hover:opacity-90 transition overflow-hidden">
              {cat.image_url && cat.image_url.trim() ? (
                <img
                  src={cat.image_url}
                  alt={cat.label || ''}
                  className="w-full h-full object-contain filter brightness-0 invert"
                />
              ) : cat.icon_code ? (
                <div className="w-12 h-14 border-2 border-white/80 rounded-sm bg-white/15 flex items-center justify-center text-white font-black text-xs">
                  {cat.icon_code}
                </div>
              ) : null}
            </div>
            {cat.label && (
              <span className="block text-[11px] font-bold text-gray-800 mt-1.5 group-hover:text-[#e60049] truncate max-w-full">
                {cat.label}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};

/**
 * 4. Khung Tím: Nhóm tài liệu cấp 1 & Các sản phẩm cấp 2 tự cấu hình tên/ảnh (Không fallback)
 */
export const SectionGroupsBlock: React.FC<{
  config?: HomepageSectionGroupsConfig | null;
}> = ({ config }) => {
  if (!config || !Array.isArray(config.sections)) return null;

  const activeSections = config.sections.filter((sec) => sec.is_active !== false);
  if (activeSections.length === 0) return null;

  return (
    <div className="space-y-10">
      {activeSections.map((sec) => {
        const activeItems = (sec.items || []).filter((it) => it.is_active !== false);
        if (activeItems.length === 0) return null;

        return (
          <section key={sec.id}>
            {sec.title && (
              <h2 className="text-[#e60049] font-bold text-sm mb-4">{sec.title}</h2>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-md overflow-hidden bg-white hover:border-[#e60049] transition shadow-sm flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Thumbnail with Auto Scale */}
                    <Link
                      to={item.target_url || '#'}
                      className="block w-full aspect-[4/3] sm:aspect-[1/1] bg-gray-50 relative overflow-hidden flex items-center justify-center p-3"
                    >
                      {item.image_url && item.image_url.trim() ? (
                        <img
                          src={item.image_url}
                          alt={item.display_title || ''}
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-300 font-bold text-xs">
                          Tài liệu
                        </div>
                      )}

                      {item.badge_text && (
                        <span className="absolute top-2 right-2 bg-[#e60049] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                          {item.badge_text}
                        </span>
                      )}
                    </Link>

                    {/* Display Info */}
                    <div className="p-3.5 space-y-1.5">
                      {item.tag_text && (
                        <div className="text-[10px] text-gray-500 font-semibold truncate">
                          {item.tag_text}
                        </div>
                      )}
                      {item.display_title && (
                        <Link
                          to={item.target_url || '#'}
                          className="font-bold text-xs text-gray-800 line-clamp-2 hover:text-[#e60049] transition leading-snug"
                        >
                          {item.display_title}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 pt-0">
                    <Link
                      to={item.target_url || '#'}
                      className="block w-full text-center py-1.5 text-xs font-bold text-white bg-[#e60049] hover:bg-[#cc0041] rounded-sm transition shadow-sm"
                    >
                      Đọc thử
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

/**
 * 5. Dòng Chữ Xám: Thông Báo & Nút Xem Toàn Bộ (Không fallback)
 */
export const NoticeTextBlock: React.FC<{
  config?: HomepageNoticeTextConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false) return null;
  if (!config.text && !config.cta_button_text) return null;

  return (
    <div className="space-y-3">
      {config.text && (
        <p className="text-[12px] font-bold text-[#e60049] leading-relaxed whitespace-pre-line">
          {config.text}
        </p>
      )}
      {config.cta_button_text && (
        <Link
          to={config.cta_button_link || '#'}
          className="block w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-[12px] py-2 rounded-sm text-center transition shadow-sm"
        >
          {config.cta_button_text}
        </Link>
      )}
    </div>
  );
};

/**
 * 6. Khung Nâu: Bottom Banner (Không fallback)
 */
export const BottomBannerBlock: React.FC<{
  config?: HomepageBottomBannerConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false) return null;

  if (config.mode === 'custom_html') {
    if (!config.custom_html?.trim()) return null;
    return (
      <section
        className="w-full overflow-hidden"
        dangerouslySetInnerHTML={{ __html: config.custom_html }}
      />
    );
  }

  if (config.mode === 'custom_image') {
    if (!config.custom_image_url?.trim()) return null;
    return (
      <section>
        <Link
          to={config.link_url || '#'}
          className="block rounded-md overflow-hidden shadow-sm hover:opacity-95 transition"
        >
          <img
            src={config.custom_image_url}
            alt={config.title || ''}
            className="w-full h-auto object-cover rounded-md"
          />
        </Link>
      </section>
    );
  }

  const books = config.books || [];

  if (!config.title && books.length === 0) {
    return null;
  }

  return (
    <section>
      <Link
        to={config.link_url || '#'}
        className="block rounded-md overflow-hidden border border-sky-200 shadow-sm bg-gradient-to-r from-sky-200 via-blue-100 to-sky-200 p-6 sm:p-8 hover:opacity-95 transition"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {books.length > 0 && (
            <div className="md:col-span-5 flex items-center justify-center gap-4">
              {books.map((b, idx) => (
                <div
                  key={idx}
                  className={`book-3d w-24 h-32 rounded-sm bg-gradient-to-br ${b.gradient || ''} p-2 text-white flex flex-col justify-between`}
                >
                  <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                  <div className="font-black text-[10px] leading-tight uppercase">{b.title}</div>
                  {b.year && (
                    <span
                      className={`text-[7px] px-1 py-0.5 rounded-sm w-fit font-bold ${
                        idx === 0 ? 'bg-amber-400 text-black' : 'bg-white/20 text-white'
                      }`}
                    >
                      {b.year}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={books.length > 0 ? 'md:col-span-7 text-center md:text-left' : 'col-span-12 text-center'}>
            {config.tag && (
              <div className="text-[11px] font-extrabold text-[#e60049] uppercase">
                {config.tag}
              </div>
            )}
            {config.title && (
              <div className="text-xl sm:text-2xl font-black text-blue-900 uppercase mt-1">
                {config.title}
              </div>
            )}
            {config.badge_text && (
              <div className="inline-block mt-1.5 bg-white text-[#e60049] font-extrabold text-xs px-4 py-1 rounded-sm shadow-sm">
                {config.badge_text}
              </div>
            )}
          </div>
        </div>
      </Link>
    </section>
  );
};
