import { buildProductUrl } from '../utils/urlHelper';
import React from 'react';
import { apiClient } from '../api/client';
import {
  CategoryBannerBlockConfig,
  CategoryHeroBlockConfig,
  CategoryNoticeBlockConfig,
  CategorySectionBlockConfig,
  ComboBannerBlockConfig,
  ComboBottomCtaBlockConfig,
  ComboHeroBlockConfig,
  ComboNoticeBlockConfig,
  ComboPackagesBlockConfig,
  ComboSectionsBlockConfig,
  FlashcardBannerBlockConfig,
  FlashcardContactNoticeBlockConfig,
  FlashcardFeaturesBlockConfig,
  FlashcardFreeTierBlockConfig,
  FlashcardGroupPricingBlockConfig,
  FlashcardHeroBlockConfig,
  FlashcardPricingBlockConfig,
  HomepageBottomBannerConfig,
  HomepageCategoriesGridConfig,
  HomepageHeroConfig,
  HomepageNoticeTextConfig,
  HomepageSectionGroupsConfig,
  HomepageTopBannerConfig,
  Product,
  ProductHeroBlockConfig,
  ProductIntroBlockConfig,
  RelatedProductsBlockConfig,
  SampleGroupsBlockConfig,
  SamplePreviewGroup,
  TopicAccordionBlockConfig,
  TopicAccordionBox,
  UniversalBlockItem,
  UniversalPageContext,
} from '../types';
import { R2ImageUploader } from './R2ImageUploader';
import { R2MultiImageUploader } from './R2MultiImageUploader';

interface UniversalBlockItemEditorProps {
  block: UniversalBlockItem;
  onUpdateConfig: (partial: any) => void;
  allProducts?: Product[];
  context?: UniversalPageContext;
}

export const UniversalBlockItemEditor: React.FC<UniversalBlockItemEditorProps> = ({
  block,
  onUpdateConfig,
  allProducts = [],
  context,
}) => {
  const cfg = block.config || {};

  // ==========================================
  // 1. HERO TRANG CHỦ
  // ==========================================
  if (block.type === 'hero') {
    const heroCfg = cfg as HomepageHeroConfig;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề phụ / Dòng trên</label>
            <input
              type="text"
              value={heroCfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Dạy & học tiếng Anh với tài nguyên"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề chính (Đỏ đậm)</label>
            <input
              type="text"
              value={heroCfg.subtitle || ''}
              onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Chuẩn mực & Chi tiết"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Các gạch đầu dòng cam kết (mỗi dòng một ý)</label>
          <textarea
            rows={4}
            value={(heroCfg.bullets || []).join('\n')}
            onChange={(e) =>
              onUpdateConfig({
                bullets: e.target.value.split('\n').filter((l) => l.trim().length > 0),
              })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="150+ đề thi thử, 9+ tài liệu bổ sung&#10;Hệ thống flashcard trực tuyến..."
          />
        </div>

        <R2ImageUploader
          label="Ảnh tác giả / Thầy giáo (Cloudflare R2)"
          imageUrl={heroCfg.image_url}
          onUrlChange={(url) => onUpdateConfig({ image_url: url })}
          folder="homepage/hero"
          aspectRatioHint="Khuyến nghị ảnh chân dung PNG trong suốt hoặc tỉ lệ 1:1"
        />
      </div>
    );
  }

  // ==========================================
  // 2. COMBO HERO
  // ==========================================
  if (block.type === 'combo_hero') {
    const comboHeroCfg = cfg as ComboHeroBlockConfig;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Slogan trên</label>
            <input
              type="text"
              value={comboHeroCfg.top_slogan || ''}
              onChange={(e) => onUpdateConfig({ top_slogan: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Mua nhiều. Giảm sâu. Tích điểm cao*."
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Slogan dưới</label>
            <input
              type="text"
              value={comboHeroCfg.bottom_slogan || ''}
              onChange={(e) => onUpdateConfig({ bottom_slogan: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Giảm giá lên đến 25%."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề lớn</label>
            <input
              type="text"
              value={comboHeroCfg.headline || ''}
              onChange={(e) => onUpdateConfig({ headline: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Combo 90 ĐỀ THI THỬ"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Phụ đề</label>
            <input
              type="text"
              value={comboHeroCfg.sub_headline || ''}
              onChange={(e) => onUpdateConfig({ sub_headline: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="THI THPT MÔN TIẾNG ANH"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Badge huy hiệu</label>
            <input
              type="text"
              value={comboHeroCfg.badge_text || ''}
              onChange={(e) => onUpdateConfig({ badge_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="CƠ BẢN + NÂNG CAO"
            />
          </div>
        </div>

        <R2ImageUploader
          label="Banner lớn tùy chọn (Cloudflare R2)"
          imageUrl={comboHeroCfg.banner_image_url}
          onUrlChange={(url) => onUpdateConfig({ banner_image_url: url })}
          folder="combos/hero"
        />
      </div>
    );
  }

  // ==========================================
  // 3. FLASHCARD HERO
  // ==========================================
  if (block.type === 'flashcard_hero') {
    const fcHeroCfg = cfg as FlashcardHeroBlockConfig;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề lớn</label>
            <input
              type="text"
              value={fcHeroCfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Học từ vựng thông minh cùng Flashcard"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Link Video YouTube giới thiệu</label>
            <input
              type="text"
              value={fcHeroCfg.youtube_url_or_id || ''}
              onChange={(e) => onUpdateConfig({ youtube_url_or_id: e.target.value, video_type: 'youtube' })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Mô tả phụ</label>
          <textarea
            rows={2}
            value={fcHeroCfg.subtitle || ''}
            onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="Phương pháp lặp lại ngắt quãng khoa học..."
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. CATEGORY HERO
  // ==========================================
  if (block.type === 'category_hero') {
    const catHeroCfg = cfg as CategoryHeroBlockConfig;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề danh mục (Đỏ đậm)</label>
            <input
              type="text"
              value={catHeroCfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Tài liệu Tiếng Anh Chuẩn Mực"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Mô tả phụ</label>
            <input
              type="text"
              value={catHeroCfg.subtitle || ''}
              onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Tuyển tập tài liệu chất lượng cao..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="chk_pink_glow"
            checked={catHeroCfg.show_pink_glow ?? true}
            onChange={(e) => onUpdateConfig({ show_pink_glow: e.target.checked })}
            className="rounded text-[#e60049] focus:ring-[#e60049]"
          />
          <label htmlFor="chk_pink_glow" className="font-bold text-gray-700">
            Hiệu ứng ánh hồng phớt nền dịu nhẹ (Pink Glow Background)
          </label>
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. BANNER (Chung cho Top, Bottom, Combo, Category, Flashcard)
  // ==========================================
  if (
    block.type === 'top_banner' ||
    block.type === 'bottom_banner' ||
    block.type === 'combo_banner' ||
    block.type === 'category_banner' ||
    block.type === 'flashcard_banner'
  ) {
    const bannerUrl = cfg.image_url || cfg.banner_url || '';
    const linkUrl = cfg.link_url || '';
    const title = cfg.title || cfg.header_label || '';

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề / Nhãn Banner (nếu có)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onUpdateConfig({ title: e.target.value, header_label: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Ưu đãi từ 15% khi mua Combo"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Đường dẫn khi click (Link URL)</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => onUpdateConfig({ link_url: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="/combo-thpt hoặc https://..."
            />
          </div>
        </div>

        <R2ImageUploader
          label="Tải ảnh Banner ngang (Cloudflare R2)"
          imageUrl={bannerUrl}
          onUrlChange={(url) => onUpdateConfig({ image_url: url, banner_url: url })}
          folder="banners"
          aspectRatioHint="Khuyến nghị tỉ lệ ngang 1200x300 hoặc 1920x450"
        />
      </div>
    );
  }

  // ==========================================
  // 6. GÓI COMBO (combo_packages)
  // ==========================================
  if (block.type === 'combo_packages') {
    const pkgCfg = cfg as ComboPackagesBlockConfig;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề nhóm gói</label>
            <input
              type="text"
              value={pkgCfg.section_title || ''}
              onChange={(e) => onUpdateConfig({ section_title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Ưu đãi cao nhất"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Mô tả phụ</label>
            <input
              type="text"
              value={pkgCfg.sub_text || ''}
              onChange={(e) => onUpdateConfig({ sub_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Sử dụng ưu đãi thành viên để được giảm thêm..."
            />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-800">
              Danh sách các thẻ gói ({pkgCfg.packages?.length || 0} thẻ)
            </span>
            <button
              type="button"
              onClick={() => {
                const newPkg = {
                  id: `pkg_${Date.now()}`,
                  title: 'Combo Mới',
                  discount_badge: 'GIẢM 20%',
                  format_badge: 'Word + PDF',
                  tag_text: 'HOT',
                  product_ids: [],
                  action_type: 'open_checkout' as const,
                };
                onUpdateConfig({ packages: [...(pkgCfg.packages || []), newPkg] });
              }}
              className="text-xs bg-[#e60049] text-white px-2.5 py-1 rounded font-bold hover:bg-[#cc0041]"
            >
              + Thêm Thẻ Gói
            </button>
          </div>

          <div className="space-y-2">
            {(pkgCfg.packages || []).map((pkg, idx) => (
              <div key={pkg.id || idx} className="bg-white border rounded p-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={pkg.title}
                    onChange={(e) => {
                      const updated = [...pkgCfg.packages];
                      updated[idx].title = e.target.value;
                      onUpdateConfig({ packages: updated });
                    }}
                    placeholder="Tên gói"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    value={pkg.discount_badge}
                    onChange={(e) => {
                      const updated = [...pkgCfg.packages];
                      updated[idx].discount_badge = e.target.value;
                      onUpdateConfig({ packages: updated });
                    }}
                    placeholder="Badge (GIẢM 25%)"
                    className="border rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    value={pkg.format_badge}
                    onChange={(e) => {
                      const updated = [...pkgCfg.packages];
                      updated[idx].format_badge = e.target.value;
                      onUpdateConfig({ packages: updated });
                    }}
                    placeholder="Định dạng (Word / PDF)"
                    className="border rounded px-2 py-1 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = pkgCfg.packages.filter((_, i) => i !== idx);
                    onUpdateConfig({ packages: updated });
                  }}
                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 7. LƯỚI TÀI LIỆU (category_section / combo_sections)
  // ==========================================
  if (block.type === 'category_section' || block.type === 'combo_sections') {
    const secCfg = cfg as CategorySectionBlockConfig;
    return (
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Tiêu đề nhóm tài liệu</label>
          <input
            type="text"
            value={secCfg.title || (cfg as any).group_header || ''}
            onChange={(e) => onUpdateConfig({ title: e.target.value, group_header: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="3 Bộ Đề Mới Xuất Bản / Tài Liệu Bổ Trợ"
          />
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <label className="block font-bold text-gray-800 mb-1">
            Chọn tài liệu hiển thị trong nhóm (Lưới 3 cột chuẩn)
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded bg-white p-2 space-y-1">
            {allProducts.map((prod) => {
              const selectedIds: string[] = Array.isArray(secCfg.items)
                ? secCfg.items.map((it: any) => it.product_id || it.id)
                : (cfg as any).groups?.[0]?.product_ids || [];
              const isSelected = selectedIds.includes(prod.id);

              return (
                <label
                  key={prod.id}
                  className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer ${
                    isSelected ? 'bg-pink-50 text-[#e60049] font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      let nextIds: string[];
                      if (e.target.checked) {
                        nextIds = [...selectedIds, prod.id];
                      } else {
                        nextIds = selectedIds.filter((id) => id !== prod.id);
                      }
                      const newItems = nextIds.map((id) => {
                        const found = allProducts.find((p) => p.id === id);
                        return {
                          id: `card_${id}`,
                          product_id: id,
                          title: found?.title || 'Tài liệu',
                          image_url: found?.thumbnail_url || '',
                          badge_tag: found?.cover_tag || 'MỚI',
                          target_url: buildProductUrl(found?.category_slug, found?.slug),
                        };
                      });
                      onUpdateConfig({ items: newItems, product_ids: nextIds });
                    }}
                    className="rounded text-[#e60049] focus:ring-[#e60049]"
                  />
                  <span>{prod.title}</span>
                  <span className="text-[10px] text-gray-400">({prod.category_slug})</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 8. HỘP GHI CHÚ / THÔNG BÁO (notice_text, category_notice, combo_notice, flashcard_contact_notice)
  // ==========================================
  if (
    block.type === 'notice_text' ||
    block.type === 'category_notice' ||
    block.type === 'combo_notice' ||
    block.type === 'flashcard_contact_notice'
  ) {
    const textContent = cfg.text || cfg.content || cfg.bulk_order_text || '';
    const ctaText = cfg.cta_button_text || '';
    const ctaLink = cfg.cta_button_link || '';

    return (
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Nội dung thông báo / Ghi chú</label>
          <textarea
            rows={3}
            value={textContent}
            onChange={(e) =>
              onUpdateConfig({
                text: e.target.value,
                content: e.target.value,
                bulk_order_text: e.target.value,
              })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="Nội dung thông báo..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chữ trên nút CTA (nếu có)</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => onUpdateConfig({ cta_button_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Tham gia ngay / Đăng ký"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Link nút CTA</label>
            <input
              type="text"
              value={ctaLink}
              onChange={(e) => onUpdateConfig({ cta_button_link: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="https://... hoặc /combo-thpt"
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 9. NỘI DUNG & ĐỌC THỬ (product_intro, topic_accordion, sample_groups)
  // ==========================================
  if (block.type === 'product_intro') {
    const introCfg = cfg as ProductIntroBlockConfig;
    return (
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Đoạn văn giới thiệu tổng quan</label>
          <textarea
            rows={3}
            value={(introCfg.paragraphs || []).join('\n\n')}
            onChange={(e) =>
              onUpdateConfig({
                paragraphs: e.target.value.split('\n\n').filter((p) => p.trim().length > 0),
              })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="Tài liệu được biên soạn kỹ lưỡng..."
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Tiêu đề danh sách điểm nổi bật</label>
          <input
            type="text"
            value={introCfg.bullets_title || ''}
            onChange={(e) => onUpdateConfig({ bullets_title: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="ĐIỂM NỔI BẬT CỦA TÀI LIỆU:"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Các gạch đầu dòng (mỗi dòng một ý)</label>
          <textarea
            rows={4}
            value={(introCfg.bullets || []).map((b) => b.text).join('\n')}
            onChange={(e) =>
              onUpdateConfig({
                bullets: e.target.value
                  .split('\n')
                  .filter((l) => l.trim().length > 0)
                  .map((t, idx) => ({ id: `b_${idx}`, text: t, is_highlight: idx === 0 })),
              })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="Đáp án chi tiết, dịch nghĩa toàn bộ...&#10;File Word chuẩn font..."
          />
        </div>
      </div>
    );
  }

  if (block.type === 'topic_accordion') {
    const accCfg = cfg as TopicAccordionBlockConfig;
    const currentAcc = accCfg.accordions?.[0] || {
      id: 'acc_0',
      title: 'Danh sách chủ đề',
      default_open: true,
      items: [],
    };
    const isDefaultOpen = currentAcc.default_open !== false;

    const updateAccordion = (patch: Partial<TopicAccordionBox>) => {
      onUpdateConfig({
        accordions: [
          {
            ...currentAcc,
            ...patch,
          },
        ],
      });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề khu vực Accordion</label>
            <input
              type="text"
              value={accCfg.section_heading || ''}
              onChange={(e) => onUpdateConfig({ section_heading: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
              placeholder="Bản xem thử & Danh sách chuyên đề"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Thanh điều hướng nhảy nhanh</label>
            <label className="inline-flex items-center gap-2 pt-2 cursor-pointer text-xs font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={accCfg.show_quick_anchor_nav !== false}
                onChange={(e) => onUpdateConfig({ show_quick_anchor_nav: e.target.checked })}
                className="accent-[#e60049] cursor-pointer"
              />
              <span>Hiển thị thanh nút nhảy nhanh tới từng nhóm đọc thử A4</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-3">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề thanh chủ đề (Hộp Accordion)</label>
            <input
              type="text"
              value={currentAcc.title || 'Danh sách chủ đề'}
              onChange={(e) => updateAccordion({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
              placeholder="Danh sách 30 đề thi / Danh sách chủ đề"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Trạng thái mặc định khi vào trang</label>
            <div className="flex items-center gap-4 pt-1.5">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-800">
                <input
                  type="radio"
                  name="accordion_default_state"
                  checked={isDefaultOpen}
                  onChange={() => updateAccordion({ default_open: true })}
                  className="accent-[#e60049] cursor-pointer"
                />
                <span>Mặc định MỞ RỘNG (Expand)</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-800">
                <input
                  type="radio"
                  name="accordion_default_state"
                  checked={!isDefaultOpen}
                  onChange={() => updateAccordion({ default_open: false })}
                  className="accent-[#e60049] cursor-pointer"
                />
                <span>Mặc định THU GỌN (Collapse)</span>
              </label>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {isDefaultOpen
                ? 'Nội dung sẽ mở sẵn toàn bộ ngay khi khách vào trang.'
                : 'Nội dung sẽ thu gọn lại, người xem bấm vào thanh tiêu đề mới xổ danh sách ra.'}
            </p>
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Các đề / chủ đề liệt kê (mỗi dòng một mục)</label>
          <textarea
            rows={6}
            value={(currentAcc.items || []).join('\n')}
            onChange={(e) => {
              const items = e.target.value.split('\n').filter((l) => l.trim().length > 0);
              updateAccordion({ items });
            }}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs leading-relaxed"
            placeholder="Đề 01: Khởi động cơ bản&#10;Đề 02: Tăng tốc nâng cao&#10;Đề 03: Về đích điểm 10..."
          />
        </div>
      </div>
    );
  }

  if (block.type === 'sample_groups') {
    const sampleCfg = cfg as SampleGroupsBlockConfig;
    const groups: SamplePreviewGroup[] =
      Array.isArray(sampleCfg.groups) && sampleCfg.groups.length > 0
        ? sampleCfg.groups
        : [
            {
              id: 'sgrp_1',
              title: 'Demo đề thi',
              description: '',
              media_type: 'images',
              images: [],
              watermark_enabled: true,
              watermark_text: 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
              is_active: true,
              sort_order: 1,
            },
          ];

    const handleUpdateGroup = (idx: number, patch: Partial<SamplePreviewGroup>) => {
      const next = [...groups];
      next[idx] = { ...next[idx], ...patch };
      onUpdateConfig({ groups: next });
    };

    const handleAddGroup = () => {
      const newGroup: SamplePreviewGroup = {
        id: `sgrp_${Date.now()}`,
        title: `Nhóm Đọc Thử ${groups.length + 1}`,
        description: '',
        media_type: 'images',
        images: [],
        watermark_enabled: true,
        watermark_text: 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
        is_active: true,
        sort_order: groups.length + 1,
      };
      onUpdateConfig({ groups: [...groups, newGroup] });
    };

    const handleRemoveGroup = (idx: number) => {
      const groupToRemove = groups[idx];
      if (
        !window.confirm(
          `Bạn có chắc chắn muốn xóa "${groupToRemove.title || `Nhóm ${idx + 1}`}" và toàn bộ ảnh đi kèm?`
        )
      ) {
        return;
      }
      (groupToRemove.images || []).forEach((u) => {
        if (u) apiClient.deleteR2File(u).catch(() => {});
      });
      const next = groups.filter((_, i) => i !== idx).map((g, i) => ({ ...g, sort_order: i + 1 }));
      onUpdateConfig({ groups: next });
    };

    const handleMoveGroup = (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= groups.length) return;
      const next = [...groups];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      onUpdateConfig({ groups: next.map((g, i) => ({ ...g, sort_order: i + 1 })) });
    };

    return (
      <div className="space-y-6">
        {groups.map((group, groupIdx) => (
          <div
            key={group.id || groupIdx}
            className="border border-gray-200 rounded-md p-4 bg-gray-50/50 space-y-4"
          >
            {/* Header nhóm */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="bg-[#e60049] text-white text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
                  Nhóm {groupIdx + 1}
                </span>
                <span className="font-extrabold text-gray-800 text-xs">
                  {group.title || `Nhóm đọc thử ${groupIdx + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="Di chuyển nhóm lên trên"
                  disabled={groupIdx === 0}
                  onClick={() => handleMoveGroup(groupIdx, -1)}
                  className="px-2 py-0.5 bg-white border border-gray-300 hover:border-gray-400 disabled:opacity-30 rounded-2xs text-[11px] font-bold text-gray-700"
                >
                  ↑ Lên
                </button>
                <button
                  type="button"
                  title="Di chuyển nhóm xuống dưới"
                  disabled={groupIdx === groups.length - 1}
                  onClick={() => handleMoveGroup(groupIdx, 1)}
                  className="px-2 py-0.5 bg-white border border-gray-300 hover:border-gray-400 disabled:opacity-30 rounded-2xs text-[11px] font-bold text-gray-700"
                >
                  ↓ Xuống
                </button>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(groupIdx)}
                    className="px-2 py-0.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-2xs text-[11px] font-bold"
                  >
                    ✕ Xóa nhóm
                  </button>
                )}
              </div>
            </div>

            {/* Các trường cấu hình nhóm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tiêu đề nhóm đọc thử</label>
                <input
                  type="text"
                  value={group.title || ''}
                  onChange={(e) => handleUpdateGroup(groupIdx, { title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
                  placeholder="Demo Đề thi / Demo Đáp án chi tiết"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô tả ngắn (tùy chọn)</label>
                <input
                  type="text"
                  value={group.description || ''}
                  onChange={(e) => handleUpdateGroup(groupIdx, { description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
                  placeholder="Bao gồm 5 câu trắc nghiệm đầu tiên..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-center">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Loại nội dung đọc thử</label>
                <select
                  value={group.media_type || 'images'}
                  onChange={(e) =>
                    handleUpdateGroup(groupIdx, { media_type: e.target.value as 'images' | 'pdf' })
                  }
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
                >
                  <option value="images">Bộ các trang ảnh A4 (Tải lên nhiều ảnh cùng lúc)</option>
                  <option value="pdf">File PDF nhúng (iframe)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Chữ Watermark bảo vệ bản quyền</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`wm_toggle_${groupIdx}`}
                    checked={group.watermark_enabled !== false}
                    onChange={(e) =>
                      handleUpdateGroup(groupIdx, { watermark_enabled: e.target.checked })
                    }
                    className="accent-[#e60049] rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={group.watermark_text || 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN'}
                    onChange={(e) =>
                      handleUpdateGroup(groupIdx, { watermark_text: e.target.value })
                    }
                    disabled={group.watermark_enabled === false}
                    className="flex-1 border border-gray-300 rounded px-2.5 py-1 focus:border-[#e60049] bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Nếu là PDF */}
            {group.media_type === 'pdf' ? (
              <div className="space-y-1">
                <label className="block font-bold text-gray-700">Đường dẫn File PDF mẫu (Google Drive / Cloudflare R2)</label>
                <input
                  type="text"
                  value={group.pdf_url || ''}
                  onChange={(e) => handleUpdateGroup(groupIdx, { pdf_url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/.../preview hoặc https://media.huytutor.edu.vn/..."
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
                />
              </div>
            ) : (
              /* Bộ tải nhiều ảnh cùng lúc R2MultiImageUploader */
              <R2MultiImageUploader
                label={`Tải lên các trang ảnh A4 đọc thử (${group.images?.length || 0} trang)`}
                helperText="Chọn hoặc kéo thả nhiều file ảnh A4 cùng lúc để tự động tải lên Cloudflare R2."
                images={group.images || []}
                onImagesChange={(newImgs) => handleUpdateGroup(groupIdx, { images: newImgs })}
                folder="samples/pages"
                aspectRatioHint="Khổ A4 dọc tỉ lệ 1:1.414"
              />
            )}
          </div>
        ))}

        {/* Nút thêm nhóm đọc thử mới */}
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={handleAddGroup}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-pink-50 text-[#e60049] border-2 border-dashed border-[#e60049] px-4 py-2 rounded font-bold text-xs transition cursor-pointer shadow-2xs"
          >
            <span>+ Thêm Nhóm Đọc Thử Mới (Demo Đáp án / Demo Từ vựng...)</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // KHỐI QUÀ TẶNG: gift_preview_download (Xem thử Watermark & Nút Tải ngay)
  // ==========================================
  if (block.type === 'gift_preview_download') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề khối quà tặng</label>
            <input
              type="text"
              value={cfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
              placeholder="Tài liệu quà tặng miễn phí"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chữ Watermark bảo vệ bản quyền</label>
            <input
              type="text"
              value={cfg.watermark_text || 'TÀI LIỆU QUÀ TẶNG - HUYTUTOR.EDU.VN'}
              onChange={(e) => onUpdateConfig({ watermark_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Mô tả ngắn</label>
            <input
              type="text"
              value={cfg.subtitle || ''}
              onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
              placeholder="Nhấn nút bên dưới để tải về miễn phí trọn bộ file Word/PDF."
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Link tải về trực tiếp (Google Drive)</label>
            <input
              type="text"
              value={cfg.download_url || ''}
              onChange={(e) => onUpdateConfig({ download_url: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
              placeholder="https://drive.google.com/..."
            />
          </div>
        </div>

        {/* Danh sách ảnh đọc thử A4 cho quà tặng */}
        <R2MultiImageUploader
          label={`Các trang ảnh đọc thử A4 (${(cfg.preview_images || []).length} trang)`}
          helperText="Kéo thả hoặc chọn nhiều ảnh cùng lúc để tải trực tiếp lên Cloudflare R2."
          images={cfg.preview_images || []}
          onImagesChange={(newImgs) => onUpdateConfig({ preview_images: newImgs })}
          folder="samples/pages"
          aspectRatioHint="Khổ A4 dọc tỉ lệ 1:1.414"
        />
      </div>
    );
  }

  // ==========================================
  // 10. CHUYỂN ĐỔI & CTA (bottom_cta, combo_bottom_cta, gift_donate_cta)
  // ==========================================
  if (block.type === 'bottom_cta' || block.type === 'combo_bottom_cta') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chữ trên nút đặt hàng</label>
            <input
              type="text"
              value={cfg.btn_title || 'ĐẶT MUA NGAY'}
              onChange={(e) => onUpdateConfig({ btn_title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Badge giảm giá / Ưu đãi</label>
            <input
              type="text"
              value={cfg.discount_text || cfg.discount_badge || 'Giảm tới 25%'}
              onChange={(e) => onUpdateConfig({ discount_text: e.target.value, discount_badge: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Dòng ghi chú / Cảm ơn chân trang</label>
          <input
            type="text"
            value={cfg.note_text || cfg.thank_you_text || ''}
            onChange={(e) => onUpdateConfig({ note_text: e.target.value, thank_you_text: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="Cảm ơn Quý Thầy/Cô đã đồng hành cùng Huy Tutor."
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // KHỐI KHUNG ẢNH & CHIẾN DỊCH (CAMPAIGN FRAME)
  // ==========================================
  if (block.type === 'campaign_frame') {
    const frameType = cfg.frame_type || 'preset';
    const presetName = cfg.preset_name || 'sale';
    const scope = cfg.scope || 'global';
    const appliedIds: string[] = Array.isArray(cfg.applied_product_ids) ? cfg.applied_product_ids : [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề chiến dịch</label>
            <input
              type="text"
              value={cfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="CHIẾN DỊCH KHUYẾN MÃI ĐẶC BIỆT"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Mô tả phụ</label>
            <input
              type="text"
              value={cfg.subtitle || ''}
              onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Khung ảnh ưu đãi giới hạn áp dụng độc quyền"
            />
          </div>
        </div>

        {/* Chế độ Khung Đè: Preset vs Custom R2 */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-3">
          <label className="block font-black text-xs text-gray-800 uppercase">
            Loại Khung Đè Chiến Dịch:
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdateConfig({ frame_type: 'preset' })}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition border ${
                frameType === 'preset'
                  ? 'bg-[#e60049] text-white border-[#e60049]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Preset Có Sẵn (Vector Hi-Res)
            </button>
            <button
              type="button"
              onClick={() => onUpdateConfig({ frame_type: 'custom' })}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition border ${
                frameType === 'custom'
                  ? 'bg-[#e60049] text-white border-[#e60049]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Tải PNG Trong Suốt Lên R2
            </button>
          </div>

          {frameType === 'preset' ? (
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Chọn mẫu Preset:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'tet', label: 'Tết Mừng Xuân' },
                  { key: 'sale', label: 'Siêu Sale Giảm Sốc' },
                  { key: 'exam', label: 'Mùa Thi Quyết Thắng' },
                  { key: 'christmas', label: 'Giáng Sinh Rực Rỡ' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onUpdateConfig({ preset_name: p.key })}
                    className={`py-1.5 px-2 rounded text-xs font-bold border transition ${
                      presetName === p.key
                        ? 'border-[#e60049] bg-pink-50 text-[#e60049]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <R2ImageUploader
              label="Tải lên khung đè PNG trong suốt (Cloudflare R2)"
              imageUrl={cfg.custom_frame_url}
              onUrlChange={(url: string) => onUpdateConfig({ custom_frame_url: url })}
              folder="campaign"
            />
          )}
        </div>

        {/* Phạm vi áp dụng & Tùy chọn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Phạm vi áp dụng khung</label>
            <select
              value={scope}
              onChange={(e) => onUpdateConfig({ scope: e.target.value as 'global' | 'specific' })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            >
              <option value="global">Toàn bộ sản phẩm trên trang (Global)</option>
              <option value="specific">Chỉ áp dụng cho các sản phẩm được tick chọn</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tỷ lệ khung ảnh (Aspect Ratio)</label>
            <select
              value={cfg.aspect_ratio || '3:4'}
              onChange={(e) => onUpdateConfig({ aspect_ratio: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            >
              <option value="3:4">3:4 (Chuẩn dọc bìa sách)</option>
              <option value="1:1">1:1 (Vuông)</option>
              <option value="4:3">4:3 (Ngang tiêu chuẩn)</option>
              <option value="16:9">16:9 (Rộng)</option>
              <option value="A4">A4 (Tài liệu học tập)</option>
            </select>
          </div>
        </div>

        {/* Nếu chọn specific: Danh sách sản phẩm */}
        {scope === 'specific' && (
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-1.5">
            <span className="block font-bold text-xs text-gray-700 mb-2">
              Chọn các sản phẩm áp dụng khung chiến dịch:
            </span>
            {allProducts.map((p) => {
              const isChecked = appliedIds.includes(p.id);
              return (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onUpdateConfig({ applied_product_ids: [...appliedIds, p.id] });
                      } else {
                        onUpdateConfig({ applied_product_ids: appliedIds.filter((id) => id !== p.id) });
                      }
                    }}
                    className="accent-[#e60049]"
                  />
                  <span className="text-xs text-gray-800">{p.title}</span>
                </label>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Nút bấm chuyển đổi (CTA)</label>
            <input
              type="text"
              value={cfg.cta_label || 'Khám phá ngay'}
              onChange={(e) => onUpdateConfig({ cta_label: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Đường dẫn liên kết (CTA URL)</label>
            <input
              type="text"
              value={cfg.cta_url || ''}
              onChange={(e) => onUpdateConfig({ cta_url: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="/combo-thpt hoặc /catalog"
            />
          </div>
        </div>
      </div>
    );
  }

  // Fallback editor cho các block khác
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-600 font-medium">
        Khối này đang sử dụng cấu hình mặc định. Bạn có thể tùy biến các trường JSON trực tiếp:
      </div>
      <textarea
        rows={6}
        value={JSON.stringify(cfg, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            onUpdateConfig(parsed);
          } catch {
            // Cho phép nhập dở
          }
        }}
        className="w-full font-mono text-xs border border-gray-300 rounded p-2 focus:border-[#e60049]"
      />
    </div>
  );
};
