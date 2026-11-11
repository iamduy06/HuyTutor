import React, { useState, useMemo } from 'react';
import { UniversalBlockCategory, UniversalBlockItem, UniversalPageContext } from '../types';
import {
  UNIVERSAL_BLOCK_CATALOG,
  UNIVERSAL_CATEGORY_TABS,
  createDefaultUniversalBlock,
} from './universalCatalog';
import { BlockIllustration } from './BlockIllustration';

interface UniversalBlockPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (newBlock: UniversalBlockItem) => void;
  currentBlocksCount: number;
  context?: UniversalPageContext;
}

export const UniversalBlockPickerModal: React.FC<UniversalBlockPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectBlock,
  currentBlocksCount,
  context,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | UniversalBlockCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBlocks = useMemo(() => {
    return UNIVERSAL_BLOCK_CATALOG.filter((item) => {
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.originPage.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handlePick = (type: string) => {
    const newBlock = createDefaultUniversalBlock(type, currentBlocksCount + 1, context);
    onSelectBlock(newBlock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-md shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#e60049] uppercase tracking-wide">
                Thư Viện Khối Vạn Năng (Universal Blocks)
              </h2>
              <span className="text-[10px] bg-pink-100 text-[#e60049] font-black px-2 py-0.5 rounded">
                25+ KHỐI CHUẨN HÓA
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Chọn bất kỳ khối nào từ Trang chủ, Combo, Flashcard, Cấp 1, Cấp 2 hoặc Quà tặng để thêm vào trang hiện tại mà không bị giới hạn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center font-bold text-sm transition"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-white space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {UNIVERSAL_CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`text-xs font-bold px-3 py-1.5 rounded-sm transition ${
                  selectedCategory === tab.key
                    ? 'bg-[#e60049] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm kiếm khối theo tên, mô tả hoặc trang gốc..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#e60049] focus:ring-1 focus:ring-[#e60049]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Grid Danh Sách Khối */}
        <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50">
          {filteredBlocks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              Không tìm thấy khối nào phù hợp với từ khóa "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredBlocks.map((item) => (
                <div
                  key={item.type}
                  className="bg-white border border-gray-200 hover:border-[#e60049] rounded-md p-4 shadow-2xs transition flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${item.badgeColor?.startsWith('#') ? 'text-white' : item.badgeColor}`}
                        style={item.badgeColor?.startsWith('#') ? { backgroundColor: item.badgeColor } : undefined}
                      >
                        {item.type}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Gốc: {item.originPage}
                      </span>
                    </div>

                    {/* Sơ đồ minh họa trực quan từ thiết kế */}
                    <div className="pt-1">
                      <BlockIllustration type={item.type} className="w-full h-24 shadow-2xs" />
                    </div>

                    <h3 className="text-xs font-black text-gray-900 group-hover:text-[#e60049] transition">
                      {item.label}
                    </h3>

                    <p className="text-[11px] text-gray-600 line-clamp-3 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-pink-600">
                      Nhóm: {item.categoryLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePick(item.type)}
                      className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3.5 py-1.5 rounded-sm transition shadow-2xs flex items-center gap-1"
                    >
                      <span>+ Thêm vào trang</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 px-5">
          <span>
            Hiển thị <strong>{filteredBlocks.length}</strong> / {UNIVERSAL_BLOCK_CATALOG.length} khối
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 font-bold px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

