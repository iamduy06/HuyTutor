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

const BLOCK_TYPE_LABELS: Record<HomepageBlockType, { name: string; color: string; desc: string }> = {
  hero: {
    name: 'Khung Đen: Hero Top Header',
    color: 'bg-gray-900 text-white',
    desc: 'Phần đầu trang (Chữ + Hình ảnh R2 bên phải / HTML / Full ảnh)',
  },
  top_banner: {
    name: 'Khung Xanh Dương: Top Banner',
    color: 'bg-sky-700 text-white',
    desc: 'Banner trên (Chữ + Up ảnh R2 / Sách 3D / HTML / Full ảnh)',
  },
  categories_grid: {
    name: 'Khung Vàng: Danh mục ô vuông',
    color: 'bg-amber-600 text-white',
    desc: 'Các ô danh mục sản phẩm linh hoạt số lượng (Upload ảnh R2 / Link)',
  },
  section_groups: {
    name: 'Khung Tím: Nhóm tài liệu cấp 1 & Cấp 2',
    color: 'bg-purple-800 text-white',
    desc: 'Từng nhóm tài liệu & các sản phẩm cấp 2 có tên hiển thị riêng, bật/tắt',
  },
  notice_text: {
    name: 'Khung Xám: Dòng chữ thông báo & Nút',
    color: 'bg-zinc-700 text-white',
    desc: 'Dòng chữ màu xám/hồng + nút chuyển hướng xem toàn bộ',
  },
  bottom_banner: {
    name: 'Khung Nâu: Banner cuối trang',
    color: 'bg-stone-800 text-white',
    desc: 'Banner cuối trang (Ảnh mới / HTML / 3D books)',
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
        title_label: 'Khung Đen: Hero Top Header',
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
        title_label: 'Khung Xanh Dương: Top Banner',
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
        title_label: 'Khung Vàng: Danh mục ô vuông',
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
        title_label: 'Khung Tím: Nhóm tài liệu cấp 1 & Cấp 2',
        is_active: siteConfigs?.homepage_section_groups?.is_active ?? true,
        sort_order: 4,
        config: siteConfigs?.homepage_section_groups || {
          sections: [],
        },
      },
      {
        id: 'block_notice_default',
        type: 'notice_text',
        title_label: 'Khung Xám: Dòng chữ thông báo & Nút',
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
        title_label: 'Khung Nâu: Banner cuối trang',
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

  // Upload ảnh qua R2 API
  const handleUploadFile = async (
    file: File,
    onSuccess: (url: string) => void,
    fieldId: string
  ) => {
    setUploading(fieldId);
    try {
      const res = await apiClient.uploadFile(file);
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

  // Xóa một khối khỏi trang chủ
  const handleDeleteBlock = (id: string) => {
    const next = blocks.filter((b) => b.id !== id);
    next.forEach((b, idx) => {
      b.sort_order = idx + 1;
    });
    setBlocks(next);
    if (selectedBlockId === id) {
      setSelectedBlockId(next[0]?.id || '');
    }
    showToast('Đã xóa khung khỏi trang chủ');
  };

  // Cập nhật config của khối đang chọn
  const updateCurrentConfig = (updater: (prev: any) => any) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === currentBlock.id ? { ...b, config: updater(b.config) } : b))
    );
  };

  // Lưu toàn bộ layout trang chủ vào Supabase
  const handleSaveAllLayout = async () => {
    setSaving(true);
    try {
      await updateSiteConfig('homepage_blocks', blocks);

      // Cập nhật đồng bộ các key lẻ nếu có block tương ứng (đảm bảo tương thích ngược)
      const hero = blocks.find((b) => b.type === 'hero');
      if (hero) await updateSiteConfig('homepage_hero', hero.config);
      const banner = blocks.find((b) => b.type === 'top_banner');
      if (banner) await updateSiteConfig('homepage_top_banner', banner.config);
      const cat = blocks.find((b) => b.type === 'categories_grid');
      if (cat) await updateSiteConfig('homepage_categories_grid', cat.config);
      const sec = blocks.find((b) => b.type === 'section_groups');
      if (sec) await updateSiteConfig('homepage_section_groups', sec.config);
      const noti = blocks.find((b) => b.type === 'notice_text');
      if (noti) await updateSiteConfig('homepage_notice_text', noti.config);
      const btm = blocks.find((b) => b.type === 'bottom_banner');
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

      {/* DANH SÁCH CÁC KHUNG VÀ SẮP XẾP THỨ TỰ (REORDER & ADD NEW) */}
      <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-xs font-black uppercase text-gray-900 tracking-wider">
              Danh sách thứ tự các khung hiển thị trên Trang chủ ({blocks.length} khung)
            </h3>
            <p className="text-[11px] text-gray-500">
              Bấm ▲ Lên hoặc ▼ Xuống để thay đổi vị trí khung trên trang chủ. Bấm vào khung để chỉnh sửa nội dung chi tiết.
            </p>
          </div>

          {/* Nút thêm khung mới */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">+ Thêm khung:</span>
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
                Chọn loại khung muốn thêm...
              </option>
              <option value="hero">Khung Đen: Hero Top Header</option>
              <option value="top_banner">Khung Xanh Dương: Top Banner</option>
              <option value="categories_grid">Khung Vàng: Danh mục ô vuông</option>
              <option value="section_groups">Khung Tím: Nhóm tài liệu cấp 1 &amp; Cấp 2</option>
              <option value="notice_text">Khung Xám: Dòng chữ thông báo &amp; Nút</option>
              <option value="bottom_banner">Khung Nâu: Banner cuối trang</option>
            </select>
          </div>
        </div>

        {/* Danh sách các card khung với nút Di chuyển Lên/Xuống */}
        <div className="space-y-2">
          {blocks.map((block, idx) => {
            const isSelected = block.id === currentBlock?.id;
            const info = BLOCK_TYPE_LABELS[block.type] || {
              name: block.type,
              color: 'bg-gray-700 text-white',
              desc: '',
            };

            return (
              <div
                key={block.id}
                className={`flex items-center justify-between p-3 rounded-md border transition ${
                  isSelected
                    ? 'border-[#e60049] bg-pink-50/40 shadow-sm ring-1 ring-[#e60049]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Vị trí thứ tự & Nút Reorder */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveBlockUp(idx)}
                      className="text-gray-500 hover:text-[#e60049] disabled:opacity-20 text-[11px] p-0.5 font-bold leading-none"
                      title="Di chuyển lên"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === blocks.length - 1}
                      onClick={() => handleMoveBlockDown(idx)}
                      className="text-gray-500 hover:text-[#e60049] disabled:opacity-20 text-[11px] p-0.5 font-bold leading-none"
                      title="Di chuyển xuống"
                    >
                      ▼
                    </button>
                  </div>

                  <span className="font-mono text-xs font-extrabold text-gray-500 w-6">
                    #{idx + 1}
                  </span>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${info.color}`}
                  >
                    {block.type}
                  </span>

                  {/* Input tên gợi nhớ */}
                  <input
                    type="text"
                    value={block.title_label || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBlocks((prev) =>
                        prev.map((b) => (b.id === block.id ? { ...b, title_label: val } : b))
                      );
                    }}
                    placeholder={info.name}
                    className="text-xs font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-[#e60049] outline-none px-1 py-0.5 bg-transparent min-w-[200px]"
                  />
                </div>

                {/* Các nút hành động bên phải */}
                <div className="flex items-center gap-3">
                  {/* Công tắc Bật/Tắt */}
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={block.is_active}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBlocks((prev) =>
                          prev.map((b) => (b.id === block.id ? { ...b, is_active: checked } : b))
                        );
                      }}
                      className="rounded text-[#e60049]"
                    />
                    <span>{block.is_active ? 'Đang hiện' : 'Ẩn'}</span>
                  </label>

                  {/* Nút Chọn để chỉnh sửa */}
                  <button
                    type="button"
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`text-xs font-bold px-3 py-1 rounded-sm transition ${
                      isSelected
                        ? 'bg-[#e60049] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected ? 'Đang sửa' : 'Cấu hình chi tiết'}
                  </button>

                  {/* Nút Xóa */}
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="text-gray-400 hover:text-red-600 text-xs font-bold px-1.5"
                    title="Xóa khung này"
                  >
                    Xóa
                  </button>
                </div>
              </div>
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
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#e60049] tracking-wider">
                    ĐANG CẤU HÌNH KHUNG #{currentBlockIndex + 1}
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 mt-0.5">
                    {currentBlock.title_label || BLOCK_TYPE_LABELS[currentBlock.type]?.name}
                  </h3>
                </div>
                <span className="text-[11px] text-gray-500">
                  Loại: <strong>{currentBlock.type}</strong>
                </span>
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
                                  'hero_custom_img'
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      {currentBlock.config?.custom_image_url && (
                        <img
                          src={currentBlock.config.custom_image_url}
                          alt="Preview"
                          className="max-h-48 rounded border p-1"
                        />
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
                                    'hero_img'
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
                              onClick={() =>
                                updateCurrentConfig((cfg: HomepageHeroConfig) => ({
                                  ...cfg,
                                  image_url: '',
                                }))
                              }
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

              {/* 2. KHUNG XANH DƯƠNG: TOP BANNER */}
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
                                  'top_banner_full'
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      {currentBlock.config?.custom_image_url && (
                        <img
                          src={currentBlock.config.custom_image_url}
                          alt="Banner Preview"
                          className="max-h-48 rounded border p-1"
                        />
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Đường dẫn khi click vào banner:
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.link_url || ''}
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
                                      'top_banner_img'
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
                                onClick={() =>
                                  updateCurrentConfig((cfg: HomepageTopBannerConfig) => ({
                                    ...cfg,
                                    image_url: '',
                                  }))
                                }
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
                          Đường dẫn khi click vào banner:
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.link_url || ''}
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

              {/* 3. KHUNG VÀNG: DANH MỤC Ô VUÔNG (DYNAMIC SỐ LƯỢNG) */}
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
                                        `cat_img_${idx}`
                                      );
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            {item.image_url && (
                              <div className="mt-1 flex items-center gap-2">
                                <img
                                  src={item.image_url}
                                  alt="thumb"
                                  className="w-8 h-8 object-contain rounded bg-pink-50 p-1 border"
                                />
                                <span className="text-[10px] text-gray-500 truncate">{item.image_url}</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                              Đường link dẫn tới:
                            </label>
                            <input
                              type="text"
                              value={item.to}
                              placeholder="/flashcard, /high-school..."
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

              {/* 4. KHUNG TÍM: NHÓM TÀI LIỆU CẤP 1 & CẤP 2 */}
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
                                            `sec_${sIdx}_item_${itIdx}`
                                          );
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
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
                                  Đường dẫn đích (target_url):
                                </label>
                                <input
                                  type="text"
                                  value={item.target_url || ''}
                                  placeholder="/high-school/dgnl-bca..."
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

              {/* 5. KHUNG XÁM: DÒNG CHỮ THÔNG BÁO & NÚT */}
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
                        Đường dẫn nút bấm:
                      </label>
                      <input
                        type="text"
                        value={currentBlock.config?.cta_button_link || ''}
                        onChange={(e) =>
                          updateCurrentConfig((cfg: HomepageNoticeTextConfig) => ({
                            ...cfg,
                            cta_button_link: e.target.value,
                          }))
                        }
                        placeholder="/high-school"
                        className="w-full text-xs p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. KHUNG NÂU: BOTTOM BANNER */}
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
                                  'bottom_banner_img'
                                );
                              }
                            }}
                          />
                        </label>
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
                          Đường link khi click:
                        </label>
                        <input
                          type="text"
                          value={currentBlock.config?.link_url || ''}
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
