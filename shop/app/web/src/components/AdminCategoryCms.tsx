import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import {
  CategoryBannerBlockConfig,
  CategoryBlockItem,
  CategoryBlockType,
  CategoryHeroBlockConfig,
  CategoryItem,
  CategoryNoticeBlockConfig,
  CategorySectionBlockConfig,
  CategorySectionCardItem,
  Product,
} from '../types';
import {
  buildInitialCategoryBlocks,
  CategoryBannerBlock,
  CategoryHeroBlock,
  CategoryNoticeBlock,
  CategorySectionBlock,
  GiftHeroAnchorsBlock,
  GiftFormEmbedBlock,
  GiftDonateCtaBlock,
} from './DynamicCategoryBlocks';
import { normalizeTargetUrl } from './SmartLink';
import { R2ImageUploader } from './R2ImageUploader';
import { UniversalBlockCardRepeater } from './UniversalBlockCardRepeater';
import { UniversalBlockRenderer } from './UniversalBlockRenderer';

const CATEGORY_BLOCK_META: Record<
  CategoryBlockType,
  { label: string; badgeColor: string; desc: string }
> = {
  category_hero: {
    label: 'PHẦN 1: Đầu trang & Mục lục Nhảy nhanh (Tiêu đề đỏ, ánh hồng, gạch chân)',
    badgeColor: 'bg-blue-600 text-white',
    desc: 'Tiêu đề lớn màu đỏ, mô tả phụ và danh sách liên kết gạch chân cuộn mượt xuống từng nhóm.',
  },
  category_section: {
    label: 'PHẦN 2, 3, 4: Nhóm Tài liệu Lưới 3 Cột (VD: Đề thi, Bổ trợ, Từ vựng...)',
    badgeColor: 'bg-[#e60049] text-white',
    desc: 'Lưới 3 cột thẻ tài liệu, hỗ trợ ảnh độc lập nguyên bản, nút Đọc thử và tên sách căn giữa.',
  },
  category_banner: {
    label: 'PHẦN MỞ RỘNG: Banner Ngang Độc Lập (Full-width, không bọc khung vàng)',
    badgeColor: 'bg-purple-600 text-white',
    desc: 'Banner ảnh ngang đứng độc lập một mình, chèn vào bất kỳ vị trí nào trên Trang cấp 1.',
  },
  category_notice: {
    label: 'PHẦN MỞ RỘNG: Hộp Ghi chú & Lưu ý',
    badgeColor: 'bg-amber-600 text-white',
    desc: 'Hộp văn bản thông báo hoặc ghi chú ngắn với nền hồng, xám hoặc trắng.',
  },
  gift_hero_anchors: {
    label: 'QUÀ TẶNG: Tiêu đề & Cụm nút Anchor chuyển mục',
    badgeColor: 'bg-emerald-600 text-white',
    desc: 'Tiêu đề lớn Tài liệu miễn phí và danh sách các nút đỏ bo góc dẫn đến từng chuyên mục quà tặng.',
  },
  gift_form_embed: {
    label: 'QUÀ TẶNG: Khung Form nhận tài liệu miễn phí',
    badgeColor: 'bg-pink-600 text-white',
    desc: 'Nhúng Google Form hoặc form nội bộ để khách hàng nhập Gmail và chọn nghề nghiệp nhận file.',
  },
  gift_donate_cta: {
    label: 'QUÀ TẶNG: Khung kêu gọi Ủng hộ tác giả (Donate CTA)',
    badgeColor: 'bg-red-600 text-white',
    desc: 'Dòng text kêu gọi ủng hộ tác giả kèm nút đỏ dẫn trực tiếp sang trang /donate.',
  },
};

function collectBlockR2Urls(block: CategoryBlockItem): string[] {
  const urls: string[] = [];
  if (!block || !block.config) return urls;
  if (block.type === 'category_banner') {
    const cfg = block.config as CategoryBannerBlockConfig;
    if (cfg.image_url) urls.push(cfg.image_url);
  } else if (block.type === 'category_section') {
    const cfg = block.config as CategorySectionBlockConfig;
    (cfg.items || []).forEach((it) => {
      if (it.image_url) urls.push(it.image_url);
    });
  }
  return urls;
}

export const AdminCategoryCms: React.FC = () => {
  const { categories, products, refreshCatalog, showToast } = useStore();

  const [selectedCatSlug, setSelectedCatSlug] = useState<string>('high-school');
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryItem>>({
    name: '',
    slug: '',
    description: '',
    sort_order: 1,
    is_active: true,
    blocks: [],
  });

  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);

  // Đồng bộ category khi chọn từ danh sách
  useEffect(() => {
    if (categories.length > 0) {
      const found = categories.find((c) => c.slug === selectedCatSlug) || categories[0];
      if (found) {
        setSelectedCatSlug(found.slug);
        const catProds = products.filter((p) => p.category_slug === found.slug);
        const initialBlocks =
          Array.isArray(found.blocks) && found.blocks.length > 0
            ? found.blocks
            : buildInitialCategoryBlocks(found, catProds);

        setEditingCategory({
          ...found,
          blocks: initialBlocks,
        });
      }
    }
  }, [categories, selectedCatSlug, products]);

  const blocks: CategoryBlockItem[] = Array.isArray(editingCategory.blocks)
    ? editingCategory.blocks
    : [];

  const handleSelectCategory = (cat: CategoryItem) => {
    setSelectedCatSlug(cat.slug);
    const catProds = products.filter((p) => p.category_slug === cat.slug);
    const initialBlocks =
      Array.isArray(cat.blocks) && cat.blocks.length > 0
        ? cat.blocks
        : buildInitialCategoryBlocks(cat, catProds);

    setEditingCategory({
      ...cat,
      blocks: initialBlocks,
    });
  };

  const handleResetNewCategory = () => {
    const defaultBlocks: CategoryBlockItem[] = [
      {
        id: `cblock_hero_${Date.now()}`,
        type: 'category_hero',
        title_label: 'Phần 1: Đầu trang & Mục lục',
        is_active: true,
        sort_order: 1,
        config: {
          title: 'Danh mục tài liệu mới',
          subtitle: '',
          show_pink_glow: true,
          anchor_mode: 'auto_from_sections',
          custom_anchors: [],
          is_active: true,
        } as CategoryHeroBlockConfig,
      },
      {
        id: `cblock_sec_${Date.now() + 1}`,
        type: 'category_section',
        title_label: 'Phần 2: Nhóm tài liệu #1',
        is_active: true,
        sort_order: 2,
        config: {
          title: 'Tài liệu trọng tâm',
          anchor_id: 'sec-tai-lieu-trong-tam',
          mode: 'manual',
          items: [],
          is_active: true,
        } as CategorySectionBlockConfig,
      },
    ];

    setEditingCategory({
      id: undefined,
      name: '',
      slug: '',
      description: '',
      sort_order: categories.length + 1,
      is_active: true,
      blocks: defaultBlocks,
    });
  };

  const createEmptyBlock = (type: CategoryBlockType, sortOrder: number): CategoryBlockItem => {
    const id = `cblock_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    switch (type) {
      case 'category_hero':
        return {
          id,
          type,
          title_label: CATEGORY_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            title: editingCategory.name || 'Danh mục tài liệu',
            subtitle: editingCategory.description || '',
            show_pink_glow: true,
            anchor_mode: 'auto_from_sections',
            custom_anchors: [],
            is_active: true,
          } as CategoryHeroBlockConfig,
        };
      case 'category_section':
        return {
          id,
          type,
          title_label: CATEGORY_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            title: 'Nhóm tài liệu mới',
            anchor_id: `sec-${Date.now()}`,
            mode: 'manual',
            items: [],
            is_active: true,
          } as CategorySectionBlockConfig,
        };
      case 'category_banner':
        return {
          id,
          type,
          title_label: CATEGORY_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            header_label: '',
            image_url: '',
            link_url: '',
            is_active: true,
          } as CategoryBannerBlockConfig,
        };
      case 'category_notice':
        return {
          id,
          type,
          title_label: CATEGORY_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            title: '',
            content: 'Nội dung ghi chú...',
            bg_style: 'pink',
            is_active: true,
          } as CategoryNoticeBlockConfig,
        };
      case 'gift_hero_anchors':
        return {
          id,
          type,
          title_label: CATEGORY_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            title: 'Tài liệu miễn phí',
            subtitle: '',
            anchors: [
              { id: 'anc_1', label: 'Đề chính thức', target_url: '/gifts/de-thi-chinh-thuc' },
              { id: 'anc_2', label: 'Đề trường, sở', target_url: '/gifts/de-truong-so' },
            ],
          },
        };
      case 'gift_form_embed':
        return {
          id,
          type,
          title_label: CATEGORY_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            form_title: 'Nhận tài liệu miễn phí từ Huy Tutor',
            form_url: '',
            iframe_height: 750,
          },
        };
      case 'gift_donate_cta':
        return {
          id,
          type,
          title_label: CATEGORY_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            prompt_text: 'Ủng hộ tác giả để có thêm những tài liệu chất lượng!',
            button_text: 'Ủng hộ tác giả',
            target_url: '/donate',
            is_active: true,
          },
        };
    }
  };

  const handleAddBlock = (type: CategoryBlockType) => {
    const next = [...blocks, createEmptyBlock(type, blocks.length + 1)];
    setEditingCategory((prev) => ({ ...prev, blocks: next }));
  };

  const handleMoveBlock = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    setEditingCategory((prev) => ({
      ...prev,
      blocks: next.map((b, i) => ({ ...b, sort_order: i + 1 })),
    }));
  };

  const handleToggleActive = (idx: number) => {
    const next = [...blocks];
    next[idx] = { ...next[idx], is_active: !next[idx].is_active };
    setEditingCategory((prev) => ({ ...prev, blocks: next }));
  };

  const handleRemoveBlock = async (idx: number) => {
    const targetBlock = blocks[idx];
    const r2Urls = collectBlockR2Urls(targetBlock);
    for (const u of r2Urls) {
      if (u) apiClient.deleteR2File(u).catch(() => {});
    }
    const next = blocks.filter((_, i) => i !== idx).map((b, i) => ({ ...b, sort_order: i + 1 }));
    setEditingCategory((prev) => ({ ...prev, blocks: next }));
    showToast('Đã xóa khung (và dọn dẹp file R2 đi kèm).');
  };

  const updateBlockConfig = <T,>(idx: number, updater: (prevConfig: T) => T) => {
    const next = [...blocks];
    const current = next[idx];
    next[idx] = {
      ...current,
      config: updater(current.config as T),
    };
    setEditingCategory((prev) => ({ ...prev, blocks: next }));
  };

  const handleSingleUploadR2 = async (
    file: File,
    folder: string,
    keyId: string,
    oldUrl: string | undefined,
    onSuccess: (url: string) => void
  ) => {
    setUploadingKey(keyId);
    try {
      const res = await apiClient.uploadFile(file, {
        folder,
        pageLevel1: editingCategory.slug || 'danh-muc',
        pageLevel2: 'card',
      });
      if (oldUrl && oldUrl !== res.url) {
        apiClient.deleteR2File(oldUrl).catch(() => {});
      }
      onSuccess(res.url);
      showToast('Đã tải ảnh lên Cloudflare R2 thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải ảnh lên R2.');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory.name?.trim()) {
      showToast('Vui lòng nhập Tên danh mục.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.upsertCategory(editingCategory);
      showToast(res.message);
      await refreshCatalog();
      setSelectedCatSlug(res.category.slug);
      setEditingCategory(res.category);
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu danh mục cấp 1.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${slug}"?`)) return;
    try {
      const res = await apiClient.deleteCategory(slug);
      showToast(res.message);
      await refreshCatalog();
      if (categories.length > 0) {
        setSelectedCatSlug(categories[0].slug);
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi xóa danh mục.');
    }
  };

  const currentCategoryProducts = products.filter(
    (p) => p.category_slug === editingCategory.slug && p.is_active !== false
  );

  const activeSectionsForPreview = blocks
    .filter((b) => b.is_active && b.type === 'category_section')
    .map((b) => b.config as CategorySectionBlockConfig);

  return (
    <div className="space-y-6">
      {/* Thanh chọn Danh mục cấp 1 & Nút thêm mới */}
      <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
            Chọn Trang Cấp 1 cần cấu hình:
          </label>
          <select
            value={selectedCatSlug}
            onChange={(e) => {
              const found = categories.find((c) => c.slug === e.target.value);
              if (found) handleSelectCategory(found);
            }}
            className="border border-gray-300 rounded-sm px-3 py-1.5 text-xs font-bold text-[#e60049] bg-white min-w-[280px]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} (/{c.slug})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetNewCategory}
            className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3.5 py-1.5 rounded-sm transition shadow-xs"
          >
            + Tạo Trang Cấp 1 Mới
          </button>
          {editingCategory.slug && (
            <button
              type="button"
              onClick={() => handleDeleteCategory(editingCategory.slug || '')}
              className="bg-red-50 hover:bg-red-100 text-[#e60049] border border-red-200 font-bold text-xs px-3 py-1.5 rounded-sm transition"
            >
              Xóa Trang này
            </button>
          )}
        </div>
      </div>

      {/* Form Cấu hình Chi tiết Trang cấp 1 */}
      <form onSubmit={handleSaveCategory} className="space-y-6">
        {/* Top Header Controls */}
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#e60049] uppercase flex items-center gap-2">
              <span>Quản lý Khối Động Trang Cấp 1 (/{editingCategory.slug || 'category'})</span>
              <span className="text-[10px] bg-pink-100 text-[#e60049] font-black px-2 py-0.5 rounded">
                {blocks.length} KHỐI
              </span>
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Tự do thêm bớt, đổi thứ tự, cấu hình các nhóm tài liệu, banner và mục lục nhảy nhanh mà không cần sửa code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="border border-gray-300 bg-white hover:border-[#e60049] text-gray-700 font-bold text-xs px-3.5 py-2 rounded-sm transition"
            >
              {showLivePreview ? 'Ẩn Xem trước' : '👁️ Xem trước Trang Cấp 1'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#e60049] hover:bg-[#cc0041] disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-sm transition shadow-sm"
            >
              {saving ? 'Đang lưu...' : '💾 Lưu Cấu Hình Khối'}
            </button>
          </div>
        </div>

        {/* Xem trước Live Preview */}
        {showLivePreview && (
          <div className="bg-gray-100 border-2 border-dashed border-pink-300 rounded-md p-4">
            <div className="text-xs font-bold text-[#e60049] uppercase mb-3 flex items-center justify-between">
              <span>Live Preview: Giao diện Trang Cấp 1 thực tế (/{editingCategory.slug})</span>
              <span className="text-[10px] text-gray-500 font-normal">Cập nhật tức thời theo cấu hình bên dưới</span>
            </div>
            <div className="bg-white rounded border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
              <UniversalBlockRenderer
                blocks={blocks}
                context={{
                  pageType: 'category',
                  category: editingCategory as CategoryItem,
                  allProducts: products,
                }}
              />
            </div>
          </div>
        )}

        {/* KHỐI 1: THÔNG TIN CƠ SỞ TRANG CẤP 1 */}
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#e60049] text-white">
                  KHỐI 1: THÔNG TIN CƠ SỞ
                </span>
                <h2 className="text-sm font-black text-gray-900">
                  Cấu hình: {editingCategory.name || 'Trang cấp 1 mới'}
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Thiết lập tên hiển thị, đường dẫn tĩnh slug và thứ tự của trang danh mục cấp 1 trên toàn hệ thống.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Tên Trang Cấp 1 (VD: Danh mục tài liệu Chuẩn mực & Chi tiết cấp THPT) *
              </label>
              <input
                type="text"
                required
                value={editingCategory.name || ''}
                onChange={(e) =>
                  setEditingCategory((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Đường dẫn tĩnh Slug (VD: high-school) *
              </label>
              <input
                type="text"
                required
                value={editingCategory.slug || ''}
                onChange={(e) =>
                  setEditingCategory((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Thứ tự hiển thị</label>
              <input
                type="number"
                value={editingCategory.sort_order ?? 1}
                onChange={(e) =>
                  setEditingCategory((prev) => ({
                    ...prev,
                    sort_order: Number(e.target.value) || 1,
                  }))
                }
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs font-bold"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Mô tả phụ đầu trang (Tuỳ chọn)
              </label>
              <textarea
                rows={2}
                value={editingCategory.description || ''}
                onChange={(e) =>
                  setEditingCategory((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Giới thiệu ngắn về các tài liệu thuộc cấp này..."
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Block Repeater & Universal Picker */}
        <UniversalBlockCardRepeater
          pageTitle={`Trang Cấp 1 (${editingCategory.name || 'Danh mục'})`}
          pageRouteLabel={`/${editingCategory.slug || 'category'}`}
          blocks={blocks}
          onBlocksChange={(newBlocks) => setEditingCategory((prev) => ({ ...prev, blocks: newBlocks }))}
          allProducts={products}
          context={{
            pageType: 'category',
            category: editingCategory as CategoryItem,
            allProducts: products,
          }}
          quickAddTypes={[
            { type: 'category_hero', label: 'Đầu Trang & Mục Lục' },
            { type: 'category_section', label: 'Lưới Tài Liệu 3 Cột' },
            { type: 'category_banner', label: 'Banner Ngang' },
            { type: 'category_notice', label: 'Hộp Ghi Chú' },
            { type: 'gift_hero_anchors', label: 'Quà Tặng Anchor' },
            { type: 'gift_form_embed', label: 'Form Nhúng' },
            { type: 'gift_donate_cta', label: 'Ủng Hộ Donate' },
          ]}
        />
      </form>
    </div>
  );
};