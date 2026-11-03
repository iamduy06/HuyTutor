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
        {/* Thông tin cơ bản */}
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#e60049]">
                THÔNG TIN CƠ SỞ TRANG CẤP 1
              </span>
              <h2 className="text-sm font-black text-gray-900 mt-0.5">
                Cấu hình: {editingCategory.name || 'Trang cấp 1 mới'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLivePreview((prev) => !prev)}
                className={`font-bold text-xs px-3 py-1.5 rounded-sm border transition ${
                  showLivePreview
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                }`}
              >
                {showLivePreview ? 'Đóng Xem trước' : 'Xem trước Giao diện Trang Cấp 1'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-1.5 rounded-sm transition shadow-xs"
              >
                {saving ? 'Đang lưu...' : 'Lưu Trang Cấp 1'}
              </button>
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

        {/* Builder UI cho các khối động Trang cấp 1 (category_blocks) */}
        <div className="border-2 border-[#e60049]/30 rounded-md p-4 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div>
              <span className="inline-block bg-[#e60049] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-sm mb-1">
                BỐ CỤC ĐỘNG TRANG CẤP 1 (`category_blocks`)
              </span>
              <h3 className="text-sm font-black text-gray-900">
                Trình thiết kế các Khung &amp; Nhóm Tài liệu (Tương tự Trang chủ &amp; Trang cấp 2)
              </h3>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Tự do Thêm, Xóa, Bật/Tắt và Sắp xếp thứ tự Lên/Xuống từng nhóm tài liệu (Đề thi thử,
                Bổ trợ, Từ vựng...).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const initial = buildInitialCategoryBlocks(
                  editingCategory as CategoryItem,
                  currentCategoryProducts
                );
                setEditingCategory((prev) => ({ ...prev, blocks: initial }));
                showToast('Đã khởi tạo bộ khung mẫu từ sản phẩm thực tế trong DB!');
              }}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] px-3 py-1.5 rounded-sm transition"
            >
              Khởi tạo Khung từ Sản phẩm có sẵn
            </button>
          </div>

          {/* Thanh công cụ thêm nhanh các loại khung */}
          <div className="bg-gray-50 border border-gray-200 rounded-sm p-3 space-y-2">
            <div className="text-[11px] font-extrabold text-gray-700 uppercase">
              + Thêm Khung vào Trang Cấp 1:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {(Object.keys(CATEGORY_BLOCK_META) as CategoryBlockType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAddBlock(type)}
                  className="text-left p-2.5 bg-white hover:bg-[#fff5f7] border border-gray-200 hover:border-[#e60049] rounded-sm transition group"
                >
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm ${CATEGORY_BLOCK_META[type].badgeColor}`}
                  >
                    + Thêm
                  </span>
                  <div className="text-[11px] font-bold text-gray-900 group-hover:text-[#e60049] mt-1.5 line-clamp-2">
                    {CATEGORY_BLOCK_META[type].label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách các khối */}
          {blocks.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-sm space-y-2">
              <p className="text-xs text-gray-600 font-semibold">
                Trang này chưa có danh sách Khung động (`category_blocks`).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block, idx) => {
                const meta = CATEGORY_BLOCK_META[block.type] || {
                  label: block.type,
                  badgeColor: 'bg-gray-700 text-white',
                  desc: '',
                };

                return (
                  <div
                    key={block.id}
                    className={`border rounded-md overflow-hidden transition ${
                      block.is_active
                        ? 'border-gray-300 bg-white shadow-sm'
                        : 'border-gray-200 bg-gray-50 opacity-75'
                    }`}
                  >
                    {/* Header bar của từng Block */}
                    <div className="bg-gray-100 border-b border-gray-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-500">#{idx + 1}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-sm ${meta.badgeColor}`}
                        >
                          {meta.label}
                        </span>
                        {!block.is_active && (
                          <span className="text-[10px] bg-gray-300 text-gray-700 font-bold px-1.5 py-0.5 rounded-sm">
                            Đang ẩn
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label className="flex items-center gap-1 text-[11px] font-bold text-gray-700 mr-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={block.is_active}
                            onChange={() => handleToggleActive(idx)}
                            className="accent-[#e60049]"
                          />
                          Hiển thị
                        </label>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveBlock(idx, -1)}
                          className="px-2 py-1 bg-white border border-gray-300 rounded-sm text-[11px] font-bold text-gray-700 disabled:opacity-40"
                        >
                          ↑ Lên
                        </button>
                        <button
                          type="button"
                          disabled={idx === blocks.length - 1}
                          onClick={() => handleMoveBlock(idx, 1)}
                          className="px-2 py-1 bg-white border border-gray-300 rounded-sm text-[11px] font-bold text-gray-700 disabled:opacity-40"
                        >
                          ↓ Xuống
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(idx)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-sm text-[11px] font-bold text-[#e60049]"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    {/* Nội dung cấu hình chi tiết từng loại Block */}
                    <div className="p-4 space-y-3">
                      {/* ================= KHỐI 1: CATEGORY_HERO ================= */}
                      {block.type === 'category_hero' && (() => {
                        const cfg = block.config as CategoryHeroBlockConfig;
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Tiêu đề lớn màu đỏ (Hỗ trợ xuống dòng)
                                </label>
                                <textarea
                                  rows={2}
                                  value={cfg.title || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<CategoryHeroBlockConfig>(idx, (c) => ({
                                      ...c,
                                      title: e.target.value,
                                    }))
                                  }
                                  className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs font-bold text-[#e60049]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Mô tả phụ đầu trang
                                </label>
                                <textarea
                                  rows={2}
                                  value={cfg.subtitle || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<CategoryHeroBlockConfig>(idx, (c) => ({
                                      ...c,
                                      subtitle: e.target.value,
                                    }))
                                  }
                                  className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={cfg.show_pink_glow !== false}
                                  onChange={(e) =>
                                    updateBlockConfig<CategoryHeroBlockConfig>(idx, (c) => ({
                                      ...c,
                                      show_pink_glow: e.target.checked,
                                    }))
                                  }
                                  className="accent-[#e60049] w-4 h-4"
                                />
                                Bật hiệu ứng nền ánh hồng phấn tỏa nhẹ ở góc phải
                              </label>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Chế độ Liên kết Mục lục nhảy nhanh
                                </label>
                                <select
                                  value={cfg.anchor_mode || 'auto_from_sections'}
                                  onChange={(e) =>
                                    updateBlockConfig<CategoryHeroBlockConfig>(idx, (c) => ({
                                      ...c,
                                      anchor_mode: e.target.value as any,
                                    }))
                                  }
                                  className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs bg-white font-semibold"
                                >
                                  <option value="auto_from_sections">
                                    Tự động lấy tên các nhóm tài liệu bên dưới (Khuyên dùng)
                                  </option>
                                  <option value="manual">Tự cấu hình từng dòng mục lục</option>
                                  <option value="none">Ẩn danh sách mục lục</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ================= KHỐI 2: CATEGORY_SECTION ================= */}
                      {block.type === 'category_section' && (() => {
                        const cfg = block.config as CategorySectionBlockConfig;
                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Tiêu đề nhóm tài liệu (VD: Đề thi thử THPT/ĐGNL, Bổ trợ...) *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={cfg.title || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<CategorySectionBlockConfig>(idx, (c) => ({
                                      ...c,
                                      title: e.target.value,
                                    }))
                                  }
                                  className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs font-bold text-[#e60049]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Mã neo ID (để Mục lục cuộn tới)
                                </label>
                                <input
                                  type="text"
                                  value={cfg.anchor_id || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<CategorySectionBlockConfig>(idx, (c) => ({
                                      ...c,
                                      anchor_id: e.target.value,
                                    }))
                                  }
                                  placeholder="sec-de-thi-thu"
                                  className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs font-mono"
                                />
                              </div>
                            </div>

                            {/* Quản lý các thẻ sản phẩm trong nhóm */}
                            <div className="border border-gray-200 rounded-sm p-3 bg-gray-50/60 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                                <span className="text-xs font-extrabold text-gray-800">
                                  Danh sách thẻ tài liệu trong nhóm ({(cfg.items || []).length} thẻ):
                                </span>

                                <div className="flex flex-wrap gap-2">
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      const found = products.find((p) => p.slug === e.target.value);
                                      if (!found) return;
                                      updateBlockConfig<CategorySectionBlockConfig>(idx, (c) => ({
                                        ...c,
                                        items: [
                                          ...(c.items || []),
                                          {
                                            id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                                            display_title: found.title,
                                            image_url: found.thumbnail_url || '',
                                            image_mode: 'card_box',
                                            badge_text: found.badge_text || '',
                                            tag_text: found.cover_tag || '',
                                            button_text: 'Đọc thử',
                                            target_url: `/${found.category_slug}/${found.slug}`,
                                            is_active: true,
                                          },
                                        ],
                                      }));
                                      e.target.value = '';
                                    }}
                                    className="border border-gray-300 rounded-sm px-2 py-1 text-[11px] bg-white"
                                  >
                                    <option value="">+ Chọn nhanh từ Sản phẩm có sẵn...</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.slug}>
                                        {p.title} ({p.sub_section || p.category_name})
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBlockConfig<CategorySectionBlockConfig>(idx, (c) => ({
                                        ...c,
                                        items: [
                                          ...(c.items || []),
                                          {
                                            id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                                            display_title: '',
                                            image_url: '',
                                            image_mode: 'standalone',
                                            badge_text: '',
                                            tag_text: '',
                                            button_text: 'Đọc thử',
                                            target_url: '',
                                            is_active: true,
                                          },
                                        ],
                                      }))
                                    }
                                    className="px-2.5 py-1 bg-[#fff0f3] text-[#e60049] border border-[#e60049]/30 text-[11px] font-bold rounded-sm"
                                  >
                                    + Thêm thẻ tùy chỉnh
                                  </button>
                                </div>
                              </div>

                              {/* Lưới danh sách thẻ đang có */}
                              {(cfg.items || []).map((card, cIdx) => {
                                const uploadKey = `card_upload_${idx}_${cIdx}`;
                                return (
                                  <div
                                    key={card.id || cIdx}
                                    className="bg-white border border-gray-200 rounded-sm p-3 space-y-2.5 shadow-2xs"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black bg-[#e60049] text-white px-2 py-0.5 rounded-sm">
                                          Thẻ #{cIdx + 1}
                                        </span>
                                        <select
                                          value={card.image_mode || 'card_box'}
                                          onChange={(e) =>
                                            updateBlockConfig<CategorySectionBlockConfig>(
                                              idx,
                                              (c) => {
                                                const list = [...(c.items || [])];
                                                list[cIdx] = {
                                                  ...list[cIdx],
                                                  image_mode: e.target.value as any,
                                                };
                                                return { ...c, items: list };
                                              }
                                            )
                                          }
                                          className="border border-gray-300 rounded-sm px-2 py-0.5 text-[11px] bg-white font-semibold"
                                        >
                                          <option value="card_box">
                                            Khung thẻ có Badge &amp; Tag
                                          </option>
                                          <option value="standalone">
                                            Ảnh đứng độc lập nguyên bản (không khung giả)
                                          </option>
                                        </select>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          disabled={cIdx === 0}
                                          onClick={() =>
                                            updateBlockConfig<CategorySectionBlockConfig>(
                                              idx,
                                              (c) => {
                                                const list = [...(c.items || [])];
                                                const tmp = list[cIdx];
                                                list[cIdx] = list[cIdx - 1];
                                                list[cIdx - 1] = tmp;
                                                return { ...c, items: list };
                                              }
                                            )
                                          }
                                          className="px-2 py-0.5 bg-gray-100 rounded-sm text-[10px] font-bold disabled:opacity-40"
                                        >
                                          ← Trái
                                        </button>
                                        <button
                                          type="button"
                                          disabled={cIdx === (cfg.items || []).length - 1}
                                          onClick={() =>
                                            updateBlockConfig<CategorySectionBlockConfig>(
                                              idx,
                                              (c) => {
                                                const list = [...(c.items || [])];
                                                const tmp = list[cIdx];
                                                list[cIdx] = list[cIdx + 1];
                                                list[cIdx + 1] = tmp;
                                                return { ...c, items: list };
                                              }
                                            )
                                          }
                                          className="px-2 py-0.5 bg-gray-100 rounded-sm text-[10px] font-bold disabled:opacity-40"
                                        >
                                          → Phải
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (card.image_url) {
                                              apiClient.deleteR2File(card.image_url).catch(() => {});
                                            }
                                            updateBlockConfig<CategorySectionBlockConfig>(
                                              idx,
                                              (c) => ({
                                                ...c,
                                                items: (c.items || []).filter((_, i) => i !== cIdx),
                                              })
                                            );
                                          }}
                                          className="text-xs font-bold text-[#e60049] hover:underline px-2"
                                        >
                                          Xóa thẻ
                                        </button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                      {/* Tên sách */}
                                      <div className="sm:col-span-5">
                                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                          Tên tài liệu hiển thị dưới nút Đọc thử
                                        </label>
                                        <input
                                          type="text"
                                          value={card.display_title || ''}
                                          onChange={(e) =>
                                            updateBlockConfig<CategorySectionBlockConfig>(
                                              idx,
                                              (c) => {
                                                const list = [...(c.items || [])];
                                                list[cIdx] = {
                                                  ...list[cIdx],
                                                  display_title: e.target.value,
                                                };
                                                return { ...c, items: list };
                                              }
                                            )
                                          }
                                          className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-bold"
                                        />
                                      </div>

                                      {/* Đường dẫn đích */}
                                      <div className="sm:col-span-4">
                                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                          Đường dẫn đích (/high-school/... hoặc https://...)
                                        </label>
                                        <input
                                          type="text"
                                          value={card.target_url || ''}
                                          onChange={(e) =>
                                            updateBlockConfig<CategorySectionBlockConfig>(
                                              idx,
                                              (c) => {
                                                const list = [...(c.items || [])];
                                                list[cIdx] = {
                                                  ...list[cIdx],
                                                  target_url: e.target.value,
                                                };
                                                return { ...c, items: list };
                                              }
                                            )
                                          }
                                          onBlur={(e) =>
                                            updateBlockConfig<CategorySectionBlockConfig>(
                                              idx,
                                              (c) => {
                                                const list = [...(c.items || [])];
                                                list[cIdx] = {
                                                  ...list[cIdx],
                                                  target_url: normalizeTargetUrl(e.target.value),
                                                };
                                                return { ...c, items: list };
                                              }
                                            )
                                          }
                                          className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                                        />
                                      </div>

                                      {/* Chữ trên nút */}
                                      <div className="sm:col-span-3">
                                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                          Chữ trên nút (Mặc định: Đọc thử)
                                        </label>
                                        <input
                                          type="text"
                                          value={card.button_text || 'Đọc thử'}
                                          onChange={(e) =>
                                            updateBlockConfig<CategorySectionBlockConfig>(
                                              idx,
                                              (c) => {
                                                const list = [...(c.items || [])];
                                                list[cIdx] = {
                                                  ...list[cIdx],
                                                  button_text: e.target.value,
                                                };
                                                return { ...c, items: list };
                                              }
                                            )
                                          }
                                          className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-semibold"
                                        />
                                      </div>

                                      {/* Link ảnh & Nút tải lên R2 */}
                                      <div className="sm:col-span-12 flex flex-col sm:flex-row gap-2 items-center bg-gray-50 p-2 rounded-sm">
                                        <input
                                          type="text"
                                          placeholder="https://media.huytutor.edu.vn/..."
                                          value={card.image_url || ''}
                                          onChange={(e) =>
                                            updateBlockConfig<CategorySectionBlockConfig>(
                                              idx,
                                              (c) => {
                                                const list = [...(c.items || [])];
                                                list[cIdx] = {
                                                  ...list[cIdx],
                                                  image_url: e.target.value,
                                                };
                                                return { ...c, items: list };
                                              }
                                            )
                                          }
                                          className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-xs bg-white"
                                        />
                                        <label className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3 py-1 rounded-sm cursor-pointer text-center shrink-0">
                                          {uploadingKey === uploadKey
                                            ? 'Đang tải lên R2...'
                                            : 'Tải ảnh lên R2'}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              if (!f) return;
                                              handleSingleUploadR2(
                                                f,
                                                'categories/cards',
                                                uploadKey,
                                                card.image_url,
                                                (url) =>
                                                  updateBlockConfig<CategorySectionBlockConfig>(
                                                    idx,
                                                    (c) => {
                                                      const list = [...(c.items || [])];
                                                      list[cIdx] = {
                                                        ...list[cIdx],
                                                        image_url: url,
                                                      };
                                                      return { ...c, items: list };
                                                    }
                                                  )
                                              );
                                            }}
                                          />
                                        </label>
                                        {card.image_url && (
                                          <img
                                            src={card.image_url}
                                            alt="Preview"
                                            className="h-10 w-auto object-contain rounded-sm border border-gray-300 bg-white"
                                          />
                                        )}
                                      </div>

                                      {/* Nếu ở chế độ card_box: cấu hình Badge & Tag text */}
                                      {card.image_mode === 'card_box' && (
                                        <>
                                          <div className="sm:col-span-4">
                                            <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                              Huy hiệu góc (VD: Mới, Chính chủ)
                                            </label>
                                            <input
                                              type="text"
                                              value={card.badge_text || ''}
                                              onChange={(e) =>
                                                updateBlockConfig<CategorySectionBlockConfig>(
                                                  idx,
                                                  (c) => {
                                                    const list = [...(c.items || [])];
                                                    list[cIdx] = {
                                                      ...list[cIdx],
                                                      badge_text: e.target.value,
                                                    };
                                                    return { ...c, items: list };
                                                  }
                                                )
                                              }
                                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                                            />
                                          </div>
                                          <div className="sm:col-span-8">
                                            <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                              Mô tả Tag bên phải ảnh (Hỗ trợ xuống dòng)
                                            </label>
                                            <input
                                              type="text"
                                              value={card.tag_text || ''}
                                              onChange={(e) =>
                                                updateBlockConfig<CategorySectionBlockConfig>(
                                                  idx,
                                                  (c) => {
                                                    const list = [...(c.items || [])];
                                                    list[cIdx] = {
                                                      ...list[cIdx],
                                                      tag_text: e.target.value,
                                                    };
                                                    return { ...c, items: list };
                                                  }
                                                )
                                              }
                                              placeholder="Dành cho Kỳ thi THPT..."
                                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                                            />
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ================= KHỐI 3: CATEGORY_BANNER ================= */}
                      {block.type === 'category_banner' && (() => {
                        const cfg = block.config as CategoryBannerBlockConfig;
                        const uploadKey = `banner_upload_${idx}`;
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Tiêu đề nhãn trên Banner (Tuỳ chọn)
                                </label>
                                <input
                                  type="text"
                                  value={cfg.header_label || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<CategoryBannerBlockConfig>(idx, (c) => ({
                                      ...c,
                                      header_label: e.target.value,
                                    }))
                                  }
                                  className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Đường dẫn đích khi bấm vào Banner (SmartLink)
                                </label>
                                <input
                                  type="text"
                                  value={cfg.link_url || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<CategoryBannerBlockConfig>(idx, (c) => ({
                                      ...c,
                                      link_url: e.target.value,
                                    }))
                                  }
                                  onBlur={(e) =>
                                    updateBlockConfig<CategoryBannerBlockConfig>(idx, (c) => ({
                                      ...c,
                                      link_url: normalizeTargetUrl(e.target.value),
                                    }))
                                  }
                                  placeholder="/combo hoặc https://..."
                                  className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                                />
                              </div>
                            </div>

                            <div className="bg-purple-50/50 border border-purple-200 rounded-sm p-3 space-y-2">
                              <label className="block text-[11px] font-bold text-purple-900">
                                Ảnh Banner ngang Cloudflare R2 (Độc lập full-width, không bọc khung vàng)
                              </label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={cfg.image_url || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<CategoryBannerBlockConfig>(idx, (c) => ({
                                      ...c,
                                      image_url: e.target.value,
                                    }))
                                  }
                                  className="flex-1 border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs bg-white"
                                />
                                <label className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3 py-1.5 rounded-sm cursor-pointer text-center shrink-0">
                                  {uploadingKey === uploadKey ? 'Đang tải...' : 'Tải Banner lên R2'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      handleSingleUploadR2(
                                        f,
                                        'categories/banners',
                                        uploadKey,
                                        cfg.image_url,
                                        (url) =>
                                          updateBlockConfig<CategoryBannerBlockConfig>(
                                            idx,
                                            (c) => ({
                                              ...c,
                                              image_url: url,
                                            })
                                          )
                                      );
                                    }}
                                  />
                                </label>
                              </div>
                              {cfg.image_url && (
                                <img
                                  src={cfg.image_url}
                                  alt="Banner preview"
                                  className="w-full max-h-40 object-cover rounded-md border border-gray-200"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ================= KHỐI 4: CATEGORY_NOTICE ================= */}
                      {block.type === 'category_notice' && (() => {
                        const cfg = block.config as CategoryNoticeBlockConfig;
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Tiêu đề thông báo (Tuỳ chọn)
                                </label>
                                <input
                                  type="text"
                                  value={cfg.title || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<CategoryNoticeBlockConfig>(idx, (c) => ({
                                      ...c,
                                      title: e.target.value,
                                    }))
                                  }
                                  className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Màu nền hộp
                                </label>
                                <select
                                  value={cfg.bg_style || 'pink'}
                                  onChange={(e) =>
                                    updateBlockConfig<CategoryNoticeBlockConfig>(idx, (c) => ({
                                      ...c,
                                      bg_style: e.target.value as any,
                                    }))
                                  }
                                  className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs bg-white"
                                >
                                  <option value="pink">Hồng phấn thương hiệu (#fff5f7)</option>
                                  <option value="gray">Xám nhạt (#f3f4f6)</option>
                                  <option value="white">Trắng viền mảnh</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Nội dung thông báo
                              </label>
                              <textarea
                                rows={2}
                                value={cfg.content || ''}
                                onChange={(e) =>
                                  updateBlockConfig<CategoryNoticeBlockConfig>(idx, (c) => ({
                                    ...c,
                                    content: e.target.value,
                                  }))
                                }
                                className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nút lưu cuối form */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-3 rounded-sm transition shadow-sm"
        >
          {saving ? 'Đang lưu vào Hệ thống...' : 'Lưu toàn bộ Cấu hình Trang Cấp 1 này'}
        </button>
      </form>

      {/* Live Preview trực tiếp */}
      {showLivePreview && (
        <div className="border-2 border-gray-900 rounded-md overflow-hidden bg-white mt-6">
          <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Bản Xem Trước Trực Tiếp Trang Cấp 1 (/{editingCategory.slug})
            </span>
            <button
              type="button"
              onClick={() => setShowLivePreview(false)}
              className="text-xs text-gray-300 hover:text-white font-bold"
            >
              Thu gọn ✕
            </button>
          </div>
          <div className="p-6 max-h-[850px] overflow-y-auto space-y-10">
            {blocks
              .filter((b) => b.is_active)
              .map((block) => {
                switch (block.type) {
                  case 'category_hero':
                    return (
                      <CategoryHeroBlock
                        key={block.id}
                        config={block.config as CategoryHeroBlockConfig}
                        sections={activeSectionsForPreview}
                      />
                    );
                  case 'category_section':
                    return (
                      <CategorySectionBlock
                        key={block.id}
                        config={block.config as CategorySectionBlockConfig}
                        allCategoryProducts={currentCategoryProducts}
                      />
                    );
                  case 'category_banner':
                    return (
                      <CategoryBannerBlock
                        key={block.id}
                        config={block.config as CategoryBannerBlockConfig}
                      />
                    );
                  case 'category_notice':
                    return (
                      <CategoryNoticeBlock
                        key={block.id}
                        config={block.config as CategoryNoticeBlockConfig}
                      />
                    );
                  default:
                    return null;
                }
              })}
          </div>
        </div>
      )}
    </div>
  );
};
