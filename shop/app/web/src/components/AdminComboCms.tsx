import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import { R2ImageUploader } from './R2ImageUploader';
import {
  ComboBannerBlockConfig,
  ComboBlockType,
  ComboBottomCtaBlockConfig,
  ComboFormatPricing,
  ComboHeroBlockConfig,
  ComboNoticeBlockConfig,
  ComboPackageItem,
  ComboPackagesBlockConfig,
  ComboPageBlockItem,
  ComboSectionGroupItem,
  ComboSectionsBlockConfig,
  Product,
  UiFormatCode,
  UI_FORMATS,
  formatVnd,
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
import { UniversalBlockPickerModal } from './UniversalBlockPickerModal';
import { UniversalBlockRenderer } from './UniversalBlockRenderer';
import { UniversalBlockItemEditor } from './UniversalBlockItemEditor';
import { UNIVERSAL_BLOCK_CATALOG } from './universalCatalog';
import { ReorderableProductSelector } from './ReorderableProductSelector';

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

import { ensurePackageFormatPricings } from '../utils/comboPricingEngine';

export { ensurePackageFormatPricings };

export const AdminComboCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, products, showToast } = useStore();

  const [blocks, setBlocks] = useState<ComboPageBlockItem[]>(() => {
    return buildInitialComboBlocks(products, siteConfigs?.combo_page_blocks);
  });

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showUniversalPicker, setShowUniversalPicker] = useState(false);

  useEffect(() => {
    if (Array.isArray(siteConfigs?.combo_page_blocks) && siteConfigs.combo_page_blocks.length > 0) {
      setBlocks(siteConfigs.combo_page_blocks);
    }
  }, [siteConfigs?.combo_page_blocks]);

  // Kiểm tra tính hợp lệ và ràng buộc giá của toàn bộ gói Combo trước khi lưu
  const validateComboBlocks = (): string | null => {
    for (const block of blocks) {
      if (block.type === 'combo_packages') {
        const cfg = block.config as ComboPackagesBlockConfig;
        const packages = cfg?.packages || [];
        for (let i = 0; i < packages.length; i++) {
          const pkg = packages[i];
          const comboTitle = pkg.title?.trim() || `Gói #${i + 1}`;
          if (!pkg.product_ids || pkg.product_ids.length === 0) {
            return `Gói combo "${comboTitle}" phải chọn ít nhất 1 tài liệu.`;
          }

          const pricings = ensurePackageFormatPricings(pkg);
          const enabledPricings = pricings.filter((fp) => fp.is_enabled);
          if (enabledPricings.length === 0) {
            return `Vui lòng nhập giá ưu đãi cho định dạng ${pricings[0]?.format_code || 'Word'} của gói "${comboTitle}".`;
          }

          const selectedProds = products.filter(
            (p) => (pkg.product_ids || []).includes(p.id) || (pkg.product_ids || []).includes(p.slug)
          );

          for (const fp of enabledPricings) {
            const formatCode = fp.format_code;
            if (fp.combo_price === '' || isNaN(Number(fp.combo_price)) || Number(fp.combo_price) <= 0) {
              return `Vui lòng nhập giá ưu đãi cho định dạng ${formatCode} của gói "${comboTitle}".`;
            }

            const comboPrice = Number(fp.combo_price);

            // Kiểm tra từng tài liệu trong gói có hỗ trợ định dạng này không
            for (const prod of selectedProds) {
              const fmtObj = (prod.formats || []).find(
                (f) => f.format_code === formatCode && f.is_active && Number(f.price) > 0
              );
              if (!fmtObj) {
                return `Tài liệu "${prod.title}" trong gói "${comboTitle}" chưa hỗ trợ định dạng ${formatCode}.`;
              }
            }

            const formatPrices = selectedProds.map((prod) => {
              const fmtObj = (prod.formats || []).find((f) => f.format_code === formatCode);
              return Number(fmtObj?.price || 0);
            });

            const totalCount = selectedProds.length;
            const totalOriginalPrice = formatPrices.reduce((sum, pr) => sum + pr, 0);

            if (comboPrice >= totalOriginalPrice) {
              return `Giá ưu đãi định dạng ${formatCode} của gói "${comboTitle}" (${formatVnd(comboPrice)}) phải nhỏ hơn tổng giá gốc của ${totalCount} sản phẩm (${formatVnd(totalOriginalPrice)}).`;
            }
          }
        }
      }
    }
    return null;
  };

  // Lưu cấu hình vào Database
  const handleSaveBlocks = async () => {
    const validationError = validateComboBlocks();
    if (validationError) {
      showToast(validationError);
      return;
    }

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
            <UniversalBlockRenderer
              blocks={blocks}
              context={{
                pageType: 'combo',
                allProducts: products,
                siteConfigs,
              }}
            />
          </div>
        </div>
      )}

      {/* Danh sách Khối Động (Block Repeater) */}
      <div className="space-y-4">
        {blocks.map((block, index) => {
          const meta =
            COMBO_BLOCK_META[block.type] ||
            UNIVERSAL_BLOCK_CATALOG.find((m) => m.type === block.type) || {
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
                    />
                  )}

                  {/* EDIT KHỐI PHỤ: NOTICE */}
                  {block.type === 'combo_notice' && (
                    <EditComboNoticeConfig
                      config={block.config as ComboNoticeBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(block.id, cfg)}
                    />
                  )}

                  {/* EDIT KHỐI VẠN NĂNG TỪ CÁC TRANG KHÁC */}
                  {!['combo_hero', 'combo_packages', 'combo_sections', 'combo_bottom_cta', 'combo_banner', 'combo_notice'].includes(block.type) && (
                    <UniversalBlockItemEditor
                      block={block as any}
                      onUpdateConfig={(cfg) => handleUpdateBlockConfig(block.id, cfg)}
                      allProducts={products}
                      context={{
                        pageType: 'combo',
                        allProducts: products,
                        siteConfigs,
                      }}
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
          <button
            type="button"
            onClick={() => setShowUniversalPicker(true)}
            className="bg-[#e60049] hover:bg-[#cc0041] text-white font-extrabold text-xs px-4 py-1.5 rounded-sm transition shadow-2xs flex items-center gap-1.5"
          >
            <span>✨ THƯ VIỆN KHỐI VẠN NĂNG (25+ KHỐI TOÀN TRANG)</span>
          </button>
        </div>
      </div>

      <UniversalBlockPickerModal
        isOpen={showUniversalPicker}
        onClose={() => setShowUniversalPicker(false)}
        onSelectBlock={(newBlock) => {
          setBlocks((prev) => [...prev, newBlock as any]);
          setEditingBlockId(newBlock.id);
          showToast(`Đã thêm mới: ${newBlock.title_label || newBlock.type}`);
        }}
        currentBlocksCount={blocks.length}
        context={{
          pageType: 'combo',
          allProducts: products,
          siteConfigs,
        }}
      />
    </div>
  );
};

// ============================================================================
// SUB-EDITORS FOR EACH BLOCK TYPE
// ============================================================================

export const EditComboHeroConfig: React.FC<{
  config: ComboHeroBlockConfig;
  onUpdate: (cfg: Partial<ComboHeroBlockConfig>) => void;
}> = ({ config, onUpdate }) => {
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
          <div className="p-3.5 bg-pink-50/30 rounded border border-pink-200">
            <R2ImageUploader
              label="Ảnh Banner lớn (Cloudflare R2)"
              helperText="Tải ảnh banner lớn thiết kế hoàn chỉnh. Khuyên dùng tỉ lệ ngang 16:9 hoặc 1200x500 px."
              imageUrl={config.banner_image_url || ''}
              onUrlChange={(url) => onUpdate({ banner_image_url: url })}
              folder="combos"
              pageLevel1="combo_thpt"
              pageLevel2="hero"
              fitMode="contain"
              maxPreviewHeight="max-h-36"
              aspectRatioHint="16:9 hoặc 1200x500 px"
            />
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

export const EditComboPackagesConfig: React.FC<{
  config: ComboPackagesBlockConfig;
  allProducts: Product[];
  onUpdate: (cfg: Partial<ComboPackagesBlockConfig>) => void;
}> = ({ config, allProducts, onUpdate }) => {
  const packages = config.packages || [];
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedMap((prev) => {
      const current = prev[id] !== undefined ? prev[id] : packages.length === 1;
      return { ...prev, [id]: !current };
    });
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    packages.forEach((p) => {
      next[p.id] = false;
    });
    setExpandedMap(next);
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    packages.forEach((p) => {
      next[p.id] = true;
    });
    setExpandedMap(next);
  };

  const handleMovePackage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= packages.length) return;
    const list = [...packages];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    onUpdate({ packages: list });
  };

  const handleAddPackage = () => {
    const newId = `pkg_${Date.now()}`;
    const newPkg: ComboPackageItem = {
      id: newId,
      title: 'TÊN GÓI COMBO MỚI',
      discount_badge: '',
      format_badge: 'File Word',
      tag_text: 'Combo',
      thumbnail_url: '',
      product_ids: [],
      format_pricings: UI_FORMATS.map((fmt) => ({
        format_code: fmt,
        is_enabled: fmt === 'Word' || fmt === 'PDF',
        combo_price: '',
      })),
      action_type: 'add_to_cart',
    };
    setExpandedMap((prev) => ({ ...prev, [newId]: true }));
    onUpdate({ packages: [...packages, newPkg] });
  };

  const handleUpdatePackage = (index: number, partial: Partial<ComboPackageItem>) => {
    const list = [...packages];
    list[index] = { ...list[index], ...partial };
    onUpdate({ packages: list });
  };

  const handleDeletePackage = (index: number) => {
    const target = packages[index];
    const targetTitle = target?.title?.trim() || `Gói #${index + 1}`;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${targetTitle}" khỏi danh sách?`)) return;
    const list = [...packages];
    list.splice(index, 1);
    onUpdate({ packages: list });
  };

  const handleUpdateFormatPricing = (
    pkgIdx: number,
    formatCode: UiFormatCode,
    partial: Partial<ComboFormatPricing>
  ) => {
    const currentPricings = ensurePackageFormatPricings(packages[pkgIdx]);
    const updatedPricings = currentPricings.map((fp) =>
      fp.format_code === formatCode ? { ...fp, ...partial } : fp
    );
    handleUpdatePackage(pkgIdx, { format_pricings: updatedPricings });
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
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Dòng hướng dẫn phụ</label>
          <input
            type="text"
            value={config.sub_text || ''}
            onChange={(e) => onUpdate({ sub_text: e.target.value })}
            placeholder="Sử dụng ưu đãi thành viên để được giảm thêm trên đơn hàng."
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-bold text-gray-800">Danh sách các Thẻ Gói Combo ({packages.length})</span>
          <div className="flex items-center gap-2">
            {packages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-[11px] font-semibold px-2 py-1 rounded cursor-pointer transition"
                >
                  Thu gọn tất cả
                </button>
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-[11px] font-semibold px-2 py-1 rounded cursor-pointer transition"
                >
                  Mở rộng tất cả
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleAddPackage}
              className="bg-[#e60049] text-white font-bold px-3 py-1 rounded text-xs hover:bg-[#cc0041] transition cursor-pointer"
            >
              + Thêm Thẻ Gói Mới
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {packages.map((pkg, idx) => {
            const formatPricings = ensurePackageFormatPricings(pkg);
            const selectedProds = allProducts.filter(
              (p) => (pkg.product_ids || []).includes(p.id) || (pkg.product_ids || []).includes(p.slug)
            );
            const totalCount = selectedProds.length;

            const isExpanded =
              expandedMap[pkg.id] !== undefined ? expandedMap[pkg.id] : packages.length === 1;
            const pkgTitle = pkg.title?.trim() || 'Chưa đặt tên gói';

            return (
              <div key={pkg.id} className="border border-gray-200 rounded p-3.5 bg-gray-50/70 space-y-3.5 shadow-xs">
                {/* Header thanh công cụ của thẻ gói: Chevron + [▲][▼] + Tiêu đề dạng #1 - Tên gói (X tài liệu) + Xóa */}
                <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {/* Nút mũi tên Chevron Thu gọn / Mở rộng */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(pkg.id)}
                      className="p-1 text-gray-500 hover:text-[#e60049] hover:bg-white border border-transparent hover:border-gray-200 rounded cursor-pointer transition shrink-0"
                      title={isExpanded ? 'Thu gọn thẻ gói này' : 'Mở rộng thẻ gói này'}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? '' : '-rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Cụm nút di chuyển thứ tự [▲ Lên] và [▼ Xuống] */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMovePackage(idx, 'up')}
                        className="w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Di chuyển Gói này lên trước"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === packages.length - 1}
                        onClick={() => handleMovePackage(idx, 'down')}
                        className="w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Di chuyển Gói này xuống sau"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Tiêu đề dạng #1 - [Tên gói tài liệu] (X tài liệu được chọn) */}
                    <div
                      onClick={() => toggleExpand(pkg.id)}
                      className="flex items-center gap-1.5 cursor-pointer select-none truncate ml-0.5"
                    >
                      <span className="font-extrabold text-[#e60049] text-xs shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-gray-400 font-bold text-xs shrink-0">-</span>
                      <span className="text-xs font-bold text-gray-900 truncate" title={pkg.title}>
                        {pkgTitle}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium shrink-0 ml-1">
                        ({totalCount} tài liệu được chọn)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePackage(idx)}
                    className="text-red-600 hover:underline font-bold text-[11px] cursor-pointer shrink-0 ml-2"
                  >
                    Xóa thẻ này
                  </button>
                </div>

                {/* Nội dung chi tiết thẻ gói (Ẩn khi thu gọn) */}
                {isExpanded && (
                  <div className="space-y-3.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Tên gói tài liệu *</label>
                    <textarea
                      rows={2}
                      value={pkg.title}
                      onChange={(e) => handleUpdatePackage(idx, { title: e.target.value })}
                      placeholder="Ví dụ: COMBO 3 BỘ ĐỀ THPT 2025"
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Huy hiệu giảm giá (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={pkg.discount_badge || ''}
                      onChange={(e) => handleUpdatePackage(idx, { discount_badge: e.target.value })}
                      placeholder="Để trống tự tính %"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white text-xs font-bold text-red-600"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Nếu để trống, hệ thống tự hiển thị theo % thực tế.
                    </span>
                  </div>
                </div>

                {/* Ảnh Thumbnail gói Combo (Cloudflare R2) */}
                <div className="border border-gray-200 rounded p-2.5 bg-white">
                  <R2ImageUploader
                    label="Ảnh Thumbnail Thẻ Gói Combo (Cloudflare R2)"
                    helperText="Tải ảnh thumbnail đại diện cho gói combo này (khuyên dùng tỉ lệ 16:9, 3:2 hoặc hình chữ nhật ngang). Nếu để trống, hệ thống tự hiển thị các bìa sách mini thuộc gói."
                    imageUrl={pkg.thumbnail_url || ''}
                    onUrlChange={(url) => handleUpdatePackage(idx, { thumbnail_url: url })}
                    folder="combos"
                    pageLevel1="combo_thpt"
                    pageLevel2={pkg.id}
                    aspectRatioHint="16:9, 3:2 hoặc ngang"
                    maxPreviewHeight="max-h-32"
                    fitMode="contain"
                  />
                </div>

                {/* Chọn tài liệu thuộc gói kèm sắp xếp thứ tự */}
                <ReorderableProductSelector
                  label={`Chọn & Sắp xếp thứ tự tài liệu trong gói (${totalCount} sách đã chọn)`}
                  selectedIds={pkg.product_ids || []}
                  allProducts={allProducts}
                  onChange={(updated) => handleUpdatePackage(idx, { product_ids: updated })}
                  helpText="Thứ tự từ trên xuống dưới tương ứng với thứ tự sách hiển thị trong chi tiết gói Combo."
                />

                {/* BẢNG CẤU HÌNH 5 ĐỊNH DẠNG & GIÁ COMBO (Khởi tạo rỗng, tính động 100%) */}
                <div className="border border-pink-100 rounded-md bg-white p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                    <div>
                      <span className="text-xs font-black uppercase text-[#e60049] flex items-center gap-1.5">
                        Cấu hình 5 Định dạng &amp; Giá ưu đãi Combo
                      </span>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Tích chọn định dạng áp dụng và nhập mức giá ưu đãi Combo (yêu cầu nhỏ hơn tổng giá gốc lẻ của gói).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {UI_FORMATS.map((fmt) => {
                      const fp = formatPricings.find((item) => item.format_code === fmt) || {
                        format_code: fmt,
                        is_enabled: false,
                        combo_price: '',
                      };

                      const formatPrices = selectedProds.map((prod) => {
                        const fmtObj = (prod.formats || []).find(
                          (f) => f.format_code === fmt && f.is_active && Number(f.price) > 0
                        );
                        return fmtObj ? Number(fmtObj.price) : 0;
                      });

                      const totalOriginalPrice = formatPrices.reduce((sum, pr) => sum + pr, 0);
                      const hasMissingFormat = totalCount > 0 && formatPrices.some((pr) => pr <= 0);

                      const numEntered = fp.combo_price === '' ? null : Number(fp.combo_price);
                      let isValidPrice = true;
                      let priceErrorNotice: string | null = null;

                      if (fp.is_enabled && numEntered !== null) {
                        if (numEntered <= 0) {
                          isValidPrice = false;
                          priceErrorNotice = 'Giá ưu đãi phải > 0đ';
                        } else if (numEntered >= totalOriginalPrice) {
                          isValidPrice = false;
                          priceErrorNotice = `Phải < ${formatVnd(totalOriginalPrice)} (tổng giá gốc ${totalCount} sách)`;
                        }
                      }

                      return (
                        <div
                          key={fmt}
                          className={`p-2.5 rounded border text-xs transition ${
                            fp.is_enabled
                              ? 'bg-pink-50/40 border-pink-200'
                              : 'bg-gray-50/60 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                              <input
                                type="checkbox"
                                checked={fp.is_enabled}
                                onChange={(e) =>
                                  handleUpdateFormatPricing(idx, fmt, { is_enabled: e.target.checked })
                                }
                                className="accent-[#e60049] w-4 h-4 cursor-pointer"
                              />
                              <span className="text-xs">{fmt}</span>
                            </label>

                            <div className="flex-1 sm:text-right text-[11px] text-gray-600">
                              {totalCount === 0 ? (
                                <span className="text-gray-400">Chọn tài liệu ở trên để tính giá gốc</span>
                              ) : hasMissingFormat ? (
                                <span className="text-amber-600 font-semibold">
                                  Có tài liệu trong gói chưa có giá định dạng này
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span>
                                    Tổng gốc: <strong>{formatVnd(totalOriginalPrice)}</strong>
                                  </span>
                                  {totalCount >= 1 && (
                                    <span className="text-gray-500 block text-[10px]">
                                      Nhập giá ưu đãi &lt; {formatVnd(totalOriginalPrice)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <input
                                type="number"
                                disabled={!fp.is_enabled}
                                value={fp.combo_price === '' ? '' : fp.combo_price}
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  handleUpdateFormatPricing(idx, fmt, {
                                    combo_price: val === '' ? '' : Math.max(0, parseInt(val, 10) || 0),
                                  });
                                }}
                                placeholder="Nhập giá ưu đãi..."
                                className="w-36 border border-gray-300 rounded px-2 py-1 bg-white text-xs font-bold text-[#e60049] disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-[#e60049]"
                              />
                              <span className="text-[11px] text-gray-500 font-semibold">đ</span>
                            </div>
                          </div>

                          {fp.is_enabled && priceErrorNotice && (
                            <div className="mt-1 text-[11px] font-bold text-[#e60049] bg-red-50 p-1 rounded border border-red-200">
                              {priceErrorNotice}
                            </div>
                          )}

                          {fp.is_enabled && !priceErrorNotice && numEntered !== null && numEntered > 0 && totalCount > 0 && !hasMissingFormat && (
                            <div className="mt-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                              Hợp lệ (Tiết kiệm {formatVnd(totalOriginalPrice - numEntered)} - Giảm {Math.round(((totalOriginalPrice - numEntered) / totalOriginalPrice) * 100)}%)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const EditComboSectionsConfig: React.FC<{
  config: ComboSectionsBlockConfig;
  allProducts: Product[];
  onUpdate: (cfg: Partial<ComboSectionsBlockConfig>) => void;
}> = ({ config, allProducts, onUpdate }) => {
  const groups = config.groups || [];
  const [expandedGroupMap, setExpandedGroupMap] = useState<Record<string, boolean>>({});

  const toggleGroupExpand = (id: string) => {
    setExpandedGroupMap((prev) => {
      const current = prev[id] !== undefined ? prev[id] : groups.length === 1;
      return { ...prev, [id]: !current };
    });
  };

  const handleCollapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    groups.forEach((g) => {
      next[g.id] = false;
    });
    setExpandedGroupMap(next);
  };

  const handleExpandAllGroups = () => {
    const next: Record<string, boolean> = {};
    groups.forEach((g) => {
      next[g.id] = true;
    });
    setExpandedGroupMap(next);
  };

  const handleMoveGroup = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= groups.length) return;
    const list = [...groups];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    onUpdate({ groups: list });
  };

  const handleAddGroup = () => {
    const newId = `sec_${Date.now()}`;
    const newGroup: ComboSectionGroupItem = {
      id: newId,
      title: 'TIÊU ĐỀ PHÂN NHÓM TÀI LIỆU MỚI',
      product_ids: [],
    };
    setExpandedGroupMap((prev) => ({ ...prev, [newId]: true }));
    onUpdate({ groups: [...groups, newGroup] });
  };

  const handleUpdateGroup = (index: number, partial: Partial<ComboSectionGroupItem>) => {
    const list = [...groups];
    list[index] = { ...list[index], ...partial };
    onUpdate({ groups: list });
  };

  const handleDeleteGroup = (index: number) => {
    const target = groups[index];
    const targetTitle = target?.title?.trim() || `Nhóm #${index + 1}`;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${targetTitle}" khỏi danh sách?`)) return;
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
          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
        />
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-bold text-gray-800">Danh sách các Nhóm tài liệu ({groups.length})</span>
          <div className="flex items-center gap-2">
            {groups.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handleCollapseAllGroups}
                  className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-[11px] font-semibold px-2 py-1 rounded cursor-pointer transition"
                >
                  Thu gọn tất cả
                </button>
                <button
                  type="button"
                  onClick={handleExpandAllGroups}
                  className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-[11px] font-semibold px-2 py-1 rounded cursor-pointer transition"
                >
                  Mở rộng tất cả
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleAddGroup}
              className="bg-[#e60049] text-white font-bold px-3 py-1 rounded text-xs hover:bg-[#cc0041] transition cursor-pointer"
            >
              + Thêm Nhóm Mới
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {groups.map((group, idx) => {
            const isExpanded =
              expandedGroupMap[group.id] !== undefined
                ? expandedGroupMap[group.id]
                : groups.length === 1;
            const groupTitle = group.title?.trim() || 'Chưa đặt tiêu đề nhóm';
            const totalCount = group.product_ids?.length || 0;

            return (
              <div key={group.id} className="border border-gray-200 rounded p-3.5 bg-gray-50/70 space-y-3 shadow-xs">
                {/* Header thanh công cụ của nhóm: Chevron + [▲][▼] + Tiêu đề dạng #1 - Tên nhóm (X tài liệu) + Xóa */}
                <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {/* Nút mũi tên Chevron Thu gọn / Mở rộng */}
                    <button
                      type="button"
                      onClick={() => toggleGroupExpand(group.id)}
                      className="p-1 text-gray-500 hover:text-[#e60049] hover:bg-white border border-transparent hover:border-gray-200 rounded cursor-pointer transition shrink-0"
                      title={isExpanded ? 'Thu gọn nhóm này' : 'Mở rộng nhóm này'}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? '' : '-rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Cụm nút di chuyển thứ tự [▲ Lên] và [▼ Xuống] */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveGroup(idx, 'up')}
                        className="w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Di chuyển Nhóm này lên trước"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === groups.length - 1}
                        onClick={() => handleMoveGroup(idx, 'down')}
                        className="w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Di chuyển Nhóm này xuống sau"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Tiêu đề dạng #1 - [Tiêu đề nhóm] (X tài liệu được chọn) */}
                    <div
                      onClick={() => toggleGroupExpand(group.id)}
                      className="flex items-center gap-1.5 cursor-pointer select-none truncate ml-0.5"
                    >
                      <span className="font-extrabold text-[#e60049] text-xs shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-gray-400 font-bold text-xs shrink-0">-</span>
                      <span className="text-xs font-bold text-gray-900 truncate" title={group.title}>
                        {groupTitle}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium shrink-0 ml-1">
                        ({totalCount} tài liệu được chọn)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(idx)}
                    className="text-red-600 hover:underline font-bold text-[11px] cursor-pointer shrink-0 ml-2"
                  >
                    Xóa nhóm này
                  </button>
                </div>

                {/* Nội dung chi tiết nhóm (Ẩn khi thu gọn) */}
                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Tiêu đề nhóm (Đỏ đậm)</label>
                      <input
                        type="text"
                        value={group.title}
                        onChange={(e) => handleUpdateGroup(idx, { title: e.target.value })}
                        placeholder="3 bộ đề mới nhất..."
                        className="w-full border border-gray-300 rounded px-2 py-1.5 bg-white font-bold text-[#e60049] text-xs"
                      />
                    </div>

                    {/* Chọn tài liệu trong nhóm kèm sắp xếp thứ tự */}
                    <ReorderableProductSelector
                      label={`Chọn & Sắp xếp thứ tự tài liệu trong nhóm (${totalCount} sách đã chọn)`}
                      selectedIds={group.product_ids || []}
                      allProducts={allProducts}
                      onChange={(updated) => handleUpdateGroup(idx, { product_ids: updated })}
                      helpText="Thứ tự từ trên xuống dưới tương ứng từ trái qua phải trên lưới 3 cột ngoài web."
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const EditComboBottomCtaConfig: React.FC<{
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

export const EditComboBannerConfig: React.FC<{
  config: ComboBannerBlockConfig;
  onUpdate: (cfg: Partial<ComboBannerBlockConfig>) => void;
}> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-3">
      <div>
        <R2ImageUploader
          label="Ảnh Banner Ngang (Cloudflare R2)"
          helperText="Tải ảnh banner ưu đãi combo. Khuyên dùng tỉ lệ ngang 1200x300 hoặc 1920x450 px."
          imageUrl={config.banner_url || ''}
          onUrlChange={(url) => onUpdate({ banner_url: url })}
          folder="combos"
          pageLevel1="combo_thpt"
          pageLevel2="banner"
          fitMode="contain"
          maxPreviewHeight="max-h-32"
          aspectRatioHint="1200x300 hoặc 1920x450 px"
        />
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

export const EditComboNoticeConfig: React.FC<{
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

