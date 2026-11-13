import React from 'react';
import { SmartLink } from './SmartLink';
import { IsolatedHtmlBlock } from './IsolatedHtmlBlock';
import {
  HomepageBottomBannerConfig,
  HomepageCategoriesGridConfig,
  HomepageHeroConfig,
  HomepageNoticeTextConfig,
  HomepageSectionGroupsConfig,
  HomepageTopBannerConfig,
} from '../types';

/**
 * 1. Hero Header (Phần đầu trang - Tiêu đề, phụ đề, gạch đầu dòng và ảnh Thầy giáo đứng riêng, không khung viền)
 */
export const DEFAULT_HERO_TEACHER_IMAGE = '/favicon.png';

export const HeroBlock: React.FC<{ config?: HomepageHeroConfig | null }> = ({ config }) => {
  if (!config || config.is_active === false) return null;

  if (config.mode === 'custom_html') {
    if (!config.custom_html?.trim()) return null;
    return (
      <IsolatedHtmlBlock
        htmlContent={config.custom_html}
        containerMode="full_width"
      />
    );
  }

  if (config.mode === 'custom_image') {
    const img = config.custom_image_url || config.image_url;
    if (!img?.trim()) return null;
    return (
      <section className="w-full overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-4">
          <img
            src={img}
            alt={config.title || ''}
            className="w-full h-auto object-contain block"
          />
        </div>
      </section>
    );
  }

  const bullets = (config.bullets || []).filter((b) => b && b.trim().length > 0);
  const teacherImage = config.image_url?.trim() || DEFAULT_HERO_TEACHER_IMAGE;
  const isImageLeft = config.layout_direction === 'image_left_text_right';

  // Nếu không có nội dung gì thì không render
  if (!config.title && !config.subtitle && bullets.length === 0 && !teacherImage) {
    return null;
  }

  return (
    <section className="pt-8 sm:pt-12 pb-6 sm:pb-8 bg-gradient-to-b from-[#fff6f8] via-[#fffbfc] to-white border-b border-pink-50/60">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Cột Chữ (Tiêu đề, phụ đề, gạch đầu dòng) */}
          <div className={teacherImage ? (isImageLeft ? 'md:col-span-7 md:order-2 space-y-3' : 'md:col-span-7 md:order-1 space-y-3') : 'col-span-12 space-y-3'}>
            {config.subtitle && (
              <p className="text-[#e60049] font-bold text-sm sm:text-base leading-snug">
                {config.subtitle}
              </p>
            )}
            {config.title && (
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#e60049] tracking-tight leading-tight">
                {config.title}
              </h1>
            )}
            {bullets.length > 0 && (
              <ul className="space-y-2 pt-1 text-xs sm:text-sm text-gray-800 font-medium">
                {bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 bg-gray-900 rounded-2xs mt-1.5 shrink-0 inline-block" />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cột Hình ảnh Thầy giáo tự nhiên */}
          {teacherImage && (
            <div className={`md:col-span-5 flex justify-center items-center ${isImageLeft ? 'md:order-1' : 'md:order-2'}`}>
              <img
                src={teacherImage}
                alt={config.title || 'Huy Tutor'}
                className="max-h-[280px] sm:max-h-[340px] w-auto max-w-full object-contain mx-auto block"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/**
 * 2. Top Banner (Banner Ưu đãi / Nổi bật - Ảnh đứng một mình full-width, KHÔNG bọc trong khung vàng)
 */
export const TopBannerBlock: React.FC<{ config?: HomepageTopBannerConfig | null }> = ({
  config,
}) => {
  if (!config || config.is_active === false) return null;

  if (config.mode === 'custom_html') {
    if (!config.custom_html?.trim()) return null;
    return (
      <div className="max-w-[1100px] mx-auto px-4">
        <IsolatedHtmlBlock
          htmlContent={config.custom_html}
          containerMode="full_width"
        />
      </div>
    );
  }

  const imageUrl = config.image_url || config.custom_image_url;

  // Khi có ảnh: Ảnh đứng một mình (max-w-[1100px]), KHÔNG bao giờ bị nhốt trong khung nền vàng!
  if (imageUrl) {
    return (
      <section className="max-w-[1100px] mx-auto px-4 space-y-3">
        {config.header_label && (
          <h2 className="text-[#e60049] font-bold text-sm sm:text-base">{config.header_label}</h2>
        )}
        <SmartLink
          to={config.link_url}
          className="block w-full overflow-hidden rounded-2xl shadow-sm hover:opacity-95 transition"
        >
          <img
            src={imageUrl}
            alt={config.header_label || config.title || 'Banner'}
            className="w-full h-auto object-contain rounded-2xl block"
          />
        </SmartLink>
      </section>
    );
  }

  // Trường hợp không có ảnh up lên, render thẻ 3D Books nếu có cấu hình
  const books = config.books || [];
  if (books.length === 0 && !config.title) {
    return null;
  }

  return (
    <section className="max-w-[1100px] mx-auto px-4 space-y-3">
      {config.header_label && (
        <h2 className="text-[#e60049] font-bold text-sm sm:text-base">{config.header_label}</h2>
      )}
      <SmartLink
        to={config.link_url}
        className="block rounded-2xl overflow-hidden border border-amber-200/80 shadow-sm bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 p-6 sm:p-8 hover:opacity-95 transition"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
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

          <div className="md:col-span-6 text-center md:text-left">
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
              <div className="inline-block mt-2.5 bg-sky-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-wide">
                {config.cta_badge}
              </div>
            )}
          </div>
        </div>
      </SmartLink>
    </section>
  );
};

/**
 * 3. Danh mục sản phẩm (Bắt buộc 100% ảnh R2, placeholder sạch khi link rỗng)
 */
export const CategoriesGridBlock: React.FC<{
  config?: HomepageCategoriesGridConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false) return null;
  const activeItems = (config.items || []).filter((it) => it.is_active !== false);
  if (activeItems.length === 0) return null;

  return (
    <section className="max-w-[1100px] mx-auto px-4">
      {config.title && (
        <h2 className="text-[#e60049] font-bold text-sm sm:text-base mb-4">{config.title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {activeItems.map((cat) => (
          <SmartLink
            key={cat.id}
            to={cat.to || cat.category_slug}
            className="group text-center flex flex-col items-center"
          >
            {/* 100% hiển thị hình ảnh từ R2, nếu link rỗng thì hiển thị placeholder trung tính */}
            {cat.image_url && cat.image_url.trim() ? (
              <img
                src={cat.image_url}
                alt={cat.label || ''}
                className="w-full aspect-square object-contain rounded-2xl shadow-xs group-hover:scale-105 transition-transform duration-200 block"
              />
            ) : (
              <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-3 text-gray-400 group-hover:border-pink-300 transition">
                <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] font-bold text-gray-400">Chưa có ảnh</span>
              </div>
            )}
            {cat.label && (
              <span className="block text-xs font-bold text-gray-900 mt-2 text-center group-hover:text-[#e60049] transition truncate max-w-full">
                {cat.label}
              </span>
            )}
          </SmartLink>
        ))}
      </div>
    </section>
  );
};

/**
 * 4. Nhóm tài liệu & Sản phẩm (Chuẩn giao diện: Hộp bìa sách 3D đứng một mình ở giữa -> Nút Đọc thử -> Tên sách căn giữa in đậm)
 */
export const SectionGroupsBlock: React.FC<{
  config?: HomepageSectionGroupsConfig | null;
}> = ({ config }) => {
  if (!config || !Array.isArray(config.sections)) return null;

  const activeSections = config.sections.filter((sec) => sec.is_active !== false);
  if (activeSections.length === 0) return null;

  return (
    <div className="max-w-[1100px] mx-auto px-4 space-y-12">
      {activeSections.map((sec) => {
        const activeItems = (sec.items || []).filter(
          (it) => it.is_active !== false && (Boolean(it.image_url?.trim()) || Boolean(it.display_title?.trim()))
        );
        if (activeItems.length === 0) return null;

        return (
          <section key={sec.id}>
            {sec.title && (
              <h2 className="text-[#e60049] font-bold text-base sm:text-lg mb-4">{sec.title}</h2>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {activeItems.map((item) => (
                <div key={item.id} className="flex flex-col">
                  {/* Hộp trắng: Bìa sách 3D đứng một mình ở giữa hộp */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 h-48 sm:h-52 flex items-center justify-center shadow-2xs hover:border-gray-300 transition">
                    <SmartLink
                      to={item.target_url}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {item.image_url && item.image_url.trim() ? (
                        <img
                          src={item.image_url}
                          alt={item.display_title || ''}
                          className="h-40 sm:h-44 w-auto object-contain mx-auto drop-shadow-md hover:scale-105 transition-transform duration-200 block"
                        />
                      ) : (
                        <div className="w-24 h-36 bg-gray-50 rounded border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 font-bold text-xs p-2 text-center">
                          <svg className="w-6 h-6 mb-1 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span>Bìa 3D</span>
                        </div>
                      )}
                    </SmartLink>
                  </div>

                  {/* Nút Đọc thử màu đỏ ngay dưới hộp */}
                  <SmartLink
                    to={item.target_url}
                    className="block w-full text-center py-2 text-xs font-bold text-white bg-[#e60049] hover:bg-[#cc0041] rounded-xs transition shadow-xs mt-2.5"
                  >
                    Đọc thử
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
      })}
    </div>
  );
};

/**
 * 5. Thông báo & Kêu gọi hành động (Notice / CTA - Kêu gọi tham gia nhóm, Xem toàn bộ)
 */
export const NoticeTextBlock: React.FC<{
  config?: HomepageNoticeTextConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false) return null;
  if (!config.text && !config.cta_button_text) return null;

  return (
    <div className="max-w-[1100px] mx-auto px-4 space-y-3 text-center py-4">
      {config.text && (
        <p className="text-sm sm:text-base font-bold text-[#e60049] leading-relaxed max-w-[850px] mx-auto whitespace-pre-line">
          {config.text}
        </p>
      )}
      {config.cta_button_text && (
        <div className="pt-1">
          <SmartLink
            to={config.cta_button_link}
            className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs sm:text-sm px-6 py-2 rounded-xs transition shadow-sm"
          >
            {config.cta_button_text}
          </SmartLink>
        </div>
      )}
    </div>
  );
};

/**
 * 6. Bottom Banner (Banner chân trang - Ảnh đứng một mình full-width, KHÔNG bọc trong khung màu)
 */
export const BottomBannerBlock: React.FC<{
  config?: HomepageBottomBannerConfig | null;
}> = ({ config }) => {
  if (!config || config.is_active === false) return null;

  if (config.mode === 'custom_html') {
    if (!config.custom_html?.trim()) return null;
    return (
      <div className="max-w-[1100px] mx-auto px-4">
        <IsolatedHtmlBlock
          htmlContent={config.custom_html}
          containerMode="full_width"
        />
      </div>
    );
  }

  const imageUrl = config.image_url || config.custom_image_url;

  // Khi có ảnh: Ảnh đứng một mình (max-w-[1100px]), KHÔNG bị bọc trong khung màu!
  if (imageUrl) {
    return (
      <section className="max-w-[1100px] mx-auto px-4">
        <SmartLink
          to={config.link_url}
          className="block w-full overflow-hidden rounded-2xl shadow-sm hover:opacity-95 transition"
        >
          <img
            src={imageUrl}
            alt={config.title || 'Bottom Banner'}
            className="w-full h-auto object-contain rounded-2xl block"
          />
        </SmartLink>
      </section>
    );
  }

  const books = config.books || [];
  if (!config.title && books.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1100px] mx-auto px-4">
      <SmartLink
        to={config.link_url}
        className="block rounded-2xl overflow-hidden border border-sky-200 shadow-sm bg-gradient-to-r from-sky-200 via-blue-100 to-sky-200 p-6 sm:p-8 hover:opacity-95 transition"
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

          <div
            className={
              books.length > 0
                ? 'md:col-span-7 text-center md:text-left'
                : 'col-span-12 text-center'
            }
          >
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
              <div className="inline-block mt-2 bg-white text-[#e60049] font-extrabold text-xs px-4 py-1 rounded-sm shadow-sm">
                {config.badge_text}
              </div>
            )}
          </div>
        </div>
      </SmartLink>
    </section>
  );
};
