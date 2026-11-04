import React, { useState } from 'react';
import {
  CategoryItem,
  Product,
  UniversalBlockItem,
  UniversalPageContext,
} from '../types';
import { UNIVERSAL_BLOCK_CATALOG, createDefaultUniversalBlock } from './universalCatalog';
import { UniversalBlockItemEditor } from './UniversalBlockItemEditor';
import { UniversalBlockPickerModal } from './UniversalBlockPickerModal';

export interface UniversalBlockCardRepeaterProps {
  pageTitle: string;
  pageRouteLabel: string;
  blocks: (UniversalBlockItem | any)[];
  onBlocksChange: (newBlocks: any[]) => void;
  allProducts?: Product[];
  allCategories?: CategoryItem[];
  context?: UniversalPageContext;
  quickAddTypes?: { type: string; label: string }[];
  renderCustomEditor?: (
    block: UniversalBlockItem,
    onUpdate: (cfg: any) => void
  ) => React.ReactNode | null;
}

export const UniversalBlockCardRepeater: React.FC<UniversalBlockCardRepeaterProps> = ({
  pageTitle,
  pageRouteLabel,
  blocks,
  onBlocksChange,
  allProducts = [],
  allCategories = [],
  context,
  quickAddTypes = [],
  renderCustomEditor,
}) => {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showPickerModal, setShowPickerModal] = useState<boolean>(false);

  // Move block up or down
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const list = [...blocks];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);

    const reordered = list.map((b, idx) => ({ ...b, sort_order: idx + 1 }));
    onBlocksChange(reordered);
  };

  // Toggle active
  const handleToggleBlockActive = (blockId: string) => {
    const updated = blocks.map((b) =>
      b.id === blockId ? { ...b, is_active: !b.is_active } : b
    );
    onBlocksChange(updated);
  };

  // Delete block
  const handleDeleteBlock = (blockId: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khối này khỏi ${pageTitle}?`)) return;
    const filtered = blocks.filter((b) => b.id !== blockId);
    onBlocksChange(filtered);
    if (editingBlockId === blockId) setEditingBlockId(null);
  };

  // Update block config
  const handleUpdateBlockConfig = (blockId: string, partialConfig: any) => {
    const updated = blocks.map((b) =>
      b.id === blockId ? { ...b, config: { ...b.config, ...partialConfig } } : b
    );
    onBlocksChange(updated);
  };

  // Quick add block
  const handleQuickAdd = (type: string) => {
    const newBlock = createDefaultUniversalBlock(type, blocks.length + 1, context);
    onBlocksChange([...blocks, newBlock]);
    setEditingBlockId(newBlock.id);
  };

  return (
    <div className="space-y-4">
      {/* Danh sách các thẻ khối (Block Cards Repeater) */}
      <div className="space-y-4">
        {blocks.map((block, index) => {
          const meta = UNIVERSAL_BLOCK_CATALOG.find((m) => m.type === block.type) || {
            type: block.type,
            label: block.title_label || `KHỐI ${index + 1}: ${block.type}`,
            badgeColor: 'bg-gray-600 text-white',
            desc: '',
            categoryLabel: 'Chung',
            originPage: 'Tùy chỉnh',
          };
          const isEditing = editingBlockId === block.id;

          return (
            <div
              key={block.id || `blk_${index}`}
              className={`bg-white border rounded-md shadow-sm transition overflow-hidden ${
                block.is_active !== false
                  ? 'border-gray-200'
                  : 'border-gray-200 opacity-60 bg-gray-50'
              }`}
            >
              {/* Block Header Toolbar: Title khối - Mô tả của khối đó */}
              <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-gray-50 border-b border-gray-100">
                <div className="max-w-[70%]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-gray-500 w-5">#{index + 1}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-sm ${meta.badgeColor}`}>
                      {block.type}
                    </span>
                    <h3 className="text-xs font-black text-gray-900">{meta.label}</h3>
                  </div>
                  {meta.desc && (
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{meta.desc}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
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
                      block.is_active !== false
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-gray-300 bg-gray-200 text-gray-600'
                    }`}
                  >
                    {block.is_active !== false ? 'Bật' : 'Đang tắt'}
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
                  {renderCustomEditor && renderCustomEditor(block, (cfg) => handleUpdateBlockConfig(block.id, cfg)) ? (
                    renderCustomEditor(block, (cfg) => handleUpdateBlockConfig(block.id, cfg))
                  ) : (
                    <UniversalBlockItemEditor
                      block={block}
                      onUpdateConfig={(cfg) => handleUpdateBlockConfig(block.id, cfg)}
                      allProducts={allProducts}
                      context={context}
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
        <div className="text-xs font-bold text-gray-700 uppercase">
          + THÊM KHỐI MỚI VÀO {pageTitle.toUpperCase()} ({pageRouteLabel})
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {quickAddTypes.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleQuickAdd(item.type)}
              className="bg-white border border-gray-300 hover:border-[#e60049] text-gray-800 hover:text-[#e60049] font-bold text-xs px-3.5 py-1.5 rounded-sm transition shadow-2xs"
            >
              + {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowPickerModal(true)}
            className="bg-[#e60049] hover:bg-[#cc0041] text-white font-extrabold text-xs px-4 py-1.5 rounded-sm transition shadow-2xs flex items-center gap-1.5"
          >
            <span>✨ THƯ VIỆN KHỐI VẠN NĂNG (25+ KHỐI TOÀN TRANG)</span>
          </button>
        </div>
      </div>

      {/* Universal Block Picker Modal */}
      <UniversalBlockPickerModal
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        onSelectBlock={(newBlock) => {
          onBlocksChange([...blocks, newBlock]);
          setEditingBlockId(newBlock.id);
        }}
        currentBlocksCount={blocks.length}
        context={context}
      />
    </div>
  );
};

