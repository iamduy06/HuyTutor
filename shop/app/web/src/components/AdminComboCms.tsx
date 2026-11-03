import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import { R2ImageUploader } from './R2ImageUploader';
import {
  ComboBannerBlockConfig,
  ComboBlockType,
  ComboBottomCtaBlockConfig,
  ComboHeroBlockConfig,
  ComboNoticeBlockConfig,
  ComboPackageItem,
  ComboPackagesBlockConfig,
  ComboPageBlockItem,
  ComboSectionGroupItem,
  ComboSectionsBlockConfig,
  Product,
} from '../types';
import {
  buildInitialComboBlocks,
  ComboBannerBlock,
  ComboBottomCtaBlock,
  ComboHeroBlock,
  ComboNoticeBlock,
  ComboPackagesBlock,
  ComboSectionsBlock,
} from './DynamicComboBlocks';

const COMBO_BLOCK_META: Record<
  ComboBlockType,
  { label: string; badgeColor: string; desc: string }
> = {
  combo_hero: {
    label: 'KHỐI 1: Hero Banner & Slogan đầu trang (Slogan + Khung 3 cuốn sách / Ảnh R2)',
    badgeColor: 'bg-[#e60049] text-white',
    desc: 'Slogan trên, slogan dưới và Banner lớn (chọn tải ảnh R2 thiết kế sẵn hoặc tự tạo chữ + ảnh 3 cuốn sách).',
  },
  combo_packages: {
    label: 'KHỐI 2: Lưới các Thẻ Gói Combo Ưu Đãi (6 thẻ hoặc tùy ý)',
    badgeColor: 'bg-blue-600 text-white',
    desc: 'Danh sách các thẻ gói Combo ưu đãi (Word/PDF, % giảm giá, chọn các sách thuộc gói).',
  },
  combo_sections: {
    label: 'KHỐI 3: Lưới Nhóm Tài Liệu Thành Phần (Lưới 3 cột)',
    badgeColor: 'bg-emerald-600 text-white',
    desc: 'Các phân nhóm tài liệu chi tiết (3 bộ đề mới, Từ vựng, ĐGNL...), chọn sách từ kho tài liệu.',
  },
  combo_bottom_cta: {
    label: 'KHỐI 4: Banner Mua Ngay Cuối Trang (Nút CTA lớn + Nhãn % ưu đãi)',
    badgeColor: 'bg-amber-600 text-white',
    desc: 'Nút bấm lớn kích hoạt mua combo nhanh và dòng ghi chú tích điểm chân trang.',
  },
  combo_banner: {
    label: 'KHỐI PHỤ: Banner Ngang Độc Lập (Full-width)',
    badgeColor: 'bg-purple-600 text-white',
    desc: 'Banner ảnh ngang độc lập chèn vào bất kỳ vị trí nào trên trang Combo.',
  },
  combo_notice: {
    label: 'KHỐI PHỤ: Hộp Ghi Chú & Lưu Ý',
    badgeColor: 'bg-zinc-700 text-white',
    desc: 'Hộp thông báo hoặc lưu ý chính sách với các tông màu hồng, vàng, xanh.',
  },
};

export const AdminComboCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, products, showToast } = useStore();

  const [blocks, setBlocks] = useState<ComboPageBlockItem[]>(() => {
    return buildInitialComboBlocks(products, siteConfigs?.combo_page_blocks);
  });

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (Array.isArray(siteConfigs?.combo_page_blocks) && siteConfigs.combo_page_blocks.length > 0) {
      setBlocks(siteConfigs.combo_page_blocks);
    }
  }, [siteConfigs?.combo_page_blocks]);

  // Lưu cấu hình vào Database
  const handleSaveBlocks = async () => {
    setSaving(true);
    try {
      await updateSiteConfig('combo_page_blocks', blocks);
      showToast('Đã lưu cấu hình khối Trang Combo THPT thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu cấu hình Trang Combo.');
    } finally {
      setSaving(false);
    }
  };

  // Di chuyển khối Lên / Xuống
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const list = [...blocks];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);

    const reordered = list.map((b, idx) => ({ ...b, sort_order: idx + 1 }));
    setBlocks(reordered);
  };

  // Bật / Tắt khối
  const handleToggleBlockActive = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, is_active: !b.is_active } : b))
    );
  };

  // Xóa khối
  const handleDeleteBlock = (blockId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khối này khỏi Trang Combo?')) return;
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (editingBlockId === blockId) setEditingBlockId(null);
  };

  // Thêm khối mới
  const handleAddBlock = (type: ComboBlockType) => {
    const nextOrder = blocks.length + 1;
    const newId = `combo_blk_${Date.now()}`;

    let initialConfig: any = {};
    if (type === 'combo_hero') {
      initialConfig = {
        top_slogan: 'Mua nhiều. Giảm sâu. Tích điểm cao*.',
        bottom_slogan: 'Giảm giá lên đến 25%.',
        mode: 'custom_builder',
        headline: 'Combo 90 ĐỀ THI THỬ',
        sub_headline: 'THI THPT MÔN TIẾNG ANH',
        badge_text: 'CƠ BẢN + NÂNG CAO',
        gradient_theme: 'amber',
        book_cover_urls: [],
      } as ComboHeroBlockConfig;
    } else if (type === 'combo_packages') {
      initialConfig = {
        section_title: 'Ưu đãi cao nhất',
        sub_text: 'Sử dụng ưu đãi thành viên để được giảm thêm trên đơn hàng.',
        packages: [],
      } as ComboPackagesBlockConfig;
    } else if (type === 'combo_sections') {
      initialConfig = {
        group_header: 'Xem chi tiết từng bộ tài liệu',
        groups: [],
      } as ComboSectionsBlockConfig;
    } else if (type === 'combo_bottom_cta') {
      initialConfig = {
        btn_title: 'Mua ngay',
        discount_text: 'Giảm tới 25%',
        note_text: '* Điểm thành viên được tích lũy dựa trên số tiền thực tế thanh toán.',
      } as ComboBottomCtaBlockConfig;
    } else if (type === 'combo_banner') {
      initialConfig = {
        banner_url: '',
        link_url: '',
        alt_text: 'Banner Combo',
      } as ComboBannerBlockConfig;
    } else if (type === 'combo_notice') {
      initialConfig = {
        content: 'Lưu ý: Mua combo được chiết khấu thêm trên tổng đơn hàng.',
        badge_label: 'LƯU Ý',
        theme: 'pink',
      } as ComboNoticeBlockConfig;
    }

    const newBlock: ComboPageBlockItem = {
      id: newId,
      type,
      title_label: COMBO_BLOCK_META[type].label,
      is_active: true,
      sort_order: nextOrder,
      config: initialConfig,
    };

    setBlocks([...blocks, newBlock]);
    setEditingBlockId(newId);
  };

  // Cập nhật cấu hình khối
  const handleUpdateBlockConfig = (blockId: string, partialConfig: any) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, config: { ...b.config, ...partialConfig } } : b))
    );
  };

  // Upload ảnh lên R2
  const handleUploadR2 = async (file: File, folder = 'combos'): Promise<string> => {
    setUploadingImage(true);
    try {
      const res = await apiClient.uploadFile(file, {
        folder,
        pageLevel1: 'combo-thpt',
        pageLevel2: 'banner',
      });
      showToast('Đã tải ảnh lên Cloudflare R2 thành công!');
      return res.url;
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải ảnh lên R2.');
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#e60049] uppercase flex items-center gap-2">
            <span>Quản lý Khối Động Trang Combo THPT (/combo-thpt)</span>
            <span className="text-[10px] bg-pink-100 text-[#e60049] font-black px-2 py-0.5 rounded">
              {blocks.length} KHỐI
            </span>
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Tự do thêm bớt, đổi thứ tự, cấu hình các gói Combo ưu đãi, bìa sách R2 và lưới sản phẩm mà không cần sửa code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="border border-gray-300 bg-white hover:border-[#e60049] text-gray-700 font-bold text-xs px-3.5 py-2 rounded-sm transition"
          >
            {showPreview ? 'Ẩn Xem trước' : '👁️ Xem trước Trang Combo'}
          </button>
          <button
            type="button"
            onClick={handleSaveBlocks}
            disabled={saving}
            className="bg-[#e60049] hover:bg-[#cc0041] disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-sm transition shadow-sm"
          >
            {saving ? 'Đang lưu...' : '💾 Lưu Cấu Hình Khối'}
          </button>
        </div>
      </div>

      {/* Xem trước Live Preview */}
      {showPreview && (
        <div className="bg-gray-100 border-2 border-dashed border-pink-300 rounded-md p-4">
          <div className="text-xs font-bold text-[#e60049] uppercase mb-3 flex items-center justify-between">
            <span>Live Preview: Giao diện Trang Combo THPT thực tế</span>
            <span className="text-[10px] text-gray-500 font-normal">Cập nhật tức thời theo cấu hình bên dưới</span>
          </div>
          <div className="bg-white rounded border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
            {blocks
              .filter((b) => b.is_active !== false)
              .map((block) => {
                switch (block.type) {
                  case 'combo_hero':
                    return <ComboHeroBlock key={block.id} config={block.config as ComboHeroBlockConfig} />;
                  case 'combo_packages':
                    return (
                      <div key={block.id} className="max-w-[920px] mx-auto py-4">
                        <ComboPackagesBlock
                          config={block.config as ComboPackagesBlockConfig}
                          allProducts={products}
                          onSelectPackage={() => {}}
                        />
                      </div>
                    );
                  case 'combo_sections':
                    return (
                      <div key={block.id} className="max-w-[920px] mx-auto py-4">
                        <ComboSectionsBlock
                          config={block.config as ComboSectionsBlockConfig}
                          allProducts={products}
                        />
                      </div>
                    );
                  case 'combo_bottom_cta':
                    return (
                      <ComboBottomCtaBlock
                        key={block.id}
                        config={block.config as ComboBottomCtaBlockConfig}
                        onActionClick={() => {}}
                      />
                    );
                  case 'combo_banner':
                    return (
                      <div key={block.id} className="max-w-[920px] mx-auto py-2">
                        <ComboBannerBlock config={block.config as ComboBannerBlockConfig} />
                      </div>
                    );
                  case 'combo_notice':
                    return (
                      <div key={block.id} className="max-w-[920px] mx-auto py-2">
                        <ComboNoticeBlock config={block.config as ComboNoticeBlockConfig} />
                      </div>
                    );
                  default:
                    return null;
                }
              })}
          </div>
        </div>
      )}

      {/* Danh sách Khối Động (Block Repeater) */}
      <div className="space-y-4">
        {blocks.map((block, index) => {
          const meta = COMBO_BLOCK_META[block.type] || {
            label: block.title_label || block.type,
            badgeColor: 'bg-gray-600 text-white',
            desc: '',
          };
          const isEditing = editingBlockId === block.id;

          return (
            <div
              key={block.id}
              className={`bg-white border rounded-md shadow-sm transition overflow-hidden ${
                block.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60 bg-gray-50'
              }`}
            >
              {/* Block Header Toolbar: Title khối - Mô tả của khối đó */}
              <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-gray-50 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-500 w-5">#{index + 1}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-sm ${meta.badgeColor}`}>
                      {block.type}
                    </span>
                    <h3 className="text-xs font-black text-gray-900">{meta.label}</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{meta.desc}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveBlock(index, 'up')}
                    className="border border-gray-300 px-2 py-1 text-xs rounded disabled:opacity-30 hover:bg-white font-bold"
                    title="Di chuyển Lên"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={index === blocks.length - 1}
                    onClick={() => handleMoveBlock(index, 'down')}
                    className="border border-gray-300 px-2 py-1 text-xs rounded disabled:opacity-30 hover:bg-white font-bold"
                    title="Di chuyển Xuống"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleBlockActive(block.id)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-sm border transition ${
                      block.is_active
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-gray-300 bg-gray-200 text-gray-600'
                    }`}
                  >
                    {block.is_active ? 'Bật' : 'Đang tắt'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-sm border transition ${
                      isEditing
                        ? 'bg-[#e60049] text-white border-[#e60049]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#e60049]'
                    }`}
                  >
                    {isEditing ? 'Đóng cấu hình' : 'Chỉnh sửa'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="border border-red-300 text-red-600 hover:bg-red-50 text-[11px] font-bold px-2 py-1 rounded-sm"
                    title="Xóa khối"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Block Config Editor Area */}
              {isEditing && (
                <div className="p-5 bg-white border-t border-gray-100 space-y-5 text-xs">
                  {/* EDIT KHỐI 1: COMBO HERO */}
                  {block.type === 'combo_hero' && (
                    <EditComboHeroConfig
                      config={block.config as ComboHeroBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(block.id, cfg)}
                      onUploadR2={handleUploadR2}
                      uploading={uploadingImage}
                    />
                  )}

                  {/* EDIT KHỐI 2: COMBO PACKAGES */}
                  {block.type === 'combo_packages' && (
                    <EditComboPackagesConfig
                      config={block.config as ComboPackagesBlockConfig}
                      allProducts={products}
                      onUpdate={(cfg) => handleUpdateBlockConfig(block.id, cfg)}
                    />
                  )}

                  {/* EDIT KHỐI 3: COMBO SECTIONS */}
                  {block.type === 'combo_sections' && (
                    <EditComboSectionsConfig
                      config={block.config as ComboSectionsBlockConfig}
                      allProducts={products}
                      onUpdate={(cfg) => handleUpdateBlockConfig(block.id, cfg)}
                    />
                  )}

                  {/* EDIT KHỐI 4: COMBO BOTTOM CTA */}
                  {block.type === 'combo_bottom_cta' && (
                    <EditComboBottomCtaConfig
                      config={block.config as ComboBottomCtaBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(block.id, cfg)}
                    />
                  )}

                  {/* EDIT KHỐI PHỤ: BANNER */}
                  {block.type === 'combo_banner' && (
                    <EditComboBannerConfig
                      config={block.config as ComboBannerBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(block.id, cfg)}
                      onUploadR2={handleUploadR2}
                      uploading={uploadingImage}
                    />
                  )}

                  {/* EDIT KHỐI PHỤ: NOTICE */}
                  {block.type === 'combo_notice' && (
                    <EditComboNoticeConfig
                      config={block.config as ComboNoticeBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(block.id, cfg)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Thanh công cụ Thêm Khối Mới */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-5 text-center space-y-3">
        <div className="text-xs font-bold text-gray-700 uppercase">+ Thêm Khối Mới Vào Trang Combo THPT</div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {(Object.keys(COMBO_BLOCK_META) as ComboBlockType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleAddBlock(type)}
              className="bg-white border border-gray-300 hover:border-[#e60049] text-gray-800 hover:text-[#e60049] font-bold text-xs px-3.5 py-1.5 rounded-sm transition shadow-2xs"
            >
              + {COMBO_BLOCK_META[type].label.split(':')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-EDITORS FOR EACH BLOCK TYPE
// ============================================================================

const EditComboHeroConfig: React.FC<{
  config: ComboHeroBlockConfig;
  onUpdate: (cfg: Partial<ComboHeroBlockConfig>) => void;
  onUploadR2: (file: File) => Promise<string>;
  uploading: boolean;
}> = ({ config, onUpdate, onUploadR2, uploading }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Slogan trên (H1 đỏ)</label>
          <input
            type="text"
            value={config.top_slogan || ''}
            onChange={(e) => onUpdate({ top_slogan: e.target.value })}
            placeholder="Mua nhiều. Giảm sâu. Tích điểm cao*."
            className="w-full border border-gray-300 rounded px-2.5 py-1.5"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Slogan dưới (Text đỏ)</label>
          <input
            type="text"
            value={config.bottom_slogan || ''}
            onChange={(e) => onUpdate({ bottom_slogan: e.target.value })}
            placeholder="Giảm giá lên đến 25%."
            className="w-full border border-gray-300 rounded px-2.5 py-1.5"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <label className="block font-bold text-gray-700 mb-2">Chế độ hiển thị Banner</label>
        <div className="flex items-center gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="radio"
              checked={config.mode === 'image_banner'}
              onChange={() => onUpdate({ mode: 'image_banner' })}
            />
            <span>Tải 1 ảnh Banner thiết kế hoàn chỉnh từ R2 (Khuyên dùng)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="radio"
              checked={config.mode === 'custom_builder'}
              onChange={() => onUpdate({ mode: 'custom_builder' })}
            />
            <span>Tự tạo khung chữ + ảnh 3 cuốn sách</span>
          </label>
        </div>

        {config.mode === 'image_banner' ? (
          <div className="space-y-2 bg-pink-50/50 p-3 rounded border border-pink-200">
            <label className="block font-bold text-gray-700">Ảnh Banner Cloudflare R2</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={config.banner_image_url || ''}
                onChange={(e) => onUpdate({ banner_image_url: e.target.value })}
                placeholder="https://media.huytutor.edu.vn/..."
                className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 bg-white"
              />
              <label className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold px-3 py-1.5 rounded cursor-pointer shrink-0">
                {uploading ? 'Đang tải...' : 'Tải ảnh lên R2'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const url = await onUploadR2(f);
                      onUpdate({ banner_image_url: url });
                    }
                  }}
                />
              </label>
            </div>
            {config.banner_image_url && (
              <img
                src={config.banner_image_url}
                alt="Banner preview"
                className="h-24 w-auto rounded border object-cover mt-2"
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Tiêu đề lớn</label>
              <input
                type="text"
                value={config.headline || ''}
                onChange={(e) => onUpdate({ headline: e.target.value })}
                placeholder="Combo 90 ĐỀ THI THỬ"
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Phụ đề</label>
              <input
                type="text"
                value={config.sub_headline || ''}
                onChange={(e) => onUpdate({ sub_headline: e.target.value })}
                placeholder="THI THPT MÔN TIẾNG ANH"
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Huy hiệu xanh</label>
              <input
                type="text"
                value={config.badge_text || ''}
                onChange={(e) => onUpdate({ badge_text: e.target.value })}
                placeholder="CƠ BẢN + NÂNG CAO"
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EditComboPackagesConfig: React.FC<{
  config: ComboPackagesBlockConfig;
  allProducts: Product[];
  onUpdate: (cfg: Partial<ComboPackagesBlockConfig>) => void;
}> = ({ config, allProducts, onUpdate }) => {
  const packages = config.packages || [];

  const handleAddPackage = () => {
    const newPkg: ComboPackageItem = {
      id: `pkg_${Date.now()}`,
      title: 'TÊN GÓI COMBO MỚI',
      discount_badge: 'GIẢM 20%',
      format_badge: 'File Word',
      tag_text: 'Combo',
      product_ids: [],
      action_type: 'add_to_cart',
    };
    onUpdate({ packages: [...packages, newPkg] });
  };

  const handleUpdatePackage = (index: number, partial: Partial<ComboPackageItem>) => {
    const list = [...packages];
    list[index] = { ...list[index], ...partial };
    onUpdate({ packages: list });
  };

  const handleDeletePackage = (index: number) => {
    const list = [...packages];
    list.splice(index, 1);
    onUpdate({ packages: list });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Tiêu đề phân khu</label>
          <input
            type="text"
            value={config.section_title || ''}
            onChange={(e) => onUpdate({ section_title: e.target.value })}
            placeholder="Ưu đãi cao nhất"
            className="w-full border border-gray-300 rounded px-2.5 py-1.5"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Dòng hướng dẫn phụ</label>
          <input
            type="text"
            value={config.sub_text || ''}
            onChange={(e) => onUpdate({ sub_text: e.target.value })}
            placeholder="Sử dụng ưu đãi thành viên để được giảm thêm trên đơn hàng."
            className="w-full border border-gray-300 rounded px-2.5 py-1.5"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-800">Danh sách các Thẻ Gói Combo ({packages.length})</span>
          <button
            type="button"
            onClick={handleAddPackage}
            className="bg-[#e60049] text-white font-bold px-3 py-1 rounded text-xs hover:bg-[#cc0041]"
          >
            + Thêm Thẻ Gói Mới
          </button>
        </div>

        <div className="space-y-3">
          {packages.map((pkg, idx) => (
            <div key={pkg.id} className="border border-gray-200 rounded p-3 bg-gray-50/70 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <span className="font-extrabold text-[#e60049]">Gói #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleDeletePackage(idx)}
                  className="text-red-600 hover:underline font-bold text-[11px]"
                >
                  Xóa thẻ này
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Tên gói tài liệu</label>
                  <textarea
                    rows={2}
                    value={pkg.title}
                    onChange={(e) => handleUpdatePackage(idx, { title: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Mức giảm giá</label>
                  <input
                    type="text"
                    value={pkg.discount_badge}
                    onChange={(e) => handleUpdatePackage(idx, { discount_badge: e.target.value })}
                    placeholder="GIẢM 25%"
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white text-xs font-bold text-red-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Định dạng</label>
                  <select
                    value={pkg.format_badge}
                    onChange={(e) => handleUpdatePackage(idx, { format_badge: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white text-xs"
                  >
                    <option value="File Word">File Word</option>
                    <option value="File PDF">File PDF</option>
                  </select>
                </div>
              </div>

              {/* Chọn tài liệu thuộc gói */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Chọn các tài liệu trong gói ({pkg.product_ids?.length || 0} sách đã chọn):
                </label>
                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded p-2 bg-white grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {allProducts.map((p) => {
                    const isChecked = (pkg.product_ids || []).includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = pkg.product_ids || [];
                            const updated = e.target.checked
                              ? [...current, p.id]
                              : current.filter((id) => id !== p.id);
                            handleUpdatePackage(idx, { product_ids: updated });
                          }}
                        />
                        <span className="text-[11px] text-gray-800 line-clamp-1">{p.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EditComboSectionsConfig: React.FC<{
  config: ComboSectionsBlockConfig;
  allProducts: Product[];
  onUpdate: (cfg: Partial<ComboSectionsBlockConfig>) => void;
}> = ({ config, allProducts, onUpdate }) => {
  const groups = config.groups || [];

  const handleAddGroup = () => {
    const newGroup: ComboSectionGroupItem = {
      id: `sec_${Date.now()}`,
      title: 'TIÊU ĐỀ PHÂN NHÓM TÀI LIỆU MỚI',
      product_ids: [],
    };
    onUpdate({ groups: [...groups, newGroup] });
  };

  const handleUpdateGroup = (index: number, partial: Partial<ComboSectionGroupItem>) => {
    const list = [...groups];
    list[index] = { ...list[index], ...partial };
    onUpdate({ groups: list });
  };

  const handleDeleteGroup = (index: number) => {
    const list = [...groups];
    list.splice(index, 1);
    onUpdate({ groups: list });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-bold text-gray-700 mb-1">Tiêu đề lớn đầu khu vực</label>
        <input
          type="text"
          value={config.group_header || ''}
          onChange={(e) => onUpdate({ group_header: e.target.value })}
          placeholder="Xem chi tiết từng bộ tài liệu"
          className="w-full border border-gray-300 rounded px-2.5 py-1.5"
        />
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-800">Danh sách các Nhóm tài liệu ({groups.length})</span>
          <button
            type="button"
            onClick={handleAddGroup}
            className="bg-[#e60049] text-white font-bold px-3 py-1 rounded text-xs hover:bg-[#cc0041]"
          >
            + Thêm Nhóm Mới
          </button>
        </div>

        <div className="space-y-4">
          {groups.map((group, idx) => (
            <div key={group.id} className="border border-gray-200 rounded p-3.5 bg-gray-50/70 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <span className="font-extrabold text-[#e60049]">Nhóm #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(idx)}
                  className="text-red-600 hover:underline font-bold text-[11px]"
                >
                  Xóa nhóm này
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Tiêu đề nhóm (Đỏ đậm)</label>
                <input
                  type="text"
                  value={group.title}
                  onChange={(e) => handleUpdateGroup(idx, { title: e.target.value })}
                  placeholder="3 bộ đề mới nhất..."
                  className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white font-bold text-[#e60049]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Chọn các tài liệu trong nhóm ({group.product_ids?.length || 0} sách đã chọn):
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-white grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {allProducts.map((p) => {
                    const isChecked = (group.product_ids || []).includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = group.product_ids || [];
                            const updated = e.target.checked
                              ? [...current, p.id]
                              : current.filter((id) => id !== p.id);
                            handleUpdateGroup(idx, { product_ids: updated });
                          }}
                        />
                        <span className="text-[11px] text-gray-800 line-clamp-1">{p.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EditComboBottomCtaConfig: React.FC<{
  config: ComboBottomCtaBlockConfig;
  onUpdate: (cfg: Partial<ComboBottomCtaBlockConfig>) => void;
}> = ({ config, onUpdate }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block font-bold text-gray-700 mb-1">Chữ trên nút đỏ</label>
        <input
          type="text"
          value={config.btn_title || ''}
          onChange={(e) => onUpdate({ btn_title: e.target.value })}
          placeholder="Mua ngay"
          className="w-full border border-gray-300 rounded px-2.5 py-1.5"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Nhãn ưu đãi vàng</label>
        <input
          type="text"
          value={config.discount_text || ''}
          onChange={(e) => onUpdate({ discount_text: e.target.value })}
          placeholder="Giảm tới 25%"
          className="w-full border border-gray-300 rounded px-2.5 py-1.5"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Dòng ghi chú chân trang</label>
        <input
          type="text"
          value={config.note_text || ''}
          onChange={(e) => onUpdate({ note_text: e.target.value })}
          placeholder="* Điểm thành viên được tích lũy..."
          className="w-full border border-gray-300 rounded px-2.5 py-1.5"
        />
      </div>
    </div>
  );
};

const EditComboBannerConfig: React.FC<{
  config: ComboBannerBlockConfig;
  onUpdate: (cfg: Partial<ComboBannerBlockConfig>) => void;
  onUploadR2: (file: File) => Promise<string>;
  uploading: boolean;
}> = ({ config, onUpdate, onUploadR2, uploading }) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block font-bold text-gray-700 mb-1">URL Ảnh Banner R2</label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={config.banner_url || ''}
            onChange={(e) => onUpdate({ banner_url: e.target.value })}
            placeholder="https://media.huytutor.edu.vn/..."
            className="flex-1 border border-gray-300 rounded px-2.5 py-1.5"
          />
          <label className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold px-3 py-1.5 rounded cursor-pointer shrink-0">
            {uploading ? 'Đang tải...' : 'Tải ảnh lên R2'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const url = await onUploadR2(f);
                  onUpdate({ banner_url: url });
                }
              }}
            />
          </label>
        </div>
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Đường dẫn đích khi click (tùy chọn)</label>
        <input
          type="text"
          value={config.link_url || ''}
          onChange={(e) => onUpdate({ link_url: e.target.value })}
          placeholder="/high-school hoặc https://..."
          className="w-full border border-gray-300 rounded px-2.5 py-1.5"
        />
      </div>
    </div>
  );
};

const EditComboNoticeConfig: React.FC<{
  config: ComboNoticeBlockConfig;
  onUpdate: (cfg: Partial<ComboNoticeBlockConfig>) => void;
}> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block font-bold text-gray-700 mb-1">Nhãn thẻ</label>
        <input
          type="text"
          value={config.badge_label || ''}
          onChange={(e) => onUpdate({ badge_label: e.target.value })}
          placeholder="LƯU Ý"
          className="w-full border border-gray-300 rounded px-2.5 py-1.5"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Nội dung thông báo</label>
        <textarea
          rows={3}
          value={config.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full border border-gray-300 rounded px-2.5 py-1.5"
        />
      </div>
    </div>
  );
};

