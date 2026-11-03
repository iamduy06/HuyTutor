import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import {
  HomepageBlockItem,
  HomepageBlockType,
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
import { normalizeTargetUrl } from './SmartLink';
import { R2ImageUploader } from './R2ImageUploader';

const BLOCK_TYPE_LABELS: Record<HomepageBlockType, { name: string; color: string; desc: string }> = {
  hero: {
    name: 'Hero Header (Phần đầu trang)',
    color: 'bg-rose-700 text-white',
    desc: 'Phần đầu trang (Chữ + Ảnh Thầy giáo bên phải / HTML / Full ảnh)',
  },
  top_banner: {
    name: 'Top Banner (Ưu đãi / Nổi bật)',
    color: 'bg-sky-700 text-white',
    desc: 'Banner quảng cáo (Tải ảnh banner rộng, đứng một mình full-width / HTML)',
  },
  categories_grid: {
    name: 'Danh mục sản phẩm',
    color: 'bg-amber-600 text-white',
    desc: 'Các ô danh mục sản phẩm squircle icon linh hoạt số lượng',
  },
  section_groups: {
    name: 'Nhóm tài liệu & Sản phẩm',
    color: 'bg-purple-800 text-white',
    desc: 'Các nhóm tài liệu (THPT, THCS...) với card sách 3D + badge + Đọc thử + tên sách',
  },
  notice_text: {
    name: 'Thông báo & Nút liên kết (Notice / CTA)',
    color: 'bg-zinc-700 text-white',
    desc: 'Dòng thông báo & nút điều hướng (Tham gia nhóm Facebook / Xem toàn bộ)',
  },
  bottom_banner: {
    name: 'Bottom Banner (Chân trang)',
    color: 'bg-emerald-700 text-white',
    desc: 'Banner chân trang (Tải ảnh banner rộng hoặc HTML)',
  },
};

export const AdminHomepageCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, showToast } = useStore();

  // Danh sách các khung (Block-based layout) - hoàn toàn động số lượng và thứ tự
  const [blocks, setBlocks] = useState<HomepageBlockItem[]>(() => {
    if (Array.isArray(siteConfigs?.homepage_blocks) && siteConfigs.homepage_blocks.length > 0) {
      return siteConfigs.homepage_blocks;
    }
    return [
      {
        id: 'block_hero_default',
        type: 'hero',
        title_label: 'Hero Header (Phần đầu trang)',
        is_active: siteConfigs?.homepage_hero?.is_active ?? true,
        sort_order: 1,
        config: siteConfigs?.homepage_hero || {
          mode: 'structured',
          title: '',
          subtitle: '',
          bullets: [],
          image_url: '',
          is_active: true,
        },
      },
      {
        id: 'block_banner_default',
        type: 'top_banner',
        title_label: 'Top Banner (Ưu đãi / Nổi bật)',
        is_active: siteConfigs?.homepage_top_banner?.is_active ?? true,
        sort_order: 2,
        config: siteConfigs?.homepage_top_banner || {
          mode: 'image_text',
          header_label: '',
          tag: '',
          title: '',
          subtitle: '',
          cta_badge: '',
          link_url: '',
          image_url: '',
          is_active: true,
        },
      },
      {
        id: 'block_cat_grid_default',
        type: 'categories_grid',
        title_label: 'Danh mục sản phẩm',
        is_active: siteConfigs?.homepage_categories_grid?.is_active ?? true,
        sort_order: 3,
        config: siteConfigs?.homepage_categories_grid || {
          title: '',
          items: [],
          is_active: true,
        },
      },
      {
        id: 'block_sec_groups_default',
        type: 'section_groups',
        title_label: 'Nhóm tài liệu & Sản phẩm',
        is_active: siteConfigs?.homepage_section_groups?.is_active ?? true,
        sort_order: 4,
        config: siteConfigs?.homepage_section_groups || {
          sections: [],
        },
      },
      {
        id: 'block_notice_default',
        type: 'notice_text',
        title_label: 'Thông báo & Nút liên kết (Notice / CTA)',
        is_active: siteConfigs?.homepage_notice_text?.is_active ?? true,
        sort_order: 5,
        config: siteConfigs?.homepage_notice_text || {
          text: '',
          cta_button_text: '',
          cta_button_link: '',
          is_active: true,
        },
      },
      {
        id: 'block_bottom_banner_default',
        type: 'bottom_banner',
        title_label: 'Bottom Banner (Chân trang)',
        is_active: siteConfigs?.homepage_bottom_banner?.is_active ?? true,
        sort_order: 6,
        config: siteConfigs?.homepage_bottom_banner || {
          mode: 'structured',
          title: '',
          link_url: '',
          books: [],
          is_active: true,
        },
      },
    ];
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string>('block_hero_default');
  const [isSideBySide, setIsSideBySide] = useState<boolean>(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Đồng bộ blocks khi siteConfigs load từ backend
  useEffect(() => {
    if (Array.isArray(siteConfigs?.homepage_blocks) && siteConfigs.homepage_blocks.length > 0) {
      setBlocks(siteConfigs.homepage_blocks);
      if (!selectedBlockId && siteConfigs.homepage_blocks[0]) {
        setSelectedBlockId(siteConfigs.homepage_blocks[0].id);
      }
    }
  }, [siteConfigs]);

  const currentBlockIndex = blocks.findIndex((b) => b.id === selectedBlockId);
  const currentBlock = blocks[currentBlockIndex] || blocks[0];

  // Upload ảnh qua R2 API (với naming chuẩn + tự động xóa ảnh cũ trên R2)
  const handleUploadFile = async (
    file: File,
    onSuccess: (url: string) => void,
    fieldId: string,
    options?: {
      oldUrl?: string;
      pageLevel1?: string;
      pageLevel2?: string;
    }
  ) => {
    setUploading(fieldId);
    try {
      const res = await apiClient.uploadFile(file, {
        folder: 'homepage',
        pageLevel1: options?.pageLevel1,
        pageLevel2: options?.pageLevel2,
      });

      // Nếu có ảnh cũ trên R2 khác với ảnh mới, xóa file cũ trên R2
      if (options?.oldUrl && options.oldUrl !== res.url) {
        apiClient.deleteR2File(options.oldUrl).catch((err) => {
          console.warn('Lỗi xóa ảnh cũ trên R2:', err);
        });
      }

      onSuccess(res.url);
      showToast('Tải ảnh lên Cloudflare R2 thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải ảnh lên.');
    } finally {
      setUploading(null);
    }
  };

  // Di chuyển khối lên trên
  const handleMoveBlockUp = (index: number) => {
    if (index <= 0) return;
    const next = [...blocks];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    next.forEach((b, idx) => {
      b.sort_order = idx + 1;
    });
    setBlocks(next);
  };

  // Di chuyển khối xuống dưới
  const handleMoveBlockDown = (index: number) => {
    if (index >= blocks.length - 1) return;
    const next = [...blocks];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    next.forEach((b, idx) => {
      b.sort_order = idx + 1;
    });
    setBlocks(next);
  };

  // Thêm một khối mới vào danh sách
  const handleAddBlock = (type: HomepageBlockType) => {
    const id = `block_${type}_${Date.now()}`;
    const info = BLOCK_TYPE_LABELS[type];

    let initialConfig: any = {};
    if (type === 'hero') {
      initialConfig = { mode: 'structured', title: '', subtitle: '', bullets: [], image_url: '', is_active: true };
    } else if (type === 'top_banner') {
      initialConfig = { mode: 'image_text', header_label: '', tag: '', title: '', subtitle: '', cta_badge: '', link_url: '', image_url: '', is_active: true };
    } else if (type === 'categories_grid') {
      initialConfig = { title: 'Danh mục sản phẩm', items: [], is_active: true };
    } else if (type === 'section_groups') {
      initialConfig = { sections: [] };
    } else if (type === 'notice_text') {
      initialConfig = { text: '', cta_button_text: '', cta_button_link: '', is_active: true };
    } else if (type === 'bottom_banner') {
      initialConfig = { mode: 'structured', title: '', link_url: '', books: [], is_active: true };
    }

    const newBlock: HomepageBlockItem = {
      id,
      type,
      title_label: info.name,
      is_active: true,
      sort_order: blocks.length + 1,
      config: initialConfig,
    };

    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(id);
    showToast(`Đã thêm mới: ${info.name}`);
  };

  // Xóa một khối khỏi trang chủ (đồng thời xóa toàn bộ ảnh R2 thuộc khối đó)
  const handleDeleteBlock = (id: string) => {
    const blockToDelete = blocks.find((b) => b.id === id);
    if (blockToDelete?.config) {
      const cfg = blockToDelete.config;
      // Khung Hero / Top Banner / Bottom Banner
      if (cfg.image_url) apiClient.deleteR2File(cfg.image_url).catch(() => {});
      if (cfg.custom_image_url) apiClient.deleteR2File(cfg.custom_image_url).catch(() => {});

      // Khung Danh mục ô vuông (categories_grid)
      if (Array.isArray(cfg.items)) {
        cfg.items.forEach((it: any) => {
          if (it.image_url) apiClient.deleteR2File(it.image_url).catch(() => {});
        });
      }

      // Khung Nhóm tài liệu cấp 1 & cấp 2 (section_groups)
      if (Array.isArray(cfg.sections)) {
        cfg.sections.forEach((sec: any) => {
          if (Array.isArray(sec.items)) {
            sec.items.forEach((it: any) => {
              if (it.image_url) apiClient.deleteR2File(it.image_url).catch(() => {});
            });
          }
        });
      }
    }

    const next = blocks.filter((b) => b.id !== id);
    next.forEach((b, idx) => {
      b.sort_order = idx + 1;
    });
    setBlocks(next);
    if (selectedBlockId === id) {
      setSelectedBlockId(next[0]?.id || '');
    }
    showToast('Đã xóa khung và dọn dẹp ảnh R2 liên quan');
  };

  // Cập nhật config của khối đang chọn
  const updateCurrentConfig = (updater: (prev: any) => any) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === currentBlock.id ? { ...b, config: updater(b.config) } : b))
    );
  };

  // Lưu toàn bộ layout trang chủ vào Supabase (tự động chuẩn hóa link ra ngoài https:// và link nội bộ root/url)
  const handleSaveAllLayout = async () => {
    setSaving(true);
    try {
      const normalizedBlocks: HomepageBlockItem[] = blocks.map((b) => {
        const clone = JSON.parse(JSON.stringify(b));
        const cfg = clone.config || {};

        if (clone.type === 'top_banner' || clone.type === 'bottom_banner') {
          if (cfg.link_url) {
            const norm = normalizeTargetUrl(cfg.link_url);
            cfg.link_url = norm === '#' ? '' : norm;
          }
        } else if (clone.type === 'categories_grid') {
          if (Array.isArray(cfg.items)) {
            cfg.items.forEach((it: any) => {
              if (it.to) {
                const norm = normalizeTargetUrl(it.to);
                it.to = norm === '#' ? '' : norm;
              }
              if (it.category_slug && !it.to) {
                const norm = normalizeTargetUrl(it.category_slug);
                it.to = norm === '#' ? '' : norm;
              }
            });
          }
        } else if (clone.type === 'section_groups') {
          if (Array.isArray(cfg.sections)) {
            cfg.sections.forEach((sec: any) => {
              if (Array.isArray(sec.items)) {
                sec.items.forEach((it: any) => {
                  if (it.target_url) {
                    const norm = normalizeTargetUrl(it.target_url);
                    it.target_url = norm === '#' ? '' : norm;
                  }
                });
              }
            });
          }
        } else if (clone.type === 'notice_text') {
          if (cfg.cta_button_link) {
            const norm = normalizeTargetUrl(cfg.cta_button_link);
            cfg.cta_button_link = norm === '#' ? '' : norm;
          }
        }

        clone.config = cfg;
        return clone;
      });

      setBlocks(normalizedBlocks);

      await updateSiteConfig('homepage_blocks', normalizedBlocks);

      // Cập nhật đồng bộ các key lẻ nếu có block tương ứng (đảm bảo tương thích ngược)
      const hero = normalizedBlocks.find((b) => b.type === 'hero');
      if (hero) await updateSiteConfig('homepage_hero', hero.config);
      const banner = normalizedBlocks.find((b) => b.type === 'top_banner');
      if (banner) await updateSiteConfig('homepage_top_banner', banner.config);
      const cat = normalizedBlocks.find((b) => b.type === 'categories_grid');
      if (cat) await updateSiteConfig('homepage_categories_grid', cat.config);
      const sec = normalizedBlocks.find((b) => b.type === 'section_groups');
      if (sec) await updateSiteConfig('homepage_section_groups', sec.config);
      const noti = normalizedBlocks.find((b) => b.type === 'notice_text');
      if (noti) await updateSiteConfig('homepage_notice_text', noti.config);
      const btm = normalizedBlocks.find((b) => b.type === 'bottom_banner');
      if (btm) await updateSiteConfig('homepage_bottom_banner', btm.config);

      showToast('Đã lưu toàn bộ cấu hình và thứ tự các khung trang chủ thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-gray-900">
            Quản trị Giao diện Trang chủ (CMS Page Builder)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tự do thêm các khung khác nhau, sắp xếp thứ tự hiển thị, tải ảnh R2 trực tiếp và xem trước Liveview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Liveview Side-by-side */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-sm">
            <span className="text-xs font-bold text-gray-700">Xem Liveview Side-by-Side:</span>
            <button
              type="button"
              onClick={() => setIsSideBySide((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                isSideBySide ? 'bg-[#e60049]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-[3px] ml-[3px] ${
                  isSideBySide ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Nút Lưu cấu hình tổng */}
          <button
            type="button"
            onClick={handleSaveAllLayout}
            disabled={saving}
            className="bg-[#e60049] hover:bg-[#cc0041] disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2 rounded-sm shadow-sm transition flex items-center gap-1.5"
          >
            {saving ? 'Đang lưu vào DB...' : 'Lưu toàn bộ thứ tự & cấu hình'}
          </button>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG CÁC KHỐI NỘI DUNG (TITLE KHỐI - MÔ TẢ KHỐI) */}
      <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
          <div>
            <h3 className="text-xs font-black uppercase text-gray-900 tracking-wider">
              Cấu trúc các khối nội dung Trang chủ ({blocks.length} khối)
            </h3>
            <p className="text-[11px] text-gray-500">
              Chọn khối để chỉnh sửa chi tiết. Tiêu đề khối - mô tả khối rõ ràng, dễ nhìn cho quản trị viên.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">+ Thêm khối:</span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleAddBlock(e.target.value as HomepageBlockType);
                  e.target.value = '';
                }
              }}
              className="text-xs p-1.5 border border-gray-300 rounded font-bold bg-white text-[#e60049] cursor-pointer"
            >
              <option value="" disabled>
                + Thêm khối nội dung mới...
              </option>
              <option value="hero">Hero Header (Phần đầu trang)</option>
              <option value="top_banner">Top Banner (Ưu đãi / Nổi bật)</option>
              <option value="categories_grid">Danh mục sản phẩm</option>
              <option value="section_groups">Nhóm tài liệu &amp; Sản phẩm</option>
              <option value="notice_text">Thông báo &amp; Nút liên kết (Notice / CTA)</option>
              <option value="bottom_banner">Bottom Banner (Chân trang)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {blocks.map((block, idx) => {
            const isSelected = block.id === currentBlock?.id;
            const info = BLOCK_TYPE_LABELS[block.type];
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => setSelectedBlockId(block.id)}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#e60049] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <span>#{idx + 1}</span>
                <span>{block.title_label || info?.name || block.type}</span>
                {!block.is_active && <span className="text-[10px] opacity-75">(Ẩn)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Editor + Live Preview (Optional Side-by-Side) */}
      <div
        className={
          isSideBySide
            ? 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'
            : 'space-y-6 max-w-4xl mx-auto'
        }
      >
        {/* CỘT TRÁI: FORM BIÊN TẬP CHI TIẾT KHỐI ĐANG CHỌN */}
        <div
          className={
            isSideBySide
              ? 'xl:col-span-6 bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4'
              : 'bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4'
          }
        >
          {currentBlock ? (
            <div className="space-y-4">
              {/* Header chuẩn: Title khối - Mô tả của khối đó */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#e60049] text-white">
                      Khối #{currentBlockIndex + 1}: {currentBlock.type}
                    </span>
                    <h3 className="font-extrabold text-sm text-gray-900">
                      {currentBlock.title_label || BLOCK_TYPE_LABELS[currentBlock.type]?.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {BLOCK_TYPE_LABELS[currentBlock.type]?.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentBlockIndex === 0}
                    onClick={() => handleMoveBlockUp(currentBlockIndex)}
                    className="p-1 px-2 border border-gray-300 rounded-sm text-xs font-bold disabled:opacity-30 hover:bg-gray-100"
                    title="Di chuyển khối lên"
                  >
                    ▲ Lên
                  </button>
                  <button
                    type="button"
                    disabled={currentBlockIndex === blocks.length - 1}
                    onClick={() => handleMoveBlockDown(currentBlockIndex)}
                    className="p-1 px-2 border border-gray-300 rounded-sm text-xs font-bold disabled:opacity-30 hover:bg-gray-100"
                    title="Di chuyển khối xuống"
                  >
                    ▼ Xuống
                  </button>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={currentBlock.is_active}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBlocks((prev) =>
                          prev.map((b) => (b.id === currentBlock.id ? { ...b, is_active: checked } : b))
                        );
                      }}
                      className="w-4 h-4 accent-[#e60049] rounded cursor-pointer"
                    />
                    <span>{currentBlock.is_active ? 'Bật' : 'Ẩn'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(currentBlock.id)}
                    className="ml-1 text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded border border-red-200 hover:bg-red-50 cursor-pointer"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>

              {/* 1. KHUNG ĐEN: HERO TOP */}
              {currentBlock.type === 'hero' && (
                <div className="space-y-4">
                  {/* Mode switch */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="hero_mode"
                        value="structured"
                        checked={currentBlock.config?.mode === 'structured'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                            ...cfg,
                            mode: 'structured',
                          }))
                        }
                      />
                      <span>Chữ + Hình ảnh R2 bên phải (Chuẩn)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="hero_mode"
                        value="custom_html"
                        checked={currentBlock.config?.mode === 'custom_html'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                            ...cfg,
                            mode: 'custom_html',
                          }))
                        }
                      />
                      <span>Dán đoạn mã HTML</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="hero_mode"
                        value="custom_image"
                        checked={currentBlock.config?.mode === 'custom_image'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                            ...cfg,
                            mode: 'custom_image',
                          }))
                        }
                      />
                      <span>Full ảnh Banner</span>
                    </label>
                  </div>

                  {currentBlock.config?.mode === 'custom_html' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Đoạn mã HTML tự do:
                      </label>
                      <textarea
                        rows={12}
                        value={currentBlock.config?.custom_html || ''}
                        onChange={(e) =>
                          updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                            ...cfg,
                            custom_html: e.target.value,
                          }))
                        }
                        placeholder="<div>... Paste HTML tại đây ...</div>"
                        className="w-full font-mono text-xs p-3 border border-gray-300 rounded focus:border-[#e60049] outline-none"
                      />
                    </div>
                  ) : currentBlock.config?.mode === 'custom_image' ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Ảnh Banner Hero:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentBlock.config?.custom_image_url || ''}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                              ...cfg,
                              custom_image_url: e.target.value,
                            }))
                          }
                          placeholder="Dán link view ảnh..."
                          className="flex-1 text-xs p-2 border border-gray-300 rounded"
                        />
                        <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-xs font-bold cursor-pointer shrink-0">
                          {uploading === 'hero_custom_img' ? 'Đang tải...' : 'Upload ảnh R2'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadFile(
                                  e.target.files[0],
                                  (url) =>
                                    updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                                      ...cfg,
                                      custom_image_url: url,
                                    })),
                                  'hero_custom_img',
                                  {
                                    oldUrl: currentBlock.config?.custom_image_url,
                                    pageLevel1: 'Trang chu',
                                    pageLevel2: 'Hero Banner',
                                  }
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      {currentBlock.config?.custom_image_url && (
                        <div className="flex items-center gap-3">
                          <img
                            src={currentBlock.config.custom_image_url}
                            alt="Preview"
                            className="max-h-48 rounded border p-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (currentBlock.config?.custom_image_url) {
                                apiClient.deleteR2File(currentBlock.config.custom_image_url).catch(() => {});
                              }
                              updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                                ...cfg,
                                custom_image_url: '',
                              }));
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Phụ đề nhỏ trên cùng:
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.subtitle || ''}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                              ...cfg,
                              subtitle: e.target.value,
                            }))
                          }
                          placeholder="Dạy & học tiếng Anh với tài nguyên"
                          className="w-full text-xs p-2.5 border border-gray-300 rounded focus:border-[#e60049] outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Tiêu đề chính:
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.title || ''}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                              ...cfg,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Chuẩn mực & Chi tiết"
                          className="w-full text-xs p-2.5 border border-gray-300 rounded focus:border-[#e60049] outline-none font-bold"
                        />
                      </div>

                      {/* Bullets */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Các gạch đầu dòng tính năng:
                        </label>
                        {(currentBlock.config?.bullets || []).map((b: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={b}
                              onChange={(e) => {
                                const newB = [...(currentBlock.config?.bullets || [])];
                                newB[idx] = e.target.value;
                                updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                                  ...cfg,
                                  bullets: newB,
                                }));
                              }}
                              className="flex-1 text-xs p-2 border border-gray-300 rounded focus:border-[#e60049] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newB = (currentBlock.config?.bullets || []).filter(
                                  (_: any, i: number) => i !== idx
                                );
                                updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                                  ...cfg,
                                  bullets: newB,
                                }));
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
                            updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                              ...cfg,
                              bullets: [...(cfg.bullets || []), 'Tính năng mới'],
                            }))
                          }
                          className="text-xs font-bold text-[#e60049] hover:underline"
                        >
                          + Thêm gạch đầu dòng
                        </button>
                      </div>

                      {/* Right Side Image (Hình ảnh bên phải lấy từ R2 hoặc link view) */}
                      <div className="pt-3 border-t space-y-2">
                        <label className="block text-xs font-bold text-gray-800">
                          Hình ảnh phía bên phải (Thầy giáo / Minh họa):
                        </label>
                        <div className="text-[11px] text-gray-500">
                          Hình ảnh lấy từ Cloudflare R2 (hoặc dán link view), không phải ảnh tĩnh trong code, tự động co giãn đẹp mắt.
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={currentBlock.config?.image_url || ''}
                            onChange={(e) =>
                              updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                                ...cfg,
                                image_url: e.target.value,
                              }))
                            }
                            placeholder="Dán link R2/ảnh hoặc bấm Upload..."
                            className="flex-1 text-xs p-2 border border-gray-300 rounded"
                          />
                          <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-xs font-bold cursor-pointer shrink-0">
                            {uploading === 'hero_img' ? 'Đang tải...' : 'Upload ảnh R2'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleUploadFile(
                                    e.target.files[0],
                                    (url) =>
                                      updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                                        ...cfg,
                                        image_url: url,
                                      })),
                                    'hero_img',
                                    {
                                      oldUrl: currentBlock.config?.image_url,
                                      pageLevel1: 'Trang chu',
                                      pageLevel2: currentBlock.config?.title || 'Hero Minh hoa',
                                    }
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                        {currentBlock.config?.image_url && (
                          <div className="flex items-center gap-3 p-2 bg-gray-50 border rounded w-fit">
                            <img
                              src={currentBlock.config.image_url}
                              alt="Hero right"
                              className="h-20 w-auto object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (currentBlock.config?.image_url) {
                                  apiClient.deleteR2File(currentBlock.config.image_url).catch(() => {});
                                }
                                updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                                  ...cfg,
                                  image_url: '',
                                }));
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-bold"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. TOP BANNER (BANNER NỔI BẬT) */}
              {currentBlock.type === 'top_banner' && (
                <div className="space-y-4">
                  {/* Mode switch */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="top_banner_mode"
                        value="image_text"
                        checked={currentBlock.config?.mode === 'image_text'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                            ...cfg,
                            mode: 'image_text',
                          }))
                        }
                      />
                      <span>Chữ + Up hình ảnh (Khuyên dùng)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="top_banner_mode"
                        value="custom_html"
                        checked={currentBlock.config?.mode === 'custom_html'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                            ...cfg,
                            mode: 'custom_html',
                          }))
                        }
                      />
                      <span>Dán đoạn mã HTML</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="top_banner_mode"
                        value="structured"
                        checked={currentBlock.config?.mode === 'structured'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                            ...cfg,
                            mode: 'structured',
                          }))
                        }
                      />
                      <span>Bộ sách 3D + Chữ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="top_banner_mode"
                        value="custom_image"
                        checked={currentBlock.config?.mode === 'custom_image'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                            ...cfg,
                            mode: 'custom_image',
                          }))
                        }
                      />
                      <span>Full ảnh Banner</span>
                    </label>
                  </div>

                  {currentBlock.config?.mode === 'custom_html' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Mã HTML tùy biến:
                      </label>
                      <textarea
                        rows={12}
                        value={currentBlock.config?.custom_html || ''}
                        onChange={(e) =>
                          updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                            ...cfg,
                            custom_html: e.target.value,
                          }))
                        }
                        placeholder="<div>... Paste HTML tại đây ...</div>"
                        className="w-full font-mono text-xs p-3 border border-gray-300 rounded focus:border-[#e60049] outline-none"
                      />
                    </div>
                  ) : currentBlock.config?.mode === 'custom_image' ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Ảnh Banner lớn:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentBlock.config?.custom_image_url || ''}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                              ...cfg,
                              custom_image_url: e.target.value,
                            }))
                          }
                          placeholder="Dán link view ảnh..."
                          className="flex-1 text-xs p-2 border border-gray-300 rounded"
                        />
                        <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-xs font-bold cursor-pointer shrink-0">
                          {uploading === 'top_banner_full' ? 'Đang tải...' : 'Upload ảnh R2'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadFile(
                                  e.target.files[0],
                                  (url) =>
                                    updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                      ...cfg,
                                      custom_image_url: url,
                                    })),
                                  'top_banner_full',
                                  {
                                    oldUrl: currentBlock.config?.custom_image_url,
                                    pageLevel1: 'Trang chu',
                                    pageLevel2: 'Top Banner',
                                  }
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      {currentBlock.config?.custom_image_url && (
                        <div className="flex items-center gap-3">
                          <img
                            src={currentBlock.config.custom_image_url}
                            alt="Banner Preview"
                            className="max-h-48 rounded border p-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (currentBlock.config?.custom_image_url) {
                                apiClient.deleteR2File(currentBlock.config.custom_image_url).catch(() => {});
                              }
                              updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                ...cfg,
                                custom_image_url: '',
                              }));
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Đường dẫn đích (Hỗ trợ https:// ra ngoài hoặc link nội bộ root /url):
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.link_url || ''}
                          placeholder="Ví dụ: /combo-thpt hoặc https://..."
                          onBlur={(e) => {
                            const norm = normalizeTargetUrl(e.target.value);
                            updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                              ...cfg,
                              link_url: norm === '#' ? '' : norm,
                            }));
                          }}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                              ...cfg,
                              link_url: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {/* Chữ + Up hình ảnh */}
                      {currentBlock.config?.mode === 'image_text' && (
                        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-md space-y-2">
                          <label className="block text-xs font-bold text-blue-900">
                            Hình ảnh minh họa banner (Upload R2 hoặc dán link view):
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={currentBlock.config?.image_url || ''}
                              onChange={(e) =>
                                updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                  ...cfg,
                                  image_url: e.target.value,
                                }))
                              }
                              placeholder="Dán link view ảnh hoặc bấm Upload..."
                              className="flex-1 text-xs p-2 border border-gray-300 rounded bg-white"
                            />
                            <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-xs font-bold cursor-pointer shrink-0">
                              {uploading === 'top_banner_img' ? 'Đang tải...' : 'Upload ảnh R2'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleUploadFile(
                                      e.target.files[0],
                                      (url) =>
                                        updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                          ...cfg,
                                          image_url: url,
                                        })),
                                      'top_banner_img',
                                      {
                                        oldUrl: currentBlock.config?.image_url,
                                        pageLevel1: 'Trang chu',
                                        pageLevel2: currentBlock.config?.title || 'Top Banner',
                                      }
                                    );
                                  }
                                }}
                              />
                            </label>
                          </div>
                          {currentBlock.config?.image_url && (
                            <div className="flex items-center gap-3 p-1.5 bg-white border rounded w-fit">
                              <img
                                src={currentBlock.config.image_url}
                                alt="Banner img"
                                className="h-16 w-auto object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (currentBlock.config?.image_url) {
                                    apiClient.deleteR2File(currentBlock.config.image_url).catch(() => {});
                                  }
                                  updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                    ...cfg,
                                    image_url: '',
                                  }));
                                }}
                                className="text-red-500 hover:text-red-700 text-xs font-bold"
                              >
                                Xóa ảnh
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Nhãn tiêu đề phía trên banner:
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.header_label || ''}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                              ...cfg,
                              header_label: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2.5 border border-gray-300 rounded"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Thẻ tag nhỏ:
                          </label>
                          <input
                            type="text"
                            value={currentBlock.config?.tag || ''}
                            onChange={(e) =>
                              updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                ...cfg,
                                tag: e.target.value,
                              }))
                            }
                            className="w-full text-xs p-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Tiêu đề lớn:
                          </label>
                          <input
                            type="text"
                            value={currentBlock.config?.title || ''}
                            onChange={(e) =>
                              updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                ...cfg,
                                title: e.target.value,
                              }))
                            }
                            className="w-full text-xs p-2 border border-gray-300 rounded font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Mô tả / Phụ đề:
                          </label>
                          <input
                            type="text"
                            value={currentBlock.config?.subtitle || ''}
                            onChange={(e) =>
                              updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                ...cfg,
                                subtitle: e.target.value,
                              }))
                            }
                            className="w-full text-xs p-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Huy hiệu nút CTA:
                          </label>
                          <input
                            type="text"
                            value={currentBlock.config?.cta_badge || ''}
                            onChange={(e) =>
                              updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                ...cfg,
                                cta_badge: e.target.value,
                              }))
                            }
                            className="w-full text-xs p-2 border border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Đường dẫn đích (Hỗ trợ https:// ra ngoài hoặc link nội bộ root /url):
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.link_url || ''}
                          placeholder="Ví dụ: /combo-thpt hoặc https://..."
                          onBlur={(e) => {
                            const norm = normalizeTargetUrl(e.target.value);
                            updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                              ...cfg,
                              link_url: norm === '#' ? '' : norm,
                            }));
                          }}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                              ...cfg,
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

              {/* 3. DANH MỤC SẢN PHẨM */}
              {currentBlock.type === 'categories_grid' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Tiêu đề nhóm ô vuông:
                    </label>
                    <input
                      type="text"
                      value={currentBlock.config?.title || ''}
                      onChange={(e) =>
                        updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                          ...cfg,
                          title: e.target.value,
                        }))
                      }
                      className="w-full text-xs p-2 border border-gray-300 rounded font-bold"
                    />
                  </div>

                  {/* Danh sách từng ô - hoàn toàn động */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700">
                        Danh sách ô danh mục ({(currentBlock.config?.items || []).length} ô):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newId = `cat-${Date.now()}`;
                          updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                            ...cfg,
                            items: [
                              ...(cfg.items || []),
                              {
                                id: newId,
                                category_slug: '',
                                label: '',
                                icon_code: '',
                                image_url: '',
                                to: '',
                                is_active: true,
                              },
                            ],
                          }));
                        }}
                        className="bg-[#e60049] hover:bg-[#cc0041] text-white text-[11px] font-bold px-3 py-1 rounded-sm shadow-sm"
                      >
                        + Thêm ô danh mục mới
                      </button>
                    </div>

                    {(currentBlock.config?.items || []).length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-500 border border-dashed rounded-md bg-gray-50">
                        Chưa có ô danh mục nào. Bấm "+ Thêm ô danh mục mới" để cấu hình từng ô.
                      </div>
                    ) : (
                      (currentBlock.config?.items || []).map((item: HomepageCategoryTile, idx: number) => (
                        <div
                          key={item.id || idx}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#e60049] bg-white px-2 py-0.5 rounded border text-[11px]">
                                Ô #{idx + 1}
                              </span>
                              <span className="font-bold text-gray-800">
                                {item.label || '(Chưa đặt tên)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...(currentBlock.config?.items || [])];
                                    const temp = next[idx - 1];
                                    next[idx - 1] = next[idx];
                                    next[idx] = temp;
                                    updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                      ...cfg,
                                      items: next,
                                    }));
                                  }}
                                  className="text-gray-500 hover:text-gray-800 text-[10px] px-1.5 py-0.5 bg-white border rounded"
                                  title="Di chuyển lên"
                                >
                                  ▲
                                </button>
                              )}
                              {idx < (currentBlock.config?.items || []).length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...(currentBlock.config?.items || [])];
                                    const temp = next[idx + 1];
                                    next[idx + 1] = next[idx];
                                    next[idx] = temp;
                                    updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                      ...cfg,
                                      items: next,
                                    }));
                                  }}
                                  className="text-gray-500 hover:text-gray-800 text-[10px] px-1.5 py-0.5 bg-white border rounded"
                                  title="Di chuyển xuống"
                                >
                                  ▼
                                </button>
                              )}
                              <label className="flex items-center gap-1.5 font-semibold cursor-pointer ml-1">
                                <input
                                  type="checkbox"
                                  checked={item.is_active}
                                  onChange={(e) => {
                                    const next = [...(currentBlock.config?.items || [])];
                                    next[idx].is_active = e.target.checked;
                                    updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                      ...cfg,
                                      items: next,
                                    }));
                                  }}
                                  className="rounded text-[#e60049]"
                                />
                                <span>Kích hoạt</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.image_url) {
                                    apiClient.deleteR2File(item.image_url).catch(() => {});
                                  }
                                  const next = (currentBlock.config?.items || []).filter(
                                    (_: any, i: number) => i !== idx
                                  );
                                  updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                    ...cfg,
                                    items: next,
                                  }));
                                }}
                                className="text-red-500 hover:text-red-700 font-bold text-xs ml-2"
                              >
                                Xóa ô này
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                                Tên hiển thị danh mục:
                              </label>
                              <input
                                type="text"
                                value={item.label}
                                placeholder="Ví dụ: Flashcard, Cấp THPT..."
                                onChange={(e) => {
                                  const next = [...(currentBlock.config?.items || [])];
                                  next[idx].label = e.target.value;
                                  updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                    ...cfg,
                                    items: next,
                                  }));
                                }}
                                className="w-full p-1.5 border border-gray-300 rounded text-xs font-bold bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                                Icon text (khi chưa có ảnh):
                              </label>
                              <input
                                type="text"
                                value={item.icon_code}
                                placeholder="+, %, 12, A+..."
                                onChange={(e) => {
                                  const next = [...(currentBlock.config?.items || [])];
                                  next[idx].icon_code = e.target.value;
                                  updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                    ...cfg,
                                    items: next,
                                  }));
                                }}
                                className="w-full p-1.5 border border-gray-300 rounded text-xs text-center font-bold bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                              Hình ảnh ô vuông (Tự scale - Upload R2 hoặc dán link view):
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.image_url || ''}
                                placeholder="Dán link view ảnh hoặc bấm Upload..."
                                onChange={(e) => {
                                  const next = [...(currentBlock.config?.items || [])];
                                  next[idx].image_url = e.target.value;
                                  updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                    ...cfg,
                                    items: next,
                                  }));
                                }}
                                className="flex-1 p-1.5 border border-gray-300 rounded text-xs bg-white"
                              />
                              <label className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-2.5 py-1 text-[11px] font-bold cursor-pointer shrink-0">
                                {uploading === `cat_img_${idx}` ? 'Đang up...' : 'Upload ảnh R2'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleUploadFile(
                                        e.target.files[0],
                                        (url) => {
                                          const next = [...(currentBlock.config?.items || [])];
                                          next[idx].image_url = url;
                                          updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                            ...cfg,
                                            items: next,
                                          }));
                                        },
                                        `cat_img_${idx}`,
                                        {
                                          oldUrl: item.image_url,
                                          pageLevel1: 'Danh muc',
                                          pageLevel2: item.label || `O ${idx + 1}`,
                                        }
                                      );
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            {item.image_url && (
                              <div className="mt-1 flex items-center justify-between gap-2 p-1 bg-white rounded border">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <img
                                    src={item.image_url}
                                    alt="thumb"
                                    className="w-8 h-8 object-contain rounded bg-pink-50 p-1 border shrink-0"
                                  />
                                  <span className="text-[10px] text-gray-500 truncate">{item.image_url}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.image_url) {
                                      apiClient.deleteR2File(item.image_url).catch(() => {});
                                    }
                                    const next = [...(currentBlock.config?.items || [])];
                                    next[idx].image_url = '';
                                    updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                      ...cfg,
                                      items: next,
                                    }));
                                  }}
                                  className="text-red-500 hover:text-red-700 text-[10px] font-bold shrink-0 ml-1"
                                >
                                  Xóa ảnh
                                </button>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                              Đường dẫn đích (Link https:// ngoài hoặc link nội bộ root /url):
                            </label>
                            <input
                              type="text"
                              value={item.to}
                              placeholder="Ví dụ: /flashcard hoặc https://..."
                              onBlur={(e) => {
                                const norm = normalizeTargetUrl(e.target.value);
                                const next = [...(currentBlock.config?.items || [])];
                                next[idx].to = norm === '#' ? '' : norm;
                                updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                  ...cfg,
                                  items: next,
                                }));
                              }}
                              onChange={(e) => {
                                const next = [...(currentBlock.config?.items || [])];
                                next[idx].to = e.target.value;
                                updateCurrentConfig((cfg: HomepageCategoriesGridConfig) => ({
                                  ...cfg,
                                  items: next,
                                }));
                              }}
                              className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 4. NHÓM TÀI LIỆU & SẢN PHẨM */}
              {currentBlock.type === 'section_groups' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">
                      Danh sách các nhóm cấp 1 ({(currentBlock.config?.sections || []).length} nhóm):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSecId = `sec-${Date.now()}`;
                        updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                          ...cfg,
                          sections: [
                            ...(cfg.sections || []),
                            {
                              id: newSecId,
                              title: 'Tên nhóm cấp 1 mới',
                              is_active: true,
                              sort_order: (cfg.sections || []).length + 1,
                              items: [],
                            },
                          ],
                        }));
                      }}
                      className="bg-[#e60049] hover:bg-[#cc0041] text-white text-[11px] font-bold px-3 py-1 rounded-sm shadow-sm"
                    >
                      + Thêm nhóm cấp 1 mới
                    </button>
                  </div>

                  {(currentBlock.config?.sections || []).length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 border border-dashed rounded-md bg-gray-50">
                      Chưa có nhóm nào. Bấm nút phía trên để thêm nhóm cấp 1.
                    </div>
                  ) : (
                    (currentBlock.config?.sections || []).map((sec: HomepageSectionGroup, sIdx: number) => (
                      <div
                        key={sec.id || sIdx}
                        className="border-2 border-purple-200 bg-purple-50/20 rounded-md p-4 space-y-4"
                      >
                        {/* Tiêu đề nhóm cấp 1 */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                              Nhóm #{sIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={sec.title}
                              onChange={(e) => {
                                const next = [...(currentBlock.config?.sections || [])];
                                next[sIdx].title = e.target.value;
                                updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                  ...cfg,
                                  sections: next,
                                }));
                              }}
                              className="text-xs font-extrabold text-purple-950 p-1.5 border border-purple-300 rounded bg-white flex-1"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 text-xs font-bold text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.is_active}
                                onChange={(e) => {
                                  const next = [...(currentBlock.config?.sections || [])];
                                  next[sIdx].is_active = e.target.checked;
                                  updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                    ...cfg,
                                    sections: next,
                                  }));
                                }}
                                className="rounded text-[#e60049]"
                              />
                              <span>Kích hoạt nhóm</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const secToDelete = currentBlock.config?.sections?.[sIdx];
                                if (secToDelete?.items) {
                                  secToDelete.items.forEach((it: any) => {
                                    if (it.image_url) apiClient.deleteR2File(it.image_url).catch(() => {});
                                  });
                                }
                                const next = (currentBlock.config?.sections || []).filter(
                                  (_: any, i: number) => i !== sIdx
                                );
                                updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                  ...cfg,
                                  sections: next,
                                }));
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-bold"
                            >
                              Xóa nhóm này
                            </button>
                          </div>
                        </div>

                        {/* Danh sách các sản phẩm cấp 2 */}
                        <div className="space-y-3 pl-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-600">
                              Sản phẩm cấp 2 trong nhóm ({sec.items.length}):
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newItemId = `item-${Date.now()}`;
                                const next = [...(currentBlock.config?.sections || [])];
                                next[sIdx].items = [
                                  ...(next[sIdx].items || []),
                                  {
                                    id: newItemId,
                                    display_title: '',
                                    image_url: '',
                                    target_url: '',
                                    badge_text: '',
                                    tag_text: '',
                                    is_active: true,
                                    sort_order: (next[sIdx].items || []).length + 1,
                                  },
                                ];
                                updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                  ...cfg,
                                  sections: next,
                                }));
                              }}
                              className="text-[#e60049] hover:underline text-[11px] font-bold"
                            >
                              + Thêm sản phẩm con vào nhóm này
                            </button>
                          </div>

                          {sec.items.map((item: HomepageSectionItem, itIdx: number) => (
                            <div
                              key={item.id || itIdx}
                              className="p-3 bg-white border border-gray-200 rounded text-xs space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-700">Tài liệu #{itIdx + 1}</span>
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-1 font-semibold cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.is_active}
                                      onChange={(e) => {
                                        const next = [...(currentBlock.config?.sections || [])];
                                        next[sIdx].items[itIdx].is_active = e.target.checked;
                                        updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                          ...cfg,
                                          sections: next,
                                        }));
                                      }}
                                      className="rounded text-[#e60049]"
                                    />
                                    <span>Hiển thị</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const itemToDelete = currentBlock.config?.sections?.[sIdx]?.items?.[itIdx];
                                      if (itemToDelete?.image_url) {
                                        apiClient.deleteR2File(itemToDelete.image_url).catch(() => {});
                                      }
                                      const next = [...(currentBlock.config?.sections || [])];
                                      next[sIdx].items = next[sIdx].items.filter(
                                        (_: any, i: number) => i !== itIdx
                                      );
                                      updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                        ...cfg,
                                        sections: next,
                                      }));
                                    }}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                                  Tên hiển thị tự đặt (Không tự lấy từ url):
                                </label>
                                <input
                                  type="text"
                                  value={item.display_title}
                                  placeholder="Ví dụ: 30 đề thi thử ngôn ngữ Anh..."
                                  onChange={(e) => {
                                    const next = [...(currentBlock.config?.sections || [])];
                                    next[sIdx].items[itIdx].display_title = e.target.value;
                                    updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                      ...cfg,
                                      sections: next,
                                    }));
                                  }}
                                  className="w-full p-1.5 border border-gray-300 rounded font-bold"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                                  Hình ảnh (Tự scale - Upload R2 hoặc dán link view):
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={item.image_url || ''}
                                    placeholder="Dán link view ảnh..."
                                    onChange={(e) => {
                                      const next = [...(currentBlock.config?.sections || [])];
                                      next[sIdx].items[itIdx].image_url = e.target.value;
                                      updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                        ...cfg,
                                        sections: next,
                                      }));
                                    }}
                                    className="flex-1 p-1.5 border border-gray-300 rounded text-xs"
                                  />
                                  <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2.5 py-1 text-[11px] font-bold cursor-pointer shrink-0">
                                    {uploading === `sec_${sIdx}_item_${itIdx}`
                                      ? 'Đang up...'
                                      : 'Upload R2'}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleUploadFile(
                                            e.target.files[0],
                                            (url) => {
                                              const next = [...(currentBlock.config?.sections || [])];
                                              next[sIdx].items[itIdx].image_url = url;
                                              updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                                ...cfg,
                                                sections: next,
                                              }));
                                            },
                                            `sec_${sIdx}_item_${itIdx}`,
                                            {
                                              oldUrl: item.image_url,
                                              pageLevel1: sec.title || 'Nhom tai lieu',
                                              pageLevel2: item.display_title || `San pham ${itIdx + 1}`,
                                            }
                                          );
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                                {item.image_url && (
                                  <div className="mt-1 flex items-center justify-between gap-2 p-1 bg-gray-50 rounded border">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <img
                                        src={item.image_url}
                                        alt="thumb"
                                        className="w-8 h-8 object-contain rounded bg-white p-1 border shrink-0"
                                      />
                                      <span className="text-[10px] text-gray-500 truncate">{item.image_url}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (item.image_url) {
                                          apiClient.deleteR2File(item.image_url).catch(() => {});
                                        }
                                        const next = [...(currentBlock.config?.sections || [])];
                                        next[sIdx].items[itIdx].image_url = '';
                                        updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                          ...cfg,
                                          sections: next,
                                        }));
                                      }}
                                      className="text-red-500 hover:text-red-700 text-[10px] font-bold shrink-0 ml-1"
                                    >
                                      Xóa ảnh
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                                    Dòng chữ phụ / tag:
                                  </label>
                                  <input
                                    type="text"
                                    value={item.tag_text || ''}
                                    onChange={(e) => {
                                      const next = [...(currentBlock.config?.sections || [])];
                                      next[sIdx].items[itIdx].tag_text = e.target.value;
                                      updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                        ...cfg,
                                        sections: next,
                                      }));
                                    }}
                                    className="w-full p-1.5 border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                                    Huy hiệu (Mới, Hot...):
                                  </label>
                                  <input
                                    type="text"
                                    value={item.badge_text || ''}
                                    onChange={(e) => {
                                      const next = [...(currentBlock.config?.sections || [])];
                                      next[sIdx].items[itIdx].badge_text = e.target.value;
                                      updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                        ...cfg,
                                        sections: next,
                                      }));
                                    }}
                                    className="w-full p-1.5 border border-gray-300 rounded"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                                  Đường dẫn đích (target_url - Link https:// ngoài hoặc link nội bộ root /url):
                                </label>
                                <input
                                  type="text"
                                  value={item.target_url || ''}
                                  placeholder="Ví dụ: /high-school/dgnl-bca hoặc https://..."
                                  onBlur={(e) => {
                                    const norm = normalizeTargetUrl(e.target.value);
                                    const next = [...(currentBlock.config?.sections || [])];
                                    next[sIdx].items[itIdx].target_url = norm === '#' ? '' : norm;
                                    updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                      ...cfg,
                                      sections: next,
                                    }));
                                  }}
                                  onChange={(e) => {
                                    const next = [...(currentBlock.config?.sections || [])];
                                    next[sIdx].items[itIdx].target_url = e.target.value;
                                    updateCurrentConfig((cfg: HomepageSectionGroupsConfig) => ({
                                      ...cfg,
                                      sections: next,
                                    }));
                                  }}
                                  className="w-full p-1.5 border border-gray-300 rounded"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 5. THÔNG BÁO & NÚT LIÊN KẾT */}
              {currentBlock.type === 'notice_text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nội dung thông báo (hỗ trợ xuống dòng):
                    </label>
                    <textarea
                      rows={4}
                      value={currentBlock.config?.text || ''}
                      onChange={(e) =>
                        updateCurrentConfig((cfg: HomepageNoticeTextConfig) => ({
                          ...cfg,
                          text: e.target.value,
                        }))
                      }
                      placeholder="Nhập thông báo..."
                      className="w-full text-xs p-2.5 border border-gray-300 rounded outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Chữ trên nút bấm:
                      </label>
                      <input
                        type="text"
                        value={currentBlock.config?.cta_button_text || ''}
                        onChange={(e) =>
                          updateCurrentConfig((cfg: HomepageNoticeTextConfig) => ({
                            ...cfg,
                            cta_button_text: e.target.value,
                          }))
                        }
                        placeholder="Xem toàn bộ"
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Đường dẫn nút bấm (Link https:// ngoài hoặc link nội bộ root /url):
                      </label>
                      <input
                        type="text"
                        value={currentBlock.config?.cta_button_link || ''}
                        placeholder="Ví dụ: /high-school hoặc https://facebook.com/groups/..."
                        onBlur={(e) => {
                          const norm = normalizeTargetUrl(e.target.value);
                          updateCurrentConfig((cfg: HomepageNoticeTextConfig) => ({
                            ...cfg,
                            cta_button_link: norm === '#' ? '' : norm,
                          }));
                        }}
                        onChange={(e) =>
                          updateCurrentConfig((cfg: HomepageNoticeTextConfig) => ({
                            ...cfg,
                            cta_button_link: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. BOTTOM BANNER */}
              {currentBlock.type === 'bottom_banner' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="bottom_banner_mode"
                        value="structured"
                        checked={currentBlock.config?.mode === 'structured'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                            ...cfg,
                            mode: 'structured',
                          }))
                        }
                      />
                      <span>Bộ sách 3D + Chữ chuẩn</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="bottom_banner_mode"
                        value="custom_image"
                        checked={currentBlock.config?.mode === 'custom_image'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                            ...cfg,
                            mode: 'custom_image',
                          }))
                        }
                      />
                      <span>Tải ảnh Banner mới</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="bottom_banner_mode"
                        value="custom_html"
                        checked={currentBlock.config?.mode === 'custom_html'}
                        onChange={() =>
                          updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                            ...cfg,
                            mode: 'custom_html',
                          }))
                        }
                      />
                      <span>Dán đoạn mã HTML</span>
                    </label>
                  </div>

                  {currentBlock.config?.mode === 'custom_html' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Mã HTML tùy biến:
                      </label>
                      <textarea
                        rows={10}
                        value={currentBlock.config?.custom_html || ''}
                        onChange={(e) =>
                          updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                            ...cfg,
                            custom_html: e.target.value,
                          }))
                        }
                        className="w-full font-mono text-xs p-3 border border-gray-300 rounded"
                      />
                    </div>
                  ) : currentBlock.config?.mode === 'custom_image' ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Link ảnh hoặc tải ảnh mới:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentBlock.config?.custom_image_url || ''}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                              ...cfg,
                              custom_image_url: e.target.value,
                            }))
                          }
                          className="flex-1 text-xs p-2 border border-gray-300 rounded"
                        />
                        <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-3 py-1.5 text-xs font-bold cursor-pointer shrink-0">
                          {uploading === 'bottom_banner_img' ? 'Đang tải...' : 'Upload ảnh R2'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadFile(
                                  e.target.files[0],
                                  (url) =>
                                    updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                                      ...cfg,
                                      custom_image_url: url,
                                    })),
                                  'bottom_banner_img',
                                  {
                                    oldUrl: currentBlock.config?.custom_image_url,
                                    pageLevel1: 'Trang chu',
                                    pageLevel2: 'Bottom Banner',
                                  }
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      {currentBlock.config?.custom_image_url && (
                        <div className="flex items-center gap-3">
                          <img
                            src={currentBlock.config.custom_image_url}
                            alt="Bottom Banner Preview"
                            className="max-h-48 rounded border p-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (currentBlock.config?.custom_image_url) {
                                apiClient.deleteR2File(currentBlock.config.custom_image_url).catch(() => {});
                              }
                              updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                                ...cfg,
                                custom_image_url: '',
                              }));
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Đường dẫn đích khi click banner (Link https:// ngoài hoặc link nội bộ root /url):
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.link_url || ''}
                          placeholder="Ví dụ: /high-school hoặc https://..."
                          onBlur={(e) => {
                            const norm = normalizeTargetUrl(e.target.value);
                            updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                              ...cfg,
                              link_url: norm === '#' ? '' : norm,
                            }));
                          }}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                              ...cfg,
                              link_url: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Tiêu đề lớn:
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.title || ''}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                              ...cfg,
                              title: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2 border border-gray-300 rounded font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Đường dẫn đích khi click (Link https:// ngoài hoặc link nội bộ root /url):
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.link_url || ''}
                          placeholder="Ví dụ: /high-school hoặc https://..."
                          onBlur={(e) => {
                            const norm = normalizeTargetUrl(e.target.value);
                            updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                              ...cfg,
                              link_url: norm === '#' ? '' : norm,
                            }));
                          }}
                          onChange={(e) =>
                            updateCurrentConfig((cfg: HomepageBottomBannerConfig) => ({
                              ...cfg,
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
          ) : (
            <div className="text-center py-10 text-gray-500 text-xs">
              Chưa chọn khung nào để cấu hình.
            </div>
          )}
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW THEO ĐÚNG THỨ TỰ (SIDE-BY-SIDE NẾU BẬT) */}
        {isSideBySide && (
          <div className="xl:col-span-6 sticky top-4 space-y-3">
            <div className="bg-gray-800 text-white p-3 rounded-t-md flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Live Preview Toàn Trang Chủ
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-900 px-2 py-1 rounded text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    previewViewport === 'desktop' ? 'bg-[#e60049] text-white' : 'text-gray-400'
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    previewViewport === 'mobile' ? 'bg-[#e60049] text-white' : 'text-gray-400'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-b-md p-4 overflow-x-auto max-h-[820px] overflow-y-auto">
              <div
                className={`mx-auto bg-white shadow-md rounded overflow-hidden transition-all duration-300 ${
                  previewViewport === 'mobile' ? 'w-[375px]' : 'w-full'
                }`}
              >
                {/* Render toàn bộ các block theo đúng thứ tự đã sắp xếp */}
                <div className="space-y-10 py-6">
                  {blocks
                    .filter((b) => b.is_active !== false)
                    .map((block) => {
                      if (block.type === 'hero') {
                        return <HeroBlock key={block.id} config={block.config} />;
                      }

                      return (
                        <div key={block.id} className="max-w-[920px] mx-auto px-4">
                          {block.type === 'top_banner' && <TopBannerBlock config={block.config} />}
                          {block.type === 'categories_grid' && (
                            <CategoriesGridBlock config={block.config} />
                          )}
                          {block.type === 'section_groups' && (
                            <SectionGroupsBlock config={block.config} />
                          )}
                          {block.type === 'notice_text' && <NoticeTextBlock config={block.config} />}
                          {block.type === 'bottom_banner' && (
                            <BottomBannerBlock config={block.config} />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
