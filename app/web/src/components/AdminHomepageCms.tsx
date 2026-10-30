import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import {
  HomepageBottomBannerConfig,
  HomepageCategoriesGridConfig,
  HomepageCategoryTile,
  HomepageHeroConfig,
  HomepageNoticeTextConfig,
  HomepageSectionGroup,
  HomepageSectionGroupsConfig,
  HomepageSectionItem,
  HomepageTopBannerConfig,
} from '../types';
import {
  BottomBannerBlock,
  CategoriesGridBlock,
  HeroBlock,
  NoticeTextBlock,
  SectionGroupsBlock,
  TopBannerBlock,
} from './DynamicHomepageBlocks';

export const AdminHomepageCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, showToast } = useStore();

  const [activeBlock, setActiveBlock] = useState<
    'hero' | 'top_banner' | 'categories_grid' | 'section_groups' | 'notice_text' | 'bottom_banner'
  >('hero');

  // Toggle Live Preview Side-by-Side (Mặc định: tắt)
  const [isSideBySide, setIsSideBySide] = useState<boolean>(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Local draft states - strictly without fallback data
  const [heroDraft, setHeroDraft] = useState<HomepageHeroConfig>(() => ({
    mode: siteConfigs?.homepage_hero?.mode || 'structured',
    custom_html: siteConfigs?.homepage_hero?.custom_html || '',
    subtitle: siteConfigs?.homepage_hero?.subtitle || '',
    title: siteConfigs?.homepage_hero?.title || '',
    bullets: siteConfigs?.homepage_hero?.bullets || [],
    badge_left: siteConfigs?.homepage_hero?.badge_left || '',
    badge_right: siteConfigs?.homepage_hero?.badge_right || '',
    author_avatar_url: siteConfigs?.homepage_hero?.author_avatar_url || '',
    author_name: siteConfigs?.homepage_hero?.author_name || '',
    author_title: siteConfigs?.homepage_hero?.author_title || '',
    is_active: siteConfigs?.homepage_hero?.is_active ?? true,
  }));

  const [topBannerDraft, setTopBannerDraft] = useState<HomepageTopBannerConfig>(() => ({
    mode: siteConfigs?.homepage_top_banner?.mode || 'structured',
    custom_html: siteConfigs?.homepage_top_banner?.custom_html || '',
    tag: siteConfigs?.homepage_top_banner?.tag || '',
    title: siteConfigs?.homepage_top_banner?.title || '',
    subtitle: siteConfigs?.homepage_top_banner?.subtitle || '',
    cta_badge: siteConfigs?.homepage_top_banner?.cta_badge || '',
    link_url: siteConfigs?.homepage_top_banner?.link_url || '',
    header_label: siteConfigs?.homepage_top_banner?.header_label || '',
    books: siteConfigs?.homepage_top_banner?.books || [],
    is_active: siteConfigs?.homepage_top_banner?.is_active ?? true,
  }));

  const [categoriesGridDraft, setCategoriesGridDraft] =
    useState<HomepageCategoriesGridConfig>(() => ({
      title: siteConfigs?.homepage_categories_grid?.title || '',
      items: siteConfigs?.homepage_categories_grid?.items || [],
      is_active: siteConfigs?.homepage_categories_grid?.is_active ?? true,
    }));

  const [sectionGroupsDraft, setSectionGroupsDraft] =
    useState<HomepageSectionGroupsConfig>(() => ({
      sections: siteConfigs?.homepage_section_groups?.sections || [],
    }));

  const [noticeDraft, setNoticeDraft] = useState<HomepageNoticeTextConfig>(() => ({
    text: siteConfigs?.homepage_notice_text?.text || '',
    cta_button_text: siteConfigs?.homepage_notice_text?.cta_button_text || '',
    cta_button_link: siteConfigs?.homepage_notice_text?.cta_button_link || '',
    is_active: siteConfigs?.homepage_notice_text?.is_active ?? true,
  }));

  const [bottomBannerDraft, setBottomBannerDraft] =
    useState<HomepageBottomBannerConfig>(() => ({
      mode: siteConfigs?.homepage_bottom_banner?.mode || 'structured',
      custom_html: siteConfigs?.homepage_bottom_banner?.custom_html || '',
      custom_image_url: siteConfigs?.homepage_bottom_banner?.custom_image_url || '',
      link_url: siteConfigs?.homepage_bottom_banner?.link_url || '',
      tag: siteConfigs?.homepage_bottom_banner?.tag || '',
      title: siteConfigs?.homepage_bottom_banner?.title || '',
      badge_text: siteConfigs?.homepage_bottom_banner?.badge_text || '',
      books: siteConfigs?.homepage_bottom_banner?.books || [],
      is_active: siteConfigs?.homepage_bottom_banner?.is_active ?? true,
    }));

  // Sync draft states whenever siteConfigs updates from DB
  useEffect(() => {
    if (siteConfigs?.homepage_hero) {
      setHeroDraft(siteConfigs.homepage_hero);
    }
    if (siteConfigs?.homepage_top_banner) {
      setTopBannerDraft(siteConfigs.homepage_top_banner);
    }
    if (siteConfigs?.homepage_categories_grid) {
      setCategoriesGridDraft(siteConfigs.homepage_categories_grid);
    }
    if (siteConfigs?.homepage_section_groups) {
      setSectionGroupsDraft(siteConfigs.homepage_section_groups);
    }
    if (siteConfigs?.homepage_notice_text) {
      setNoticeDraft(siteConfigs.homepage_notice_text);
    }
    if (siteConfigs?.homepage_bottom_banner) {
      setBottomBannerDraft(siteConfigs.homepage_bottom_banner);
    }
  }, [siteConfigs]);

  // Handle direct file upload via API
  const handleUploadFile = async (
    file: File,
    onSuccess: (url: string) => void,
    fieldId: string
  ) => {
    setUploading(fieldId);
    try {
      const res = await apiClient.uploadFile(file);
      onSuccess(res.url);
      showToast('Tải ảnh lên thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải ảnh lên.');
    } finally {
      setUploading(null);
    }
  };

  const handleSaveCurrentBlock = async () => {
    setSaving(true);
    try {
      if (activeBlock === 'hero') {
        await updateSiteConfig('homepage_hero', heroDraft);
      } else if (activeBlock === 'top_banner') {
        await updateSiteConfig('homepage_top_banner', topBannerDraft);
      } else if (activeBlock === 'categories_grid') {
        await updateSiteConfig('homepage_categories_grid', categoriesGridDraft);
      } else if (activeBlock === 'section_groups') {
        await updateSiteConfig('homepage_section_groups', sectionGroupsDraft);
      } else if (activeBlock === 'notice_text') {
        await updateSiteConfig('homepage_notice_text', noticeDraft);
      } else if (activeBlock === 'bottom_banner') {
        await updateSiteConfig('homepage_bottom_banner', bottomBannerDraft);
      }
      showToast('Đã lưu cấu hình khối vào cơ sở dữ liệu thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu cấu hình khối.');
    } finally {
      setSaving(false);
    }
  };

  // Helper cho Quản lý Section Groups (Khung Tím)
  const handleAddSectionGroup = () => {
    const newGroup: HomepageSectionGroup = {
      id: `sec-${Date.now()}`,
      title: 'Nhóm tài liệu mới',
      is_active: true,
      sort_order: (sectionGroupsDraft.sections.length || 0) + 1,
      items: [],
    };
    setSectionGroupsDraft((prev) => ({
      ...prev,
      sections: [...prev.sections, newGroup],
    }));
  };

  const handleRemoveSectionGroup = (groupId: string) => {
    setSectionGroupsDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== groupId),
    }));
  };

  const handleAddItemToGroup = (groupId: string) => {
    const newItem: HomepageSectionItem = {
      id: `item-${Date.now()}`,
      display_title: 'Tên tài liệu hiển thị riêng',
      image_url: '',
      target_url: '/high-school',
      badge_text: 'Mới',
      tag_text: 'Luyện đề chi tiết',
      is_active: true,
      sort_order: 1,
    };

    setSectionGroupsDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id === groupId) {
          return {
            ...s,
            items: [...s.items, newItem],
          };
        }
        return s;
      }),
    }));
  };

  const handleRemoveItemFromGroup = (groupId: string, itemId: string) => {
    setSectionGroupsDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id === groupId) {
          return {
            ...s,
            items: s.items.filter((it) => it.id !== itemId),
          };
        }
        return s;
      }),
    }));
  };

  const handleUpdateItem = (
    groupId: string,
    itemId: string,
    updates: Partial<HomepageSectionItem>
  ) => {
    setSectionGroupsDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id === groupId) {
          return {
            ...s,
            items: s.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
          };
        }
        return s;
      }),
    }));
  };

  return (
    <div className="space-y-6">
      {/* CMS Header & Controls */}
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-gray-700">Khối giao diện:</label>
          <select
            value={activeBlock}
            onChange={(e) => setActiveBlock(e.target.value as any)}
            className="text-xs font-bold border border-gray-300 rounded px-3 py-1.5 focus:border-[#e60049] outline-none bg-white text-gray-800"
          >
            <option value="hero">1. Khung Đen (Hero Top Header)</option>
            <option value="top_banner">2. Khung Xanh Dương (Top Banner 90 đề)</option>
            <option value="categories_grid">3. Khung Vàng (Danh mục 6 ô vuông)</option>
            <option value="section_groups">4. Khung Tím (Nhóm cấp 1 &amp; Sản phẩm cấp 2)</option>
            <option value="notice_text">5. Dòng Chữ Xám (Thông báo &amp; CTA)</option>
            <option value="bottom_banner">6. Khung Nâu (Bottom Banner CT GDPT 2018)</option>
          </select>
        </div>

        {/* Live Preview Toggle & Save Button */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-700">
            <input
              type="checkbox"
              checked={isSideBySide}
              onChange={(e) => setIsSideBySide(e.target.checked)}
              className="rounded text-[#e60049] focus:ring-[#e60049] h-4 w-4"
            />
            <span>Bật Live Preview Side-by-Side</span>
          </label>

          <button
            type="button"
            onClick={handleSaveCurrentBlock}
            disabled={saving}
            className="bg-[#e60049] hover:bg-[#cc0041] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-sm shadow transition"
          >
            {saving ? 'Đang lưu...' : 'Lưu khối này vào DB'}
          </button>
        </div>
      </div>

      {/* Main CMS Layout: Single Panel vs Side-by-Side */}
      <div
        className={
          isSideBySide
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'
            : 'w-full max-w-[960px]'
        }
      >
        {/* Left Column: Form Controls */}
        <div
          className={
            isSideBySide
              ? 'lg:col-span-6 bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-6'
              : 'bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-6'
          }
        >
          {/* ============================================================== */}
          {/* 1. KHUNG ĐEN: HERO TOP */}
          {/* ============================================================== */}
          {activeBlock === 'hero' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-extrabold text-sm text-gray-900">
                  Cấu hình Khung Đen (Hero Top Header)
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroDraft.is_active}
                    onChange={(e) =>
                      setHeroDraft((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="rounded text-[#e60049]"
                  />
                  <span>Hiển thị trên web</span>
                </label>
              </div>

              {/* Mode switch: HTML vs Structured */}
              <div className="flex items-center gap-4 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hero_mode"
                    value="structured"
                    checked={heroDraft.mode === 'structured'}
                    onChange={() =>
                      setHeroDraft((prev) => ({ ...prev, mode: 'structured' }))
                    }
                  />
                  <span>Ảnh &amp; Chữ chuẩn (Khuyên dùng)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hero_mode"
                    value="custom_html"
                    checked={heroDraft.mode === 'custom_html'}
                    onChange={() =>
                      setHeroDraft((prev) => ({ ...prev, mode: 'custom_html' }))
                    }
                  />
                  <span>Dán đoạn mã HTML</span>
                </label>
              </div>

              {heroDraft.mode === 'custom_html' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Đoạn mã HTML tự do:
                  </label>
                  <textarea
                    rows={12}
                    value={heroDraft.custom_html || ''}
                    onChange={(e) =>
                      setHeroDraft((prev) => ({ ...prev, custom_html: e.target.value }))
                    }
                    placeholder="<div>... Paste HTML của bạn tại đây ...</div>"
                    className="w-full font-mono text-xs p-3 border border-gray-300 rounded focus:border-[#e60049] outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Phụ đề nhỏ trên cùng:
                    </label>
                    <input
                      type="text"
                      value={heroDraft.subtitle || ''}
                      onChange={(e) =>
                        setHeroDraft((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      className="w-full text-xs p-2.5 border border-gray-300 rounded focus:border-[#e60049] outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Tiêu đề chính:
                    </label>
                    <input
                      type="text"
                      value={heroDraft.title || ''}
                      onChange={(e) =>
                        setHeroDraft((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full text-xs p-2.5 border border-gray-300 rounded focus:border-[#e60049] outline-none font-bold"
                    />
                  </div>

                  {/* Bullets */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Các gạch đầu dòng tính năng:
                    </label>
                    {(heroDraft.bullets || []).map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const newB = [...(heroDraft.bullets || [])];
                            newB[idx] = e.target.value;
                            setHeroDraft((prev) => ({ ...prev, bullets: newB }));
                          }}
                          className="flex-1 text-xs p-2 border border-gray-300 rounded focus:border-[#e60049] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newB = (heroDraft.bullets || []).filter(
                              (_, i) => i !== idx
                            );
                            setHeroDraft((prev) => ({ ...prev, bullets: newB }));
                          }}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 font-bold"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setHeroDraft((prev) => ({
                          ...prev,
                          bullets: [...(prev.bullets || []), 'Tính năng bổ sung mới'],
                        }))
                      }
                      className="text-xs font-bold text-[#e60049] hover:underline"
                    >
                      + Thêm gạch đầu dòng
                    </button>
                  </div>

                  {/* Author avatar & info */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Tên tác giả:
                      </label>
                      <input
                        type="text"
                        value={heroDraft.author_name || ''}
                        onChange={(e) =>
                          setHeroDraft((prev) => ({ ...prev, author_name: e.target.value }))
                        }
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Danh xưng tác giả:
                      </label>
                      <input
                        type="text"
                        value={heroDraft.author_title || ''}
                        onChange={(e) =>
                          setHeroDraft((prev) => ({
                            ...prev,
                            author_title: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Link ảnh đại diện tác giả (hoặc upload mới):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={heroDraft.author_avatar_url || ''}
                        onChange={(e) =>
                          setHeroDraft((prev) => ({
                            ...prev,
                            author_avatar_url: e.target.value,
                          }))
                        }
                        placeholder="/favicon.png hoặc https://..."
                        className="flex-1 text-xs p-2 border border-gray-300 rounded"
                      />
                      <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-3 py-2 text-xs font-bold cursor-pointer shrink-0">
                        {uploading === 'hero_avatar' ? 'Đang up...' : 'Upload ảnh'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadFile(
                                e.target.files[0],
                                (url) =>
                                  setHeroDraft((prev) => ({
                                    ...prev,
                                    author_avatar_url: url,
                                  })),
                                'hero_avatar'
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. KHUNG XANH DƯƠNG: TOP BANNER 90 ĐỀ */}
          {/* ============================================================== */}
          {activeBlock === 'top_banner' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-extrabold text-sm text-gray-900">
                  Cấu hình Khung Xanh Dương (Top Banner 90 Đề)
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={topBannerDraft.is_active}
                    onChange={(e) =>
                      setTopBannerDraft((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="rounded text-[#e60049]"
                  />
                  <span>Hiển thị trên web</span>
                </label>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-4 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="top_banner_mode"
                    value="structured"
                    checked={topBannerDraft.mode === 'structured'}
                    onChange={() =>
                      setTopBannerDraft((prev) => ({ ...prev, mode: 'structured' }))
                    }
                  />
                  <span>Bộ sách 3D &amp; Chữ chuẩn (Khuyên dùng)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="top_banner_mode"
                    value="custom_html"
                    checked={topBannerDraft.mode === 'custom_html'}
                    onChange={() =>
                      setTopBannerDraft((prev) => ({ ...prev, mode: 'custom_html' }))
                    }
                  />
                  <span>Dán đoạn mã HTML</span>
                </label>
              </div>

              {topBannerDraft.mode === 'custom_html' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mã HTML tùy biến:
                  </label>
                  <textarea
                    rows={12}
                    value={topBannerDraft.custom_html || ''}
                    onChange={(e) =>
                      setTopBannerDraft((prev) => ({
                        ...prev,
                        custom_html: e.target.value,
                      }))
                    }
                    placeholder="<div>... Paste HTML tại đây ...</div>"
                    className="w-full font-mono text-xs p-3 border border-gray-300 rounded focus:border-[#e60049] outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nhãn tiêu đề phía trên banner:
                    </label>
                    <input
                      type="text"
                      value={topBannerDraft.header_label || ''}
                      onChange={(e) =>
                        setTopBannerDraft((prev) => ({
                          ...prev,
                          header_label: e.target.value,
                        }))
                      }
                      className="w-full text-xs p-2.5 border border-gray-300 rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Tiêu đề lớn:
                      </label>
                      <input
                        type="text"
                        value={topBannerDraft.title || ''}
                        onChange={(e) =>
                          setTopBannerDraft((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-2 border border-gray-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Huy hiệu nút CTA:
                      </label>
                      <input
                        type="text"
                        value={topBannerDraft.cta_badge || ''}
                        onChange={(e) =>
                          setTopBannerDraft((prev) => ({
                            ...prev,
                            cta_badge: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Đường dẫn khi click vào banner:
                    </label>
                    <input
                      type="text"
                      value={topBannerDraft.link_url || ''}
                      onChange={(e) =>
                        setTopBannerDraft((prev) => ({
                          ...prev,
                          link_url: e.target.value,
                        }))
                      }
                      className="w-full text-xs p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. KHUNG VÀNG: DANH MỤC Ô VUÔNG */}
          {/* ============================================================== */}
          {activeBlock === 'categories_grid' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-extrabold text-sm text-gray-900">
                  Cấu hình Khung Vàng (Danh mục sản phẩm ô vuông)
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoriesGridDraft.is_active}
                    onChange={(e) =>
                      setCategoriesGridDraft((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="rounded text-[#e60049]"
                  />
                  <span>Hiển thị trên web</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tiêu đề nhóm ô vuông:
                </label>
                <input
                  type="text"
                  value={categoriesGridDraft.title}
                  onChange={(e) =>
                    setCategoriesGridDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full text-xs p-2 border border-gray-300 rounded font-bold"
                />
              </div>

              {/* Danh sách từng ô */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700">
                  Danh sách ô danh mục ({categoriesGridDraft.items.length}):
                </label>
                {categoriesGridDraft.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#e60049]">Ô số {idx + 1}</span>
                      <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={(e) => {
                            const newItems = [...categoriesGridDraft.items];
                            newItems[idx].is_active = e.target.checked;
                            setCategoriesGridDraft((prev) => ({
                              ...prev,
                              items: newItems,
                            }));
                          }}
                          className="rounded text-[#e60049]"
                        />
                        <span>Kích hoạt</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                          Tên hiển thị:
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const newItems = [...categoriesGridDraft.items];
                            newItems[idx].label = e.target.value;
                            setCategoriesGridDraft((prev) => ({
                              ...prev,
                              items: newItems,
                            }));
                          }}
                          className="w-full p-1.5 border border-gray-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                          Icon text:
                        </label>
                        <input
                          type="text"
                          value={item.icon_code}
                          onChange={(e) => {
                            const newItems = [...categoriesGridDraft.items];
                            newItems[idx].icon_code = e.target.value;
                            setCategoriesGridDraft((prev) => ({
                              ...prev,
                              items: newItems,
                            }));
                          }}
                          className="w-full p-1.5 border border-gray-300 rounded text-xs text-center font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                        Link ảnh tùy biến (Tự scale - Upload hoặc dán link view):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.image_url || ''}
                          placeholder="Dán link view ảnh..."
                          onChange={(e) => {
                            const newItems = [...categoriesGridDraft.items];
                            newItems[idx].image_url = e.target.value;
                            setCategoriesGridDraft((prev) => ({
                              ...prev,
                              items: newItems,
                            }));
                          }}
                          className="flex-1 p-1.5 border border-gray-300 rounded text-xs"
                        />
                        <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-2.5 py-1 text-[11px] font-bold cursor-pointer shrink-0">
                          {uploading === `cat_img_${idx}` ? 'Đang up...' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadFile(
                                  e.target.files[0],
                                  (url) => {
                                    const newItems = [...categoriesGridDraft.items];
                                    newItems[idx].image_url = url;
                                    setCategoriesGridDraft((prev) => ({
                                      ...prev,
                                      items: newItems,
                                    }));
                                  },
                                  `cat_img_${idx}`
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                        Đường link dẫn tới:
                      </label>
                      <input
                        type="text"
                        value={item.to}
                        onChange={(e) => {
                          const newItems = [...categoriesGridDraft.items];
                          newItems[idx].to = e.target.value;
                          setCategoriesGridDraft((prev) => ({
                            ...prev,
                            items: newItems,
                          }));
                        }}
                        className="w-full p-1.5 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. KHUNG TÍM: NHÓM CẤP 1 & SẢN PHẨM CẤP 2 (TRỌNG TÂM) */}
          {/* ============================================================== */}
          {activeBlock === 'section_groups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Cấu hình Khung Tím (Nhóm cấp 1 &amp; Sản phẩm con cấp 2)
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Tên sản phẩm tự đặt độc lập, ảnh tự upload/link, bật/tắt active cho từng
                    nhóm và từng sản phẩm.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSectionGroup}
                  className="bg-[#e60049] text-white font-bold text-xs px-3 py-1.5 rounded shadow-sm hover:bg-[#cc0041]"
                >
                  + Thêm nhóm cấp 1
                </button>
              </div>

              {/* Danh sách từng nhóm cấp 1 */}
              {sectionGroupsDraft.sections.map((group, gIdx) => (
                <div
                  key={group.id}
                  className="p-4 bg-white border-2 border-pink-100 rounded-md shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#e60049] text-white font-black text-[10px] px-2 py-0.5 rounded">
                        Nhóm #{gIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={group.title}
                        onChange={(e) => {
                          const newSec = [...sectionGroupsDraft.sections];
                          newSec[gIdx].title = e.target.value;
                          setSectionGroupsDraft((prev) => ({
                            ...prev,
                            sections: newSec,
                          }));
                        }}
                        placeholder="Tiêu đề nhóm (ví dụ: Tài liệu THPT)"
                        className="font-extrabold text-xs text-gray-900 border-b border-gray-300 focus:border-[#e60049] outline-none px-1"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={group.is_active}
                          onChange={(e) => {
                            const newSec = [...sectionGroupsDraft.sections];
                            newSec[gIdx].is_active = e.target.checked;
                            setSectionGroupsDraft((prev) => ({
                              ...prev,
                              sections: newSec,
                            }));
                          }}
                          className="rounded text-[#e60049]"
                        />
                        <span>{group.is_active ? 'Đang bật nhóm' : 'Đã ẩn nhóm'}</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveSectionGroup(group.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        Xóa nhóm
                      </button>
                    </div>
                  </div>

                  {/* Danh sách các sản phẩm cấp 2 trong nhóm này */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                      <span>Sản phẩm con cấp 2 ({group.items?.length || 0}):</span>
                      <button
                        type="button"
                        onClick={() => handleAddItemToGroup(group.id)}
                        className="text-xs font-bold text-[#e60049] hover:underline"
                      >
                        + Thêm sản phẩm con vào nhóm này
                      </button>
                    </div>

                    {(group.items || []).map((item, iIdx) => (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded text-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-700">
                            Sản phẩm #{iIdx + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 font-bold cursor-pointer text-[#e60049]">
                              <input
                                type="checkbox"
                                checked={item.is_active}
                                onChange={(e) =>
                                  handleUpdateItem(group.id, item.id, {
                                    is_active: e.target.checked,
                                  })
                                }
                                className="rounded text-[#e60049]"
                              />
                              <span>
                                {item.is_active ? 'Đang hiển thị' : 'Đã ẩn'}
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveItemFromGroup(group.id, item.id)
                              }
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {/* Tên hiển thị do Admin tự đặt */}
                        <div>
                          <label className="text-[10px] text-gray-600 font-bold block mb-0.5">
                            Tên hiển thị bên dưới (Tự đặt, không phụ thuộc URL hay tên
                            gốc):
                          </label>
                          <input
                            type="text"
                            value={item.display_title}
                            onChange={(e) =>
                              handleUpdateItem(group.id, item.id, {
                                display_title: e.target.value,
                              })
                            }
                            placeholder="Nhập tên hiển thị..."
                            className="w-full p-2 border border-gray-300 rounded text-xs font-bold text-gray-800"
                          />
                        </div>

                        {/* Hình ảnh kèm theo - Upload mới hoặc dán link view */}
                        <div>
                          <label className="text-[10px] text-gray-600 font-bold block mb-0.5">
                            Hình ảnh kèm theo (Upload file hoặc dán đường link view - Tự
                            động scale chuẩn):
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={item.image_url || ''}
                              onChange={(e) =>
                                handleUpdateItem(group.id, item.id, {
                                  image_url: e.target.value,
                                })
                              }
                              placeholder="Dán link view ảnh (Google Drive, R2, CDN...)"
                              className="flex-1 p-2 border border-gray-300 rounded text-xs"
                            />
                            <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-3 py-2 text-xs font-bold cursor-pointer shrink-0">
                              {uploading === `item_${group.id}_${item.id}`
                                ? 'Đang up...'
                                : 'Upload ảnh'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleUploadFile(
                                      e.target.files[0],
                                      (url) =>
                                        handleUpdateItem(group.id, item.id, {
                                          image_url: url,
                                        }),
                                      `item_${group.id}_${item.id}`
                                    );
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Target URL & Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <label className="text-[10px] text-gray-600 font-bold block mb-0.5">
                              Đường link click vào:
                            </label>
                            <input
                              type="text"
                              value={item.target_url}
                              onChange={(e) =>
                                handleUpdateItem(group.id, item.id, {
                                  target_url: e.target.value,
                                })
                              }
                              placeholder="/high-school/..."
                              className="w-full p-1.5 border border-gray-300 rounded text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-600 font-bold block mb-0.5">
                              Huy hiệu (Badge đỏ):
                            </label>
                            <input
                              type="text"
                              value={item.badge_text || ''}
                              onChange={(e) =>
                                handleUpdateItem(group.id, item.id, {
                                  badge_text: e.target.value,
                                })
                              }
                              placeholder="Mới, Hot..."
                              className="w-full p-1.5 border border-gray-300 rounded text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-600 font-bold block mb-0.5">
                              Tag mô tả:
                            </label>
                            <input
                              type="text"
                              value={item.tag_text || ''}
                              onChange={(e) =>
                                handleUpdateItem(group.id, item.id, {
                                  tag_text: e.target.value,
                                })
                              }
                              placeholder="Dành cho kỳ thi..."
                              className="w-full p-1.5 border border-gray-300 rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. DÒNG CHỮ XÁM: THÔNG BÁO & NÚT CTA */}
          {/* ============================================================== */}
          {activeBlock === 'notice_text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-extrabold text-sm text-gray-900">
                  Cấu hình Dòng Chữ Xám (Thông báo &amp; Nút Xem Toàn Bộ)
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticeDraft.is_active}
                    onChange={(e) =>
                      setNoticeDraft((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="rounded text-[#e60049]"
                  />
                  <span>Hiển thị trên web</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nội dung dòng chữ thông báo:
                </label>
                <textarea
                  rows={4}
                  value={noticeDraft.text}
                  onChange={(e) =>
                    setNoticeDraft((prev) => ({ ...prev, text: e.target.value }))
                  }
                  className="w-full text-xs p-3 border border-gray-300 rounded focus:border-[#e60049] outline-none font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Chữ trên nút bấm:
                  </label>
                  <input
                    type="text"
                    value={noticeDraft.cta_button_text || ''}
                    onChange={(e) =>
                      setNoticeDraft((prev) => ({
                        ...prev,
                        cta_button_text: e.target.value,
                      }))
                    }
                    className="w-full text-xs p-2 border border-gray-300 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Đường dẫn nút bấm:
                  </label>
                  <input
                    type="text"
                    value={noticeDraft.cta_button_link || ''}
                    onChange={(e) =>
                      setNoticeDraft((prev) => ({
                        ...prev,
                        cta_button_link: e.target.value,
                      }))
                    }
                    className="w-full text-xs p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6. KHUNG NÂU: BOTTOM BANNER CT GDPT 2018 */}
          {/* ============================================================== */}
          {activeBlock === 'bottom_banner' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-extrabold text-sm text-gray-900">
                  Cấu hình Khung Nâu (Bottom Banner CT GDPT 2018)
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bottomBannerDraft.is_active}
                    onChange={(e) =>
                      setBottomBannerDraft((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="rounded text-[#e60049]"
                  />
                  <span>Hiển thị trên web</span>
                </label>
              </div>

              {/* Mode switch */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bottom_banner_mode"
                    value="structured"
                    checked={bottomBannerDraft.mode === 'structured'}
                    onChange={() =>
                      setBottomBannerDraft((prev) => ({ ...prev, mode: 'structured' }))
                    }
                  />
                  <span>Sách 3D có cấu trúc</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bottom_banner_mode"
                    value="custom_image"
                    checked={bottomBannerDraft.mode === 'custom_image'}
                    onChange={() =>
                      setBottomBannerDraft((prev) => ({ ...prev, mode: 'custom_image' }))
                    }
                  />
                  <span>Banner ảnh nguyên tấm</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bottom_banner_mode"
                    value="custom_html"
                    checked={bottomBannerDraft.mode === 'custom_html'}
                    onChange={() =>
                      setBottomBannerDraft((prev) => ({ ...prev, mode: 'custom_html' }))
                    }
                  />
                  <span>Dán mã HTML</span>
                </label>
              </div>

              {bottomBannerDraft.mode === 'custom_html' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mã HTML tùy biến:
                  </label>
                  <textarea
                    rows={12}
                    value={bottomBannerDraft.custom_html || ''}
                    onChange={(e) =>
                      setBottomBannerDraft((prev) => ({
                        ...prev,
                        custom_html: e.target.value,
                      }))
                    }
                    placeholder="<div>... Paste HTML tại đây ...</div>"
                    className="w-full font-mono text-xs p-3 border border-gray-300 rounded focus:border-[#e60049] outline-none"
                  />
                </div>
              )}

              {bottomBannerDraft.mode === 'custom_image' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Link hình ảnh banner (Upload hoặc dán URL):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bottomBannerDraft.custom_image_url || ''}
                        onChange={(e) =>
                          setBottomBannerDraft((prev) => ({
                            ...prev,
                            custom_image_url: e.target.value,
                          }))
                        }
                        placeholder="https://..."
                        className="flex-1 text-xs p-2 border border-gray-300 rounded"
                      />
                      <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-3 py-2 text-xs font-bold cursor-pointer shrink-0">
                        {uploading === 'bottom_banner_img' ? 'Đang up...' : 'Upload ảnh'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadFile(
                                e.target.files[0],
                                (url) =>
                                  setBottomBannerDraft((prev) => ({
                                    ...prev,
                                    custom_image_url: url,
                                  })),
                                'bottom_banner_img'
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Đường dẫn khi click vào banner:
                    </label>
                    <input
                      type="text"
                      value={bottomBannerDraft.link_url || ''}
                      onChange={(e) =>
                        setBottomBannerDraft((prev) => ({
                          ...prev,
                          link_url: e.target.value,
                        }))
                      }
                      className="w-full text-xs p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              )}

              {bottomBannerDraft.mode === 'structured' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Tiêu đề banner:
                      </label>
                      <input
                        type="text"
                        value={bottomBannerDraft.title || ''}
                        onChange={(e) =>
                          setBottomBannerDraft((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-2 border border-gray-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Huy hiệu (Badge):
                      </label>
                      <input
                        type="text"
                        value={bottomBannerDraft.badge_text || ''}
                        onChange={(e) =>
                          setBottomBannerDraft((prev) => ({
                            ...prev,
                            badge_text: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Đường dẫn khi click vào banner:
                    </label>
                    <input
                      type="text"
                      value={bottomBannerDraft.link_url || ''}
                      onChange={(e) =>
                        setBottomBannerDraft((prev) => ({
                          ...prev,
                          link_url: e.target.value,
                        }))
                      }
                      className="w-full text-xs p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Preview Side-by-Side */}
        {isSideBySide && (
          <div className="lg:col-span-6 bg-gray-100 p-4 rounded-md border-2 border-dashed border-gray-300 sticky top-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-300">
              <span className="text-xs font-black text-gray-700 uppercase tracking-wide">
                Live Preview (Xem trước thời gian thực)
              </span>
              <div className="flex items-center gap-1.5 bg-white border border-gray-300 p-0.5 rounded text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`px-2 py-0.5 rounded ${
                    previewViewport === 'desktop'
                      ? 'bg-[#e60049] text-white'
                      : 'text-gray-600'
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`px-2 py-0.5 rounded ${
                    previewViewport === 'mobile'
                      ? 'bg-[#e60049] text-white'
                      : 'text-gray-600'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div
              className={`mx-auto bg-white rounded shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
                previewViewport === 'mobile' ? 'max-w-[375px]' : 'w-full'
              }`}
            >
              <div className="p-4 space-y-8">
                {activeBlock === 'hero' && <HeroBlock config={heroDraft} />}
                {activeBlock === 'top_banner' && <TopBannerBlock config={topBannerDraft} />}
                {activeBlock === 'categories_grid' && (
                  <CategoriesGridBlock config={categoriesGridDraft} />
                )}
                {activeBlock === 'section_groups' && (
                  <SectionGroupsBlock config={sectionGroupsDraft} />
                )}
                {activeBlock === 'notice_text' && <NoticeTextBlock config={noticeDraft} />}
                {activeBlock === 'bottom_banner' && (
                  <BottomBannerBlock config={bottomBannerDraft} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
