import { buildProductUrl } from '../utils/urlHelper';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { ReorderableProductSelector } from './ReorderableProductSelector';
import {
  BottomCtaBlockConfig,
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
  FlashcardIndividualPackageItem,
  FlashcardPricingBlockConfig,
  GiftAnchorItem,
  GiftCrossSellConfig,
  GiftDonateCtaConfig,
  GiftFormEmbedConfig,
  GiftHeroAnchorsConfig,
  HomepageBottomBannerConfig,
  HomepageCategoriesGridConfig,
  HomepageCategoryTile,
  HomepageHeroConfig,
  HomepageNoticeTextConfig,
  HomepageSectionGroup,
  HomepageSectionGroupsConfig,
  HomepageSectionItem,
  HomepageTopBannerConfig,
  Product,
  ProductHeroBlockConfig,
  ProductIntroBlockConfig,
  ProductSpec,
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
import { CustomHtmlBlockEditor } from './CustomHtmlBlockEditor';

// =========================================================================
// CategoriesGridBlockEditor: Trình soạn thảo Lưới Danh Mục Trang Chủ
// =========================================================================
const CategoriesGridBlockEditor: React.FC<{
  gridCfg: HomepageCategoriesGridConfig;
  onUpdateConfig: (partial: any) => void;
}> = ({ gridCfg, onUpdateConfig }) => {
  const items = Array.isArray(gridCfg.items) ? gridCfg.items : [];

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onUpdateConfig({ items: next });
  };

  const deleteItem = (index: number) => {
    const itemToDelete = items[index];
    if (itemToDelete?.image_url) {
      apiClient.deleteR2File(itemToDelete.image_url).catch(() => {});
    }
    onUpdateConfig({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-bold text-gray-700 mb-1">Tiêu đề lưới danh mục</label>
        <input
          type="text"
          value={gridCfg.title || ''}
          onChange={(e) => onUpdateConfig({ title: e.target.value })}
          className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
          placeholder="Danh mục sản phẩm"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800">
            Các ô danh mục hiển thị ({items.length} ô):
          </span>
          <button
            type="button"
            onClick={() => {
              const newItem: HomepageCategoryTile = {
                id: `cat_${Date.now()}`,
                category_slug: '',
                label: 'Danh mục mới',
                icon_code: '',
                image_url: '',
                to: '',
                is_active: true,
              };
              onUpdateConfig({ items: [...items, newItem] });
            }}
            className="text-[11px] font-bold text-[#e60049] bg-white hover:bg-pink-50 border border-pink-200 px-3 py-1 rounded cursor-pointer shadow-2xs transition"
          >
            + Thêm ô danh mục
          </button>
        </div>

        <div className="space-y-4">
          {items.map((it, idx) => (
            <div key={it.id || idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3 text-xs shadow-2xs">
              {/* Header thanh công cụ của từng ô: Thứ tự, Tiêu đề, Đổi chỗ Lên/Xuống, Bật/Tắt, Xóa */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#e60049] text-white flex items-center justify-center font-black text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-gray-800 text-xs truncate max-w-[180px]">
                    {it.label || 'Chưa đặt tên'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Nút Lên / Xuống */}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, 'up')}
                    title="Di chuyển lên trên"
                    className="px-2 py-0.5 border border-gray-300 rounded bg-white text-gray-700 hover:border-[#e60049] disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, 'down')}
                    title="Di chuyển xuống dưới"
                    className="px-2 py-0.5 border border-gray-300 rounded bg-white text-gray-700 hover:border-[#e60049] disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    ▼
                  </button>

                  {/* Nút Bật / Tắt kích hoạt */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...items];
                      next[idx] = { ...next[idx], is_active: next[idx].is_active === false ? true : false };
                      onUpdateConfig({ items: next });
                    }}
                    className={`px-2 py-0.5 rounded font-bold text-[11px] border transition ${
                      it.is_active !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-gray-100 text-gray-400 border-gray-300'
                    }`}
                  >
                    {it.is_active !== false ? '👁️ Hiển thị' : '🚫 Đang ẩn'}
                  </button>

                  {/* Nút Xóa */}
                  <button
                    type="button"
                    onClick={() => deleteItem(idx)}
                    title="Xóa ô danh mục này"
                    className="text-red-600 hover:text-red-800 font-bold px-2 py-0.5 border border-red-200 rounded hover:bg-red-50 bg-white"
                  >
                    ✕ Xóa
                  </button>
                </div>
              </div>

              {/* Tải ảnh danh mục lên Cloudflare R2 (Bắt buộc 100% ảnh R2) */}
              <div className="pt-1">
                <R2ImageUploader
                  label="Tải ảnh danh mục lên Cloudflare R2 (Bắt buộc)"
                  helperText="Tải ảnh biểu tượng danh mục. Nếu chưa tải ảnh, hệ thống hiển thị ô placeholder trung tính."
                  imageUrl={it.image_url || ''}
                  onUrlChange={(url) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], image_url: url };
                    onUpdateConfig({ items: next });
                  }}
                  folder="homepage/categories"
                  aspectRatioHint="Ảnh vuông 1:1, PNG trong suốt hoặc WebP"
                  maxPreviewHeight="max-h-24"
                  fitMode="contain"
                />
              </div>

              {/* Các trường cấu hình văn bản */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Tên hiển thị</label>
                  <input
                    type="text"
                    value={it.label}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], label: e.target.value };
                      onUpdateConfig({ items: next });
                    }}
                    placeholder="VD: Tài liệu THPT"
                    className="w-full font-bold border border-gray-300 rounded px-2 py-1 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Slug danh mục</label>
                  <input
                    type="text"
                    value={it.category_slug}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], category_slug: e.target.value };
                      onUpdateConfig({ items: next });
                    }}
                    placeholder="high-school"
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Đường dẫn đích (URL)</label>
                  <input
                    type="text"
                    value={it.to}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], to: e.target.value };
                      onUpdateConfig({ items: next });
                    }}
                    placeholder="/high-school"
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SectionGroupsBlockEditor: Trình soạn thảo Nhóm Tài Liệu & Sách 3D Trang Chủ
// =========================================================================
const SectionGroupsBlockEditor: React.FC<{
  secCfg: HomepageSectionGroupsConfig;
  onUpdateConfig: (partial: any) => void;
  allProducts: Product[];
  context?: UniversalPageContext;
}> = ({ secCfg, onUpdateConfig, allProducts, context }) => {
  const sections = Array.isArray(secCfg.sections) ? secCfg.sections : [];

  // Danh sách sản phẩm khả dụng
  const initialProducts =
    allProducts && allProducts.length > 0
      ? allProducts
      : context?.allProducts && context.allProducts.length > 0
      ? context.allProducts
      : [];

  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [pickingForSectionIndex, setPickingForSectionIndex] = useState<number | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  useEffect(() => {
    if (productsList.length === 0) {
      apiClient
        .getCatalogInit()
        .then((res) => {
          if (Array.isArray(res?.products)) {
            setProductsList(res.products);
          }
        })
        .catch((err) => {
          console.warn('Lỗi tải sản phẩm cho bộ chọn:', err);
        });
    }
  }, [productsList.length]);

  // Cập nhật mảng sections
  const updateSections = (nextSections: HomepageSectionGroup[]) => {
    onUpdateConfig({ sections: nextSections });
  };

  // Di chuyển nhóm lên / xuống
  const moveSection = (sIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? sIdx - 1 : sIdx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const next = [...sections];
    const temp = next[sIdx];
    next[sIdx] = next[targetIdx];
    next[targetIdx] = temp;
    updateSections(next);
  };

  // Bật/tắt nhóm
  const toggleSectionActive = (sIdx: number) => {
    const next = [...sections];
    next[sIdx] = {
      ...next[sIdx],
      is_active: next[sIdx].is_active === false ? true : false,
    };
    updateSections(next);
  };

  // Xóa nhóm
  const deleteSection = (sIdx: number) => {
    const secToDelete = sections[sIdx];
    if (Array.isArray(secToDelete?.items)) {
      secToDelete.items.forEach((it) => {
        if (it.image_url) apiClient.deleteR2File(it.image_url).catch(() => {});
      });
    }
    updateSections(sections.filter((_, i) => i !== sIdx));
  };

  // Thêm nhóm mới
  const addSection = () => {
    const newSec: HomepageSectionGroup = {
      id: `sec_${Date.now()}`,
      title: 'Nhóm tài liệu mới',
      is_active: true,
      sort_order: sections.length + 1,
      items: [],
    };
    updateSections([...sections, newSec]);
  };

  // Di chuyển sách trong nhóm lên / xuống
  const moveBook = (sIdx: number, iIdx: number, direction: 'up' | 'down') => {
    const sec = sections[sIdx];
    const items = Array.isArray(sec.items) ? [...sec.items] : [];
    const targetIdx = direction === 'up' ? iIdx - 1 : iIdx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const temp = items[iIdx];
    items[iIdx] = items[targetIdx];
    items[targetIdx] = temp;
    const nextSections = [...sections];
    nextSections[sIdx] = { ...sec, items };
    updateSections(nextSections);
  };

  // Bật/tắt kích hoạt sách
  const toggleBookActive = (sIdx: number, iIdx: number) => {
    const sec = sections[sIdx];
    const items = Array.isArray(sec.items) ? [...sec.items] : [];
    items[iIdx] = {
      ...items[iIdx],
      is_active: items[iIdx].is_active === false ? true : false,
    };
    const nextSections = [...sections];
    nextSections[sIdx] = { ...sec, items };
    updateSections(nextSections);
  };

  // Xóa sách trong nhóm
  const deleteBook = (sIdx: number, iIdx: number) => {
    const sec = sections[sIdx];
    const items = Array.isArray(sec.items) ? [...sec.items] : [];
    const itemToDelete = items[iIdx];
    if (itemToDelete?.image_url) {
      apiClient.deleteR2File(itemToDelete.image_url).catch(() => {});
    }
    const nextSections = [...sections];
    nextSections[sIdx] = { ...sec, items: items.filter((_, i) => i !== iIdx) };
    updateSections(nextSections);
  };

  // Cập nhật thuộc tính của sách
  const updateBook = (sIdx: number, iIdx: number, patch: Partial<HomepageSectionItem>) => {
    const sec = sections[sIdx];
    const items = Array.isArray(sec.items) ? [...sec.items] : [];
    items[iIdx] = { ...items[iIdx], ...patch };
    const nextSections = [...sections];
    nextSections[sIdx] = { ...sec, items };
    updateSections(nextSections);
  };

  // Thêm sách thủ công
  const addBookManual = (sIdx: number) => {
    const sec = sections[sIdx];
    const items = Array.isArray(sec.items) ? [...sec.items] : [];
    const newItem: HomepageSectionItem = {
      id: `item_${Date.now()}`,
      display_title: 'Tài liệu mới',
      image_url: '',
      target_url: '/high-school',
      badge_text: '',
      tag_text: '',
      is_active: true,
      sort_order: items.length + 1,
    };
    const nextSections = [...sections];
    nextSections[sIdx] = { ...sec, items: [...items, newItem] };
    updateSections(nextSections);
  };

  // Thêm sách từ sản phẩm có sẵn
  const addProductToSection = (sIdx: number, p: Product) => {
    const sec = sections[sIdx];
    const items = Array.isArray(sec.items) ? [...sec.items] : [];
    const targetUrl = buildProductUrl(p.category_slug, p.slug);
    const newItem: HomepageSectionItem = {
      id: `item_${Date.now()}_${p.id || p.slug}`,
      display_title: p.title,
      image_url: p.thumbnail_url || '',
      target_url: targetUrl,
      badge_text: '',
      tag_text: '',
      is_active: true,
      sort_order: items.length + 1,
    };
    const nextSections = [...sections];
    nextSections[sIdx] = { ...sec, items: [...items, newItem] };
    updateSections(nextSections);
    setPickingForSectionIndex(null);
    setProductSearchTerm('');
  };

  // Lọc sản phẩm tìm kiếm
  const filteredProducts = productsList.filter((p) => {
    if (!productSearchTerm.trim()) return true;
    const term = productSearchTerm.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(term) ||
      (p.code || '').toLowerCase().includes(term) ||
      (p.slug || '').toLowerCase().includes(term) ||
      (p.category_slug || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-extrabold text-[#e60049] uppercase">
            [NHÓM TÀI LIỆU & SẢN PHẨM] - Quản lý các nhóm chuyên mục nổi bật, bìa sách 3D, nút Đọc thử và liên kết điều hướng
          </span>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Tổng cộng: <strong>{sections.length} nhóm</strong> hiển thị trên trang chủ
          </p>
        </div>
        <button
          type="button"
          onClick={addSection}
          className="text-xs font-bold text-white bg-[#e60049] hover:bg-[#cc0041] px-3.5 py-1.5 rounded-sm cursor-pointer shadow-xs transition"
        >
          + Thêm nhóm chuyên mục
        </button>
      </div>

      {sections.map((sec, sIdx) => {
        const secItems = Array.isArray(sec.items) ? sec.items : [];
        const isSelectorOpen = pickingForSectionIndex === sIdx;

        return (
          <div
            key={sec.id || sIdx}
            className="border-2 border-pink-200 rounded-lg p-4 bg-white space-y-4 shadow-xs"
          >
            {/* Header Nhóm chuyên mục */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3 bg-pink-50/50 -m-4 mb-3 p-4 rounded-t-lg">
              <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                <span className="w-6 h-6 rounded-full bg-[#e60049] text-white flex items-center justify-center font-black text-xs shrink-0">
                  {sIdx + 1}
                </span>
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => {
                    const next = [...sections];
                    next[sIdx] = { ...next[sIdx], title: e.target.value };
                    updateSections(next);
                  }}
                  className="font-extrabold text-sm border border-gray-300 rounded px-2.5 py-1 bg-white flex-1 focus:border-[#e60049]"
                  placeholder="Tiêu đề nhóm (VD: TÀI LIỆU LUYỆN THI THPT QUỐC GIA)"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Đổi thứ tự nhóm */}
                <button
                  type="button"
                  disabled={sIdx === 0}
                  onClick={() => moveSection(sIdx, 'up')}
                  title="Di chuyển nhóm lên trên"
                  className="px-2.5 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:border-[#e60049] disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs"
                >
                  ▲ Lên
                </button>
                <button
                  type="button"
                  disabled={sIdx === sections.length - 1}
                  onClick={() => moveSection(sIdx, 'down')}
                  title="Di chuyển nhóm xuống dưới"
                  className="px-2.5 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:border-[#e60049] disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs"
                >
                  ▼ Xuống
                </button>

                {/* Bật / Tắt kích hoạt nhóm */}
                <button
                  type="button"
                  onClick={() => toggleSectionActive(sIdx)}
                  className={`px-2.5 py-1 rounded font-bold text-xs border transition ${
                    sec.is_active !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-gray-100 text-gray-400 border-gray-300'
                  }`}
                >
                  {sec.is_active !== false ? '👁️ Hiển thị' : '🚫 Đang ẩn'}
                </button>

                {/* Xóa nhóm */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc muốn xóa nhóm "${sec.title || 'này'}" cùng toàn bộ sách bên trong?`)) {
                      deleteSection(sIdx);
                    }
                  }}
                  className="text-red-600 hover:bg-red-50 text-xs font-bold px-2.5 py-1 border border-red-200 rounded bg-white"
                >
                  ✕ Xóa nhóm
                </button>
              </div>
            </div>

            {/* Thanh công cụ thêm sách cho nhóm */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs font-bold text-gray-800">
                Danh sách tài liệu trong nhóm ({secItems.length} tài liệu):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPickingForSectionIndex(isSelectorOpen ? null : sIdx);
                    setProductSearchTerm('');
                  }}
                  className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded transition"
                >
                  {isSelectorOpen ? '✕ Đóng bộ chọn' : '🛒 + Thêm từ sản phẩm có sẵn trong Shop'}
                </button>
                <button
                  type="button"
                  onClick={() => addBookManual(sIdx)}
                  className="text-xs font-bold text-[#e60049] bg-pink-50 hover:bg-pink-100 border border-pink-200 px-3 py-1 rounded transition"
                >
                  ✏️ + Thêm tài liệu tùy biến thủ công
                </button>
              </div>
            </div>

            {/* Drawer / Hộp thoại chọn sản phẩm từ Shop */}
            {isSelectorOpen && (
              <div className="border border-purple-300 bg-purple-50/40 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-purple-900 uppercase">
                    Chọn sản phẩm để tự động điền thông tin (Tiêu đề, Bìa 3D, Link, Badge, Tag):
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickingForSectionIndex(null)}
                    className="text-gray-500 hover:text-gray-700 font-bold text-xs"
                  >
                    ✕ Đóng
                  </button>
                </div>
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  placeholder="Gõ tìm kiếm tên sách, mã sản phẩm hoặc slug..."
                  className="w-full border border-purple-300 rounded px-2.5 py-1.5 bg-white text-xs focus:border-purple-600 focus:outline-hidden"
                  autoFocus
                />
                <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-purple-100 bg-white rounded border border-purple-200 p-2">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-500">
                      Không tìm thấy sản phẩm nào phù hợp với từ khóa.
                    </div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id || p.slug}
                        onClick={() => addProductToSection(sIdx, p)}
                        className="flex items-center justify-between gap-3 p-2 hover:bg-purple-50 rounded cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {p.thumbnail_url ? (
                            <img
                              src={p.thumbnail_url}
                              alt=""
                              className="w-9 h-12 object-contain rounded border border-gray-200 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-9 h-12 rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[9px] text-gray-400 shrink-0">
                              3D
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-gray-900 truncate">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono bg-gray-100 px-1 rounded">{p.slug}</span>
                              {p.cover_tag && (
                                <span className="bg-red-50 text-red-600 px-1 rounded font-bold">
                                  {p.cover_tag}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#e60049] shrink-0">
                          + Chọn sách này
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Danh sách các tài liệu trong nhóm */}
            <div className="space-y-3">
              {secItems.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-300 rounded-md bg-gray-50 text-xs text-gray-500">
                  Nhóm này chưa có tài liệu nào. Bấm <strong>"+ Thêm từ sản phẩm có sẵn"</strong> hoặc <strong>"+ Thêm tài liệu tùy biến"</strong> ở trên để thêm sách.
                </div>
              ) : (
                secItems.map((it, iIdx) => (
                  <div
                    key={it.id || iIdx}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50/80 space-y-3 text-xs shadow-2xs"
                  >
                    {/* Header Item */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-gray-500">#{iIdx + 1}</span>
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt=""
                            className="w-7 h-9 object-contain rounded border border-gray-300 bg-white shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-9 rounded border border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-[9px] text-gray-400 shrink-0">
                            3D
                          </div>
                        )}
                        <span className="font-bold text-gray-900 truncate">
                          {it.display_title || 'Tài liệu chưa đặt tên'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={iIdx === 0}
                          onClick={() => moveBook(sIdx, iIdx, 'up')}
                          title="Di chuyển lên trên"
                          className="px-2 py-0.5 border border-gray-300 rounded bg-white text-gray-700 hover:border-[#e60049] disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={iIdx === secItems.length - 1}
                          onClick={() => moveBook(sIdx, iIdx, 'down')}
                          title="Di chuyển xuống dưới"
                          className="px-2 py-0.5 border border-gray-300 rounded bg-white text-gray-700 hover:border-[#e60049] disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBookActive(sIdx, iIdx)}
                          className={`px-2 py-0.5 rounded font-bold text-[11px] border transition ${
                            it.is_active !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-gray-100 text-gray-400 border-gray-300'
                          }`}
                        >
                          {it.is_active !== false ? '👁️' : '🚫'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBook(sIdx, iIdx)}
                          title="Xóa tài liệu này"
                          className="text-red-600 hover:text-red-800 font-bold px-2 py-0.5 border border-red-200 rounded hover:bg-red-50 bg-white"
                        >
                          ✕ Xóa
                        </button>
                      </div>
                    </div>

                    {/* Chi tiết Item: Grid 2 cột */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* Cột 1: Thông tin văn bản */}
                      <div className="md:col-span-7 space-y-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                            Tên tài liệu hiển thị
                          </label>
                          <input
                            type="text"
                            value={it.display_title}
                            onChange={(e) => updateBook(sIdx, iIdx, { display_title: e.target.value })}
                            placeholder="VD: 30 đề thi thử ngôn ngữ Anh - Đánh giá năng lực Bộ Công an"
                            className="w-full font-bold border border-gray-300 rounded px-2.5 py-1 bg-white focus:border-[#e60049]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                            Đường dẫn điều hướng (URL chi tiết hoặc link ngoài)
                          </label>
                          <input
                            type="text"
                            value={it.target_url}
                            onChange={(e) => updateBook(sIdx, iIdx, { target_url: e.target.value })}
                            placeholder="/high-school/dgnlbca"
                            className="w-full border border-gray-300 rounded px-2.5 py-1 bg-white font-mono text-[11px] focus:border-[#e60049]"
                          />
                        </div>
                      </div>

                      {/* Cột 2: Bộ tải ảnh bìa 3D Cloudflare R2 */}
                      <div className="md:col-span-5 bg-white border border-gray-200 rounded p-2.5">
                        <R2ImageUploader
                          label="Bìa sách 3D (Cloudflare R2)"
                          helperText="Khuyến nghị ảnh mockup 3D PNG trong suốt hoặc tỉ lệ 3:4. Có nút ✕ đỏ xóa vật lý vĩnh viễn trên R2."
                          imageUrl={it.image_url || ''}
                          onUrlChange={(url) => updateBook(sIdx, iIdx, { image_url: url })}
                          folder="homepage/books"
                          aspectRatioHint="Mockup 3D tỉ lệ 3:4 hoặc 4:5"
                          maxPreviewHeight="max-h-28"
                          fitMode="contain"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
  // KHỐI HTML TÙY BIẾN
  // ==========================================
  if (block.type === 'custom_html') {
    return (
      <CustomHtmlBlockEditor
        config={block.config || {}}
        onChange={(newCfg) => onUpdateConfig(newCfg)}
      />
    );
  }

  // ==========================================
  // 1. HERO TRANG CHỦ
  // ==========================================
  if (block.type === 'hero') {
    const heroCfg = cfg as HomepageHeroConfig;
    return (
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1 text-xs">
            Bố cục hiển thị (Hướng Chữ / Hình)
          </label>
          <select
            value={heroCfg.layout_direction || 'text_left_image_right'}
            onChange={(e) =>
              onUpdateConfig({
                layout_direction: e.target.value as 'text_left_image_right' | 'image_left_text_right',
              })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs font-medium"
          >
            <option value="text_left_image_right">Chữ bên trái — Hình bên phải (Mặc định)</option>
            <option value="image_left_text_right">Hình bên trái — Chữ bên phải</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Tiêu đề phụ / Dòng trên (font nhỏ, chữ đỏ)
            </label>
            <input
              type="text"
              value={heroCfg.subtitle || ''}
              onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Thầy Huy biên soạn: Sách tài liệu tiếng Anh"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Tiêu đề chính (Đỏ đậm, font lớn)
            </label>
            <input
              type="text"
              value={heroCfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049]"
              placeholder="Dạy & học tiếng Anh với tài nguyên"
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
          aspectRatioHint="Khuyến nghị ảnh chân dung PNG trong suốt hoặc tỉ lệ 1:1. Nếu để trống, hệ thống tự động hiển thị ảnh Thầy Huy mặc định."
        />
      </div>
    );
  }

  // ==========================================
  // KHỐI HERO CHI TIẾT SẢN PHẨM: product_hero
  // ==========================================
  if (block.type === 'product_hero') {
    const heroCfg = cfg as ProductHeroBlockConfig;
    const specs: ProductSpec[] = Array.isArray(heroCfg.specs) ? heroCfg.specs : [];

    const handleUpdateSpec = (idx: number, patch: Partial<ProductSpec>) => {
      const next = [...specs];
      next[idx] = { ...next[idx], ...patch };
      onUpdateConfig({ specs: next });
    };

    const handleAddSpec = () => {
      onUpdateConfig({
        specs: [...specs, { label: '', val: '' }],
      });
    };

    const handleRemoveSpec = (idx: number) => {
      onUpdateConfig({
        specs: specs.filter((_, i) => i !== idx),
      });
    };

    return (
      <div className="space-y-5">
        {/* Hàng 1: Tiêu đề & Chế độ hiển thị ảnh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Tiêu đề sản phẩm (để trống sẽ dùng tiêu đề sản phẩm thực tế)
            </label>
            <input
              type="text"
              value={heroCfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs font-semibold"
              placeholder="Đột phá đề thi THPTQG môn Tiếng Anh (B2-C2)..."
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Kiểu hiển thị ảnh bên trái
            </label>
            <select
              value={heroCfg.image_mode || 'card_box'}
              onChange={(e) => onUpdateConfig({ image_mode: e.target.value as 'card_box' | 'standalone' })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            >
              <option value="card_box">Khung thẻ Card Box bìa sách 3D kèm Tag chữ (Khuyên dùng)</option>
              <option value="standalone">Khung ảnh bìa độc lập (ProductImageFrame)</option>
            </select>
          </div>
        </div>

        {/* Hàng 2: Tải ảnh bìa R2 & Huy hiệu */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
          <div className="sm:col-span-8">
            <R2ImageUploader
              label="Ảnh bìa / Bìa sách 3D (Cloudflare R2)"
              imageUrl={heroCfg.image_url}
              onUrlChange={(url) => onUpdateConfig({ image_url: url })}
              folder="thumbnails"
              aspectRatioHint="Khuyến nghị ảnh mockup sách 3D trong suốt"
            />
          </div>

          <div className="sm:col-span-4 space-y-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Huy hiệu góc ảnh</label>
              <input
                type="text"
                value={heroCfg.badge_text || ''}
                onChange={(e) => onUpdateConfig({ badge_text: e.target.value })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
                placeholder="Mới / Bestseller / Hot"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Chữ ghi đè giá bán (tùy chọn)
              </label>
              <input
                type="text"
                value={heroCfg.price_override_text || ''}
                onChange={(e) => onUpdateConfig({ price_override_text: e.target.value })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
                placeholder="VD: Chỉ từ 130.000đ hoặc Miễn phí 100%"
              />
              <span className="text-[10px] text-gray-400 block mt-0.5">
                Để trống để hệ thống tự động hiển thị giá theo định dạng đang chọn.
              </span>
            </div>
          </div>
        </div>

        {/* Chữ mô tả trên thẻ Card Box */}
        {heroCfg.image_mode !== 'standalone' && (
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Chữ in trên thẻ Card Box (mỗi dòng một câu, dòng cuối sẽ in đậm kèm vạch đỏ)
            </label>
            <textarea
              rows={3}
              value={heroCfg.cover_tag || ''}
              onChange={(e) => onUpdateConfig({ cover_tag: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="Dành cho&#10;Kỳ thi THPTQG&#10;từ năm 2027"
            />
          </div>
        )}

        {/* Danh sách thông số gạch đầu dòng (specs) */}
        <div className="border border-gray-200 rounded-md p-3.5 bg-gray-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800">
              Danh sách thông số gạch đầu dòng ({specs.length} thông số):
            </span>
            <button
              type="button"
              onClick={handleAddSpec}
              className="text-[11px] font-bold text-[#e60049] bg-white hover:bg-pink-50 border border-pink-200 px-2 py-0.5 rounded cursor-pointer"
            >
              + Thêm thông số
            </button>
          </div>

          {specs.length > 0 ? (
            <div className="space-y-2">
              {specs.map((sp, sIdx) => (
                <div key={sIdx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sp.label || ''}
                    onChange={(e) => handleUpdateSpec(sIdx, { label: e.target.value })}
                    placeholder="Tên thông số (VD: Số trang / Định dạng / Cập nhật)"
                    className="w-1/3 border border-gray-300 rounded px-2 py-1 text-xs bg-white font-medium"
                  />
                  <input
                    type="text"
                    value={sp.val || ''}
                    onChange={(e) => handleUpdateSpec(sIdx, { val: e.target.value })}
                    placeholder="Giá trị (VD: 350 trang / File Word & PDF / Mới nhất 2026)"
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(sIdx)}
                    className="w-6 h-6 text-red-600 hover:bg-red-50 rounded flex items-center justify-center font-bold text-xs"
                    title="Xóa thông số này"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 italic">
              Chưa có thông số gạch đầu dòng nào. Bấm "+ Thêm thông số" để bổ sung thông số hiển thị bên dưới giá.
            </p>
          )}
        </div>

        {/* Cấu hình Nút Mua Hàng & Giỏ Hàng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-3">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chữ trên nút Đặt hàng chính</label>
            <input
              type="text"
              value={heroCfg.primary_cta_text || 'Đặt hàng'}
              onChange={(e) => onUpdateConfig({ primary_cta_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Hành động khi bấm nút chính</label>
            <select
              value={heroCfg.primary_cta_action || 'buy_now'}
              onChange={(e) =>
                onUpdateConfig({
                  primary_cta_action: e.target.value as 'buy_now' | 'add_to_cart' | 'custom_link',
                })
              }
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            >
              <option value="buy_now">Mở phân loại / Tiến hành thanh toán (Mua ngay)</option>
              <option value="add_to_cart">Mở phân loại / Thêm vào giỏ hàng</option>
              <option value="custom_link">Chuyển hướng tới đường link liên kết tùy chỉnh</option>
            </select>
          </div>
        </div>

        {heroCfg.primary_cta_action === 'custom_link' && (
          <div>
            <label className="block font-bold text-gray-700 mb-1">Đường dẫn liên kết tùy chỉnh</label>
            <input
              type="text"
              value={heroCfg.primary_cta_link || ''}
              onChange={(e) => onUpdateConfig({ primary_cta_link: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="https://... hoặc /combo-thpt"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Nút Thêm vào giỏ hàng</label>
            <label className="inline-flex items-center gap-2 pt-1 cursor-pointer text-xs font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={heroCfg.show_add_to_cart_button !== false}
                onChange={(e) => onUpdateConfig({ show_add_to_cart_button: e.target.checked })}
                className="accent-[#e60049] cursor-pointer"
              />
              <span>Hiển thị nút "Thêm vào giỏ hàng" bên cạnh nút chính</span>
            </label>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Bộ chọn định dạng</label>
            <label className="inline-flex items-center gap-2 pt-1 cursor-pointer text-xs font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={heroCfg.show_format_selector !== false}
                onChange={(e) => onUpdateConfig({ show_format_selector: e.target.checked })}
                className="accent-[#e60049] cursor-pointer"
              />
              <span>Hiển thị các nút định dạng (Word, PDF...) cạnh giá</span>
            </label>
          </div>
        </div>

        {/* Đường link phụ bên dưới nút */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-3">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chữ link phụ bên dưới nút</label>
            <input
              type="text"
              value={heroCfg.secondary_cta_text || ''}
              onChange={(e) => onUpdateConfig({ secondary_cta_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="VD: Mua combo ưu đãi"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Đường dẫn link phụ</label>
            <input
              type="text"
              value={heroCfg.secondary_cta_link || ''}
              onChange={(e) => onUpdateConfig({ secondary_cta_link: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="/combo-thpt"
            />
          </div>
        </div>
      </div>
    );
  }
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
    const currentSelectedIds: string[] = Array.isArray(secCfg.items)
      ? secCfg.items.map((it: any) => it.product_id || it.id?.replace(/^card_/, '') || it.id)
      : (cfg as any).groups?.[0]?.product_ids || [];

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

        <ReorderableProductSelector
          label="Chọn & Sắp xếp thứ tự tài liệu trong nhóm (Lưới 3 cột chuẩn)"
          selectedIds={currentSelectedIds}
          allProducts={allProducts}
          onChange={(newOrderedIds) => {
            const newItems = newOrderedIds.map((id) => {
              const found = allProducts.find((p) => p.id === id || p.slug === id);
              return {
                id: `card_${id}`,
                product_id: id,
                title: found?.title || 'Tài liệu',
                image_url: found?.thumbnail_url || '',
                badge_tag: found?.cover_tag || 'MỚI',
                target_url: found ? buildProductUrl(found.category_slug, found.slug) : '#',
              };
            });
            onUpdateConfig({ items: newItems, product_ids: newOrderedIds });
          }}
          helpText="Thứ tự từ trên xuống dưới tương ứng từ trái qua phải ngoài trang web. Dùng [▲] [▼] hoặc gõ số để đảo thứ tự."
        />
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
      title: accCfg.section_heading || 'Danh sách chủ đề',
      default_open: true,
      items: [],
    };
    const isDefaultOpen = currentAcc.default_open !== false;
    const currentTitle = currentAcc.title || accCfg.section_heading || 'Danh sách chủ đề';

    const updateAccordion = (patch: Partial<TopicAccordionBox>) => {
      onUpdateConfig({
        section_heading: patch.title !== undefined ? patch.title : accCfg.section_heading,
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
            <label className="block font-bold text-gray-700 mb-1">
              Tiêu đề thanh chủ đề (Hộp Accordion)
            </label>
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateConfig({
                  section_heading: val,
                  accordions: [
                    {
                      ...currentAcc,
                      title: val,
                    },
                  ],
                });
              }}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white font-bold text-gray-800"
              placeholder="Danh sách chủ đề / Danh sách 30 đề thi"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Tiêu đề này sẽ hiển thị trực tiếp trên thanh đóng/mở Accordion (chuẩn mẫu giao diện).
            </p>
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
    const isMasterDefaultOpen = sampleCfg.default_open !== false;
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
              default_open: true,
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
        default_open: true,
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
        {/* CẤU HÌNH ĐÓNG/MỞ KHỐI LỚN (MASTER COLLAPSE / EXPAND) */}
        <div className="p-4 bg-pink-50/50 border border-pink-200 rounded-md space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e60049]" />
            <h4 className="text-xs font-black uppercase text-[#e60049] tracking-wider">
              Cấu hình đóng / mở (Collapse / Expand) khối đọc thử
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Trạng thái mặc định của cả khối lớn (Master)
              </label>
              <div className="flex items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-gray-800">
                  <input
                    type="radio"
                    name="sample_master_default_state"
                    checked={isMasterDefaultOpen}
                    onChange={() => onUpdateConfig({ default_open: true })}
                    className="accent-[#e60049] cursor-pointer"
                  />
                  <span>Mặc định MỞ RỘNG cả khối (Expand)</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-gray-800">
                  <input
                    type="radio"
                    name="sample_master_default_state"
                    checked={!isMasterDefaultOpen}
                    onChange={() => onUpdateConfig({ default_open: false })}
                    className="accent-[#e60049] cursor-pointer"
                  />
                  <span>Mặc định THU GỌN cả khối (Collapse)</span>
                </label>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {isMasterDefaultOpen
                  ? 'Toàn bộ khu vực đọc thử sẽ hiển thị sẵn khi vào trang.'
                  : 'Toàn bộ khu vực đọc thử sẽ thu gọn lại, người xem bấm vào tiêu đề mới mở ra.'}
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Tiêu đề chung cho cả khối (tùy chọn)
              </label>
              <input
                type="text"
                value={sampleCfg.section_heading || ''}
                onChange={(e) => onUpdateConfig({ section_heading: e.target.value })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
                placeholder="VD: Bản đọc thử / Demo tài liệu (Để trống nếu chỉ hiện tiêu đề từng nhóm)"
              />
              <label className="inline-flex items-center gap-2 pt-2 cursor-pointer font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={sampleCfg.show_collapse_all_buttons !== false}
                  onChange={(e) => onUpdateConfig({ show_collapse_all_buttons: e.target.checked })}
                  className="accent-[#e60049] cursor-pointer"
                />
                <span>Hiển thị nút 'Mở rộng tất cả / Thu gọn tất cả' cho người xem</span>
              </label>

              <label className="inline-flex items-center gap-2 pt-1 cursor-pointer font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={sampleCfg.show_quick_anchor_nav !== false}
                  onChange={(e) => onUpdateConfig({ show_quick_anchor_nav: e.target.checked })}
                  className="accent-[#e60049] cursor-pointer"
                />
                <span>Hiển thị thanh nút nhảy nhanh (Demo đề thi, Demo đáp án...)</span>
              </label>
            </div>
          </div>
        </div>

        {/* LẶP TỪNG NHÓM ĐỌC THỬ (CON) */}
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
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white font-bold"
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

            {/* Trạng thái mở rộng / thu gọn riêng cho nhóm này */}
            <div className="bg-white border border-gray-200 rounded p-2.5 text-xs">
              <label className="block font-bold text-gray-700 mb-1">
                Trạng thái mặc định của nhóm "{group.title || `Nhóm ${groupIdx + 1}`}"
              </label>
              <div className="flex items-center gap-4 pt-0.5">
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-gray-800">
                  <input
                    type="radio"
                    name={`group_default_state_${groupIdx}`}
                    checked={group.default_open !== false}
                    onChange={() => handleUpdateGroup(groupIdx, { default_open: true })}
                    className="accent-[#e60049] cursor-pointer"
                  />
                  <span>Mặc định MỞ RỘNG (Expand)</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-gray-800">
                  <input
                    type="radio"
                    name={`group_default_state_${groupIdx}`}
                    checked={group.default_open === false}
                    onChange={() => handleUpdateGroup(groupIdx, { default_open: false })}
                    className="accent-[#e60049] cursor-pointer"
                  />
                  <span>Mặc định THU GỌN (Collapse)</span>
                </label>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Cho phép nhóm này mở sẵn hoặc thu gọn riêng biệt khi người dùng truy cập.
              </p>
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
                  placeholder="https://drive.google.com/file/d/.../preview hoặc URL đọc thử R2..."
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
  if (block.type === 'bottom_cta') {
    const bottomCfg = cfg as BottomCtaBlockConfig;
    return (
      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-gray-700 mb-1">
            Dòng chữ cảm ơn chân trang (hiển thị màu đen căn trái)
          </label>
          <input
            type="text"
            value={bottomCfg.thank_you_text !== undefined ? bottomCfg.thank_you_text : 'Cảm ơn Quý Thầy/Cô và các bạn đã tham khảo tài liệu này!'}
            onChange={(e) => onUpdateConfig({ thank_you_text: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white font-medium"
            placeholder="Cảm ơn Quý Thầy/Cô và các bạn đã tham khảo tài liệu này!"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Chữ trên nút Đặt Hàng (nút đỏ hồng)
            </label>
            <input
              type="text"
              value={bottomCfg.primary_button_text !== undefined ? bottomCfg.primary_button_text : 'Đặt hàng'}
              onChange={(e) => onUpdateConfig({ primary_button_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white font-bold"
              placeholder="Đặt hàng"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Hành động nút đặt hàng
            </label>
            <select
              value={bottomCfg.primary_button_action || 'buy_now'}
              onChange={(e) => onUpdateConfig({ primary_button_action: e.target.value as any })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white font-medium"
            >
              <option value="buy_now">Mua ngay (mở modal thanh toán / chọn format)</option>
              <option value="add_to_cart">Thêm vào giỏ hàng</option>
              <option value="custom_link">Điều hướng liên kết tùy chỉnh</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Chữ trên nút phụ (nút viền đen nền trắng)
            </label>
            <input
              type="text"
              value={bottomCfg.secondary_link_text !== undefined ? bottomCfg.secondary_link_text : 'Mua combo ưu đãi'}
              onChange={(e) => onUpdateConfig({ secondary_link_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
              placeholder="Mua combo ưu đãi (để trống nếu muốn ẩn)"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Đường dẫn nút phụ (mặc định: /combo-thpt)
            </label>
            <input
              type="text"
              value={bottomCfg.secondary_link_url || '/combo-thpt'}
              onChange={(e) => onUpdateConfig({ secondary_link_url: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white"
              placeholder="/combo-thpt"
            />
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'combo_bottom_cta') {
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

  // ==========================================
  // KHỐI SẢN PHẨM GỢI Ý: related_products
  // ==========================================
  if (block.type === 'related_products') {
    const relCfg = cfg as RelatedProductsBlockConfig;
    const mode = relCfg.mode || 'auto';
    const manualIds =
      (relCfg as any).product_ids ||
      (relCfg.items || []).map((it: any) => it.product_id || it.id) ||
      [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề khối gợi ý</label>
            <input
              type="text"
              value={relCfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="Tài liệu liên quan / Bạn có thể thích"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chế độ chọn sản phẩm</label>
            <select
              value={mode}
              onChange={(e) => onUpdateConfig({ mode: e.target.value as 'auto' | 'manual' })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            >
              <option value="auto">Tự động (Lấy các sản phẩm cùng chuyên mục)</option>
              <option value="manual">Thủ công (Chỉ định danh sách & thứ tự)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Số lượng sản phẩm hiển thị tối đa</label>
          <input
            type="number"
            min={1}
            max={12}
            value={relCfg.max_items || 3}
            onChange={(e) => onUpdateConfig({ max_items: parseInt(e.target.value) || 3 })}
            className="w-32 border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
          />
        </div>

        {mode === 'manual' && (
          <ReorderableProductSelector
            label="Chọn & Sắp xếp tài liệu liên quan thủ công"
            selectedIds={manualIds}
            allProducts={allProducts}
            onChange={(newOrderedIds) => {
              const newItems = newOrderedIds.map((id) => {
                const found = allProducts.find((p) => p.id === id || p.slug === id);
                return {
                  id,
                  product_id: id,
                  title: found?.title || 'Tài liệu',
                  image_url: found?.thumbnail_url || '',
                  badge_tag: found?.cover_tag || '',
                  target_url: found ? buildProductUrl(found.category_slug, found.slug) : '#',
                };
              });
              onUpdateConfig({ items: newItems, product_ids: newOrderedIds });
            }}
            helpText="Thứ tự hiển thị trên lưới tài liệu liên quan."
          />
        )}
      </div>
    );
  }

  // ==========================================
  // KHỐI GỢI Ý BÁN KÈM QUÀ TẶNG: gift_cross_sell
  // ==========================================
  if (block.type === 'gift_cross_sell') {
    const crossCfg = cfg as GiftCrossSellConfig;
    const selectedIds = crossCfg.product_ids || [];

    return (
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Tiêu đề phần bán kèm</label>
          <input
            type="text"
            value={crossCfg.heading || ''}
            onChange={(e) => onUpdateConfig({ heading: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            placeholder="Tài liệu trả phí nâng cao đề xuất"
          />
        </div>

        <ReorderableProductSelector
          label={`Chọn & Sắp xếp các sản phẩm bán kèm (${selectedIds.length} đã chọn)`}
          selectedIds={selectedIds}
          allProducts={allProducts}
          onChange={(newOrderedIds) => onUpdateConfig({ product_ids: newOrderedIds })}
          helpText="Thứ tự từ trên xuống dưới tương ứng từ trái qua phải trên khối bán kèm."
        />
      </div>
    );
  }

  // ==========================================
  // KHỐI KÊU GỌI ỦNG HỘ: gift_donate_cta
  // ==========================================
  if (block.type === 'gift_donate_cta') {
    const donateCfg = cfg as GiftDonateCtaConfig;
    return (
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Lời kêu gọi ủng hộ (Prompt text)</label>
          <textarea
            rows={3}
            value={donateCfg.prompt_text || ''}
            onChange={(e) => onUpdateConfig({ prompt_text: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            placeholder="Nếu tài liệu này hữu ích, bạn có thể ủng hộ tác giả ly cà phê..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chữ trên nút ủng hộ</label>
            <input
              type="text"
              value={donateCfg.button_text || 'Ủng hộ tác giả ☕'}
              onChange={(e) => onUpdateConfig({ button_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Đường dẫn liên kết (Target URL)</label>
            <input
              type="text"
              value={donateCfg.target_url || '/donate'}
              onChange={(e) => onUpdateConfig({ target_url: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="/donate"
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // KHỐI NHÚNG FORM QUÀ TẶNG: gift_form_embed
  // ==========================================
  if (block.type === 'gift_form_embed') {
    const formCfg = cfg as GiftFormEmbedConfig;
    return (
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Tiêu đề biểu mẫu</label>
          <input
            type="text"
            value={formCfg.form_title || ''}
            onChange={(e) => onUpdateConfig({ form_title: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            placeholder="Đăng ký nhận tài liệu quà tặng"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-9">
            <label className="block font-bold text-gray-700 mb-1">Link Google Form nhúng</label>
            <input
              type="text"
              value={formCfg.form_url || ''}
              onChange={(e) => onUpdateConfig({ form_url: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="https://docs.google.com/forms/d/e/.../viewform?embedded=true"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block font-bold text-gray-700 mb-1">Chiều cao khung (px)</label>
            <input
              type="number"
              min={300}
              max={2000}
              value={formCfg.iframe_height || 800}
              onChange={(e) => onUpdateConfig({ iframe_height: parseInt(e.target.value) || 800 })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // KHỐI THANH NHẢY NHANH: gift_hero_anchors
  // ==========================================
  if (block.type === 'gift_hero_anchors') {
    const ancCfg = cfg as GiftHeroAnchorsConfig;
    const anchors: GiftAnchorItem[] = Array.isArray(ancCfg.anchors) ? ancCfg.anchors : [];

    const handleUpdateAnchor = (idx: number, patch: Partial<GiftAnchorItem>) => {
      const next = [...anchors];
      next[idx] = { ...next[idx], ...patch };
      onUpdateConfig({ anchors: next });
    };

    const handleAddAnchor = () => {
      onUpdateConfig({
        anchors: [
          ...anchors,
          { id: `anc_${Date.now()}`, label: 'Mục mới', target_url: '#target' },
        ],
      });
    };

    const handleRemoveAnchor = (idx: number) => {
      onUpdateConfig({
        anchors: anchors.filter((_, i) => i !== idx),
      });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề chính</label>
            <input
              type="text"
              value={ancCfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="Tài liệu & Quà tặng miễn phí"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Mô tả phụ</label>
            <input
              type="text"
              value={ancCfg.subtitle || ''}
              onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="Chọn mục tài liệu bạn muốn nhận..."
            />
          </div>
        </div>

        <div className="border border-gray-200 rounded-md p-3 bg-gray-50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800">
              Danh sách nút nhảy nhanh ({anchors.length} nút):
            </span>
            <button
              type="button"
              onClick={handleAddAnchor}
              className="text-[11px] font-bold text-[#e60049] bg-white hover:bg-pink-50 border border-pink-200 px-2 py-0.5 rounded cursor-pointer"
            >
              + Thêm nút nhảy
            </button>
          </div>
          {anchors.map((anc, aIdx) => (
            <div key={anc.id || aIdx} className="flex items-center gap-2">
              <input
                type="text"
                value={anc.label}
                onChange={(e) => handleUpdateAnchor(aIdx, { label: e.target.value })}
                placeholder="Nhãn nút (VD: Đề thi thử)"
                className="w-1/2 border border-gray-300 rounded px-2 py-1 text-xs bg-white"
              />
              <input
                type="text"
                value={anc.target_url}
                onChange={(e) => handleUpdateAnchor(aIdx, { target_url: e.target.value })}
                placeholder="Link / Anchor (VD: #de-thi)"
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs bg-white"
              />
              <button
                type="button"
                onClick={() => handleRemoveAnchor(aIdx)}
                className="text-red-600 hover:bg-red-50 w-6 h-6 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // KHỐI LƯỚI DANH MỤC TRANG CHỦ: categories_grid
  // ==========================================
  if (block.type === 'categories_grid') {
    return (
      <CategoriesGridBlockEditor
        gridCfg={cfg as HomepageCategoriesGridConfig}
        onUpdateConfig={onUpdateConfig}
      />
    );
  }

  // ==========================================
  // KHỐI CÁC NHÓM CHUYÊN MỤC TRANG CHỦ: section_groups
  // ==========================================
  if (block.type === 'section_groups') {
    return (
      <SectionGroupsBlockEditor
        secCfg={cfg as HomepageSectionGroupsConfig}
        onUpdateConfig={onUpdateConfig}
        allProducts={allProducts}
        context={context}
      />
    );
  }

  // ==========================================
  // KHỐI BẢNG GIÁ FLASHCARD CÁ NHÂN: flashcard_pricing_packages
  // ==========================================
  if (block.type === 'flashcard_pricing_packages') {
    const priceCfg = cfg as FlashcardPricingBlockConfig;
    const pkgs = Array.isArray(priceCfg.packages) ? priceCfg.packages : [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề bảng giá</label>
            <input
              type="text"
              value={priceCfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="BẢNG GIÁ FLASHCARD CÁ NHÂN"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Mô tả quyền lợi chung</label>
            <input
              type="text"
              value={priceCfg.benefit_text || ''}
              onChange={(e) => onUpdateConfig({ benefit_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="Đầy đủ tính năng học thông minh Spaced Repetition"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800">
              Các gói Flashcard cá nhân ({pkgs.length} gói):
            </span>
            <button
              type="button"
              onClick={() => {
                const newPkg: FlashcardIndividualPackageItem = {
                  id: `pkg_${Date.now()}`,
                  label: 'Gói mới',
                  price: 99000,
                  badge_text: '',
                  is_popular: false,
                };
                onUpdateConfig({ packages: [...pkgs, newPkg] });
              }}
              className="text-[11px] font-bold text-[#e60049] bg-white hover:bg-pink-50 border border-pink-200 px-2 py-0.5 rounded"
            >
              + Thêm gói
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pkgs.map((pkg, idx) => (
              <div key={pkg.id || idx} className="border border-gray-200 rounded p-3 bg-gray-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={pkg.label}
                    onChange={(e) => {
                      const next = [...pkgs];
                      next[idx] = { ...next[idx], label: e.target.value };
                      onUpdateConfig({ packages: next });
                    }}
                    placeholder="Tên gói (VD: Gói 1 Năm)"
                    className="font-bold border border-gray-300 rounded px-2 py-1 bg-white flex-1 mr-2"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ packages: pkgs.filter((_, i) => i !== idx) })}
                    className="text-red-600 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold">Giá bán (VNĐ)</label>
                    <input
                      type="number"
                      value={pkg.price}
                      onChange={(e) => {
                        const next = [...pkgs];
                        next[idx] = { ...next[idx], price: parseInt(e.target.value) || 0 };
                        onUpdateConfig({ packages: next });
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold">Huy hiệu</label>
                    <input
                      type="text"
                      value={pkg.badge_text || ''}
                      onChange={(e) => {
                        const next = [...pkgs];
                        next[idx] = { ...next[idx], badge_text: e.target.value };
                        onUpdateConfig({ packages: next });
                      }}
                      placeholder="Phổ biến / Tiết kiệm"
                      className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={pkg.is_popular ?? false}
                    onChange={(e) => {
                      const next = [...pkgs];
                      next[idx] = { ...next[idx], is_popular: e.target.checked };
                      onUpdateConfig({ packages: next });
                    }}
                    className="accent-[#e60049]"
                  />
                  <span className="text-[11px] font-semibold text-gray-700">Đánh dấu gói Nổi bật (Viền hồng nổi)</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // KHỐI BẢNG GIÁ MUA THEO NHÓM: flashcard_group_pricing
  // ==========================================
  if (block.type === 'flashcard_group_pricing') {
    const grpCfg = cfg as FlashcardGroupPricingBlockConfig;
    const columns = grpCfg.columns || ['2 - 3 Người', '4 - 5 Người', '6 - 10 Người'];
    const tiers = grpCfg.tiers || [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề bảng giá nhóm</label>
            <input
              type="text"
              value={grpCfg.default_title || 'BẢNG GIÁ MUA THEO NHÓM'}
              onChange={(e) => onUpdateConfig({ default_title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chữ trên nút đăng ký nhóm</label>
            <input
              type="text"
              value={grpCfg.cta_button_text || 'Đăng ký nhóm ngay'}
              onChange={(e) => onUpdateConfig({ cta_button_text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Các cột số lượng nhóm (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            value={columns.join(', ')}
            onChange={(e) =>
              onUpdateConfig({
                columns: e.target.value.split(',').map((c) => c.trim()).filter(Boolean),
              })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            placeholder="2 - 3 Người, 4 - 5 Người, 6 - 10 Người"
          />
        </div>

        <div className="space-y-2">
          <label className="block font-bold text-gray-700">Các gói thời hạn ({tiers.length} gói):</label>
          {tiers.map((tr, idx) => (
            <div key={idx} className="flex items-center gap-2 border border-gray-200 rounded p-2 bg-gray-50 text-xs">
              <input
                type="text"
                value={tr.tier_name}
                onChange={(e) => {
                  const next = [...tiers];
                  next[idx] = { ...next[idx], tier_name: e.target.value };
                  onUpdateConfig({ tiers: next });
                }}
                className="w-32 border border-gray-300 rounded px-2 py-1 bg-white font-bold"
                placeholder="Tên gói (1 Tháng...)"
              />
              <input
                type="text"
                value={(tr.prices || []).join(', ')}
                onChange={(e) => {
                  const next = [...tiers];
                  next[idx] = {
                    ...next[idx],
                    prices: e.target.value.split(',').map((p) => p.trim()),
                  };
                  onUpdateConfig({ tiers: next });
                }}
                className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white"
                placeholder="Giá từng cột tương ứng (VD: 99.000đ, 89.000đ, 79.000đ)"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // KHỐI TÍNH NĂNG & DEMO FLASHCARD: flashcard_features
  // ==========================================
  if (block.type === 'flashcard_features') {
    const featCfg = cfg as FlashcardFeaturesBlockConfig;
    const features = featCfg.features || [];

    return (
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Màu nền khối tính năng</label>
          <input
            type="text"
            value={featCfg.bg_color || '#fafafa'}
            onChange={(e) => onUpdateConfig({ bg_color: e.target.value })}
            className="w-40 border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            placeholder="#fafafa"
          />
        </div>

        {/* Demo thẻ flashcard */}
        <div className="border border-gray-200 rounded-md p-3.5 bg-gray-50/50 space-y-3">
          <span className="block font-bold text-xs text-gray-800">Thẻ Flashcard Demo mô phỏng:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium text-gray-700 mb-0.5">Tiêu đề bài học / Unit</label>
              <input
                type="text"
                value={featCfg.demo_card?.unit_title || ''}
                onChange={(e) =>
                  onUpdateConfig({
                    demo_card: { ...(featCfg.demo_card || {}), unit_title: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                placeholder="Unit 1: Life Stories"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-0.5">Từ vựng (Word)</label>
              <input
                type="text"
                value={featCfg.demo_card?.word || ''}
                onChange={(e) =>
                  onUpdateConfig({
                    demo_card: { ...(featCfg.demo_card || {}), word: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded px-2 py-1 bg-white font-bold"
                placeholder="Perseverance"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-0.5">Phiên âm (Phonetic)</label>
              <input
                type="text"
                value={featCfg.demo_card?.phonetic || ''}
                onChange={(e) =>
                  onUpdateConfig({
                    demo_card: { ...(featCfg.demo_card || {}), phonetic: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                placeholder="/ˌpɜːsɪˈvɪərəns/"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-0.5">Định nghĩa / Nghĩa tiếng Việt</label>
              <input
                type="text"
                value={featCfg.demo_card?.meaning || ''}
                onChange={(e) =>
                  onUpdateConfig({
                    demo_card: { ...(featCfg.demo_card || {}), meaning: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                placeholder="Tính kiên trì, bền chí"
              />
            </div>
          </div>
        </div>

        {/* Danh sách các tính năng nổi bật */}
        <div>
          <label className="block font-bold text-gray-700 mb-1">
            Danh sách tính năng nổi bật (mỗi dòng một tính năng)
          </label>
          <textarea
            rows={5}
            value={features.join('\n')}
            onChange={(e) =>
              onUpdateConfig({
                features: e.target.value.split('\n').filter((l) => l.trim().length > 0),
              })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            placeholder="Thuật toán lặp lại ngắt quãng Spaced Repetition&#10;Phát âm chuẩn giọng bản xứ Anh - Mỹ&#10;Theo dõi tiến độ học tập hàng ngày..."
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // KHỐI CHÍNH SÁCH DÙNG THỬ: flashcard_free_tier
  // ==========================================
  if (block.type === 'flashcard_free_tier') {
    const freeCfg = cfg as FlashcardFreeTierBlockConfig;
    const rules = freeCfg.rules || [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề chính</label>
            <input
              type="text"
              value={freeCfg.title || ''}
              onChange={(e) => onUpdateConfig({ title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
              placeholder="Trải nghiệm Flashcard Miễn Phí"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề phần quy định</label>
            <input
              type="text"
              value={freeCfg.rules_title || 'Điều kiện & Quyền lợi dùng thử'}
              onChange={(e) => onUpdateConfig({ rules_title: e.target.value })}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Mô tả chi tiết</label>
          <textarea
            rows={3}
            value={freeCfg.description || ''}
            onChange={(e) => onUpdateConfig({ description: e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            placeholder="Bạn có thể học thử miễn phí các bộ từ vựng căn bản trước khi nâng cấp gói PRO..."
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">
            Các điều khoản / gạch đầu dòng (mỗi dòng một ý)
          </label>
          <textarea
            rows={4}
            value={rules.join('\n')}
            onChange={(e) =>
              onUpdateConfig({
                rules: e.target.value.split('\n').filter((l) => l.trim().length > 0),
              })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#e60049] bg-white text-xs"
            placeholder="Miễn phí trọn đời cho 2 bộ từ vựng đầu tiên&#10;Được truy cập đầy đủ âm thanh và ví dụ..."
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
