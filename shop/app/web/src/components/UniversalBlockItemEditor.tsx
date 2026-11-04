import React from 'react';
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
  UniversalBlockItem,
  UniversalPageContext,
} from '../types';
import { R2ImageUploader } from './R2ImageUploader';

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
    return (
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Tiêu đề khu vực Accordion</label>
          <input
            type="text"
            value={accCfg.section_heading || ''}
            onChange={(e) => onUpdateConfig({ section_heading: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="Bản xem thử & Danh sách chuyên đề"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Các đề / chủ đề liệt kê (mỗi dòng một mục)</label>
          <textarea
            rows={5}
            value={(accCfg.accordions?.[0]?.items || []).join('\n')}
            onChange={(e) => {
              const items = e.target.value.split('\n').filter((l) => l.trim().length > 0);
              onUpdateConfig({
                accordions: [
                  {
                    id: 'acc_0',
                    title: accCfg.accordions?.[0]?.title || 'Danh sách chủ đề',
                    default_open: true,
                    items,
                  },
                ],
              });
            }}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            placeholder="Đề 01: Khởi động cơ bản&#10;Đề 02: Tăng tốc nâng cao..."
          />
        </div>
      </div>
    );
  }

  if (block.type === 'sample_groups') {
    const sampleCfg = cfg as SampleGroupsBlockConfig;
    const currentGroup = sampleCfg.groups?.[0];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề nhóm đọc thử</label>
            <input
              type="text"
              value={currentGroup?.title || ''}
              onChange={(e) => {
                const groups = [...(sampleCfg.groups || [])];
                if (!groups[0]) {
                  groups[0] = { id: 'g0', title: '', images: [], media_type: 'images', sort_order: 1, is_active: true };
                }
                groups[0].title = e.target.value;
                onUpdateConfig({ groups });
              }}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Demo đề thi / Demo đáp án"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chữ Watermark bảo vệ bản quyền</label>
            <input
              type="text"
              value={currentGroup?.watermark_text || 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN'}
              onChange={(e) => {
                const groups = [...(sampleCfg.groups || [])];
                if (!groups[0]) {
                  groups[0] = { id: 'g0', title: '', images: [], media_type: 'images', sort_order: 1, is_active: true };
                }
                groups[0].watermark_text = e.target.value;
                onUpdateConfig({ groups });
              }}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-2">
            Danh sách các trang ảnh đọc thử A4 ({currentGroup?.images?.length || 0} trang)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(currentGroup?.images || []).map((imgUrl, imgIdx) => (
              <div key={imgIdx} className="relative border rounded p-1 bg-gray-50">
                <img src={imgUrl} alt={`Trang ${imgIdx + 1}`} className="w-full h-28 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => {
                    const groups = [...(sampleCfg.groups || [])];
                    if (groups[0]) {
                      groups[0].images = groups[0].images.filter((_, i) => i !== imgIdx);
                      onUpdateConfig({ groups });
                    }
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow"
                  title="Xóa trang này"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <R2ImageUploader
              label="+ Thêm trang ảnh mẫu A4 mới (Cloudflare R2)"
              onUrlChange={(url) => {
                if (!url) return;
                const groups = [...(sampleCfg.groups || [])];
                if (!groups[0]) {
                  groups[0] = { id: 'g0', title: 'Demo', images: [], media_type: 'images', sort_order: 1, is_active: true };
                }
                groups[0].images = [...(groups[0].images || []), url];
                onUpdateConfig({ groups });
              }}
              folder="samples/pages"
              aspectRatioHint="Khổ A4 dọc tỉ lệ 1:1.414"
            />
          </div>
        </div>
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
