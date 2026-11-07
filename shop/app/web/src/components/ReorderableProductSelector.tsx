import React, { useMemo, useState } from 'react';
import { Product } from '../types';

export interface ReorderableProductSelectorProps {
  label?: string;
  selectedIds: string[];
  allProducts: Product[];
  onChange: (newOrderedIds: string[]) => void;
  maxItems?: number;
  helpText?: string;
}

export const ReorderableProductSelector: React.FC<ReorderableProductSelectorProps> = ({
  label = 'Chọn và sắp xếp thứ tự tài liệu hiển thị',
  selectedIds = [],
  allProducts = [],
  onChange,
  maxItems,
  helpText,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpInputs, setJumpInputs] = useState<Record<string, string>>({});

  // Lấy danh sách các object sản phẩm đã chọn theo đúng thứ tự mảng selectedIds
  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => {
        const prod = allProducts.find(
          (p) => String(p.id).toLowerCase() === String(id).toLowerCase() || p.slug === id
        );
        return prod || { id, title: `Tài liệu (${id})`, slug: id, category_slug: '' } as Product;
      })
      .filter(Boolean);
  }, [selectedIds, allProducts]);

  // Bộ lọc tìm kiếm cho danh sách chọn thêm
  const filteredAvailableProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.category_slug || '').toLowerCase().includes(q)
    );
  }, [allProducts, searchQuery]);

  // Di chuyển lên / xuống 1 vị trí
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedIds.length) return;

    const copy = [...selectedIds];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    onChange(copy);
  };

  // Nhập số thứ tự trực tiếp để đổi vị trí (Cách B)
  const handleJumpPosition = (index: number, targetPos1Based: number) => {
    if (isNaN(targetPos1Based)) return;
    const targetIdx = Math.max(0, Math.min(selectedIds.length - 1, targetPos1Based - 1));
    if (targetIdx === index) return;

    const copy = [...selectedIds];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    onChange(copy);
  };

  // Xóa / Bỏ chọn tài liệu (Tự động dồn các phần tử phía sau lên)
  const handleRemove = (index: number) => {
    const copy = selectedIds.filter((_, i) => i !== index);
    onChange(copy);
  };

  // Tích chọn / Bỏ chọn từ danh sách tổng
  const handleToggleProduct = (prodId: string) => {
    const idx = selectedIds.findIndex(
      (id) => String(id).toLowerCase() === String(prodId).toLowerCase()
    );
    if (idx >= 0) {
      handleRemove(idx);
    } else {
      if (maxItems && selectedIds.length >= maxItems) {
        alert(`Khối này chỉ cho phép tối đa ${maxItems} tài liệu.`);
        return;
      }
      onChange([...selectedIds, prodId]);
    }
  };

  return (
    <div className="space-y-3 bg-gray-50/80 border border-gray-200 rounded-md p-3.5">
      {/* Tiêu đề & Hướng dẫn */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
            {label}
          </label>
          <span className="text-[11px] font-bold text-[#e60049] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-xs">
            Đã chọn: {selectedIds.length} {maxItems ? `/${maxItems}` : ''} tài liệu
          </span>
        </div>
        {helpText && <p className="text-[11px] text-gray-500 mt-0.5">{helpText}</p>}
      </div>

      {/* PHÂN VÙNG 1: DANH SÁCH ĐÃ CHỌN KÈM ĐÁNH SỐ THỨ TỰ VÀ NÚT DI CHUYỂN */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 px-1">
          <span>Thứ tự hiển thị trên lưới (từ #1 đến #{selectedIds.length || 1}):</span>
          {selectedIds.length > 1 && (
            <span className="text-[10px] text-gray-400">
              Dùng nút [▲] [▼] hoặc gõ số để đổi vị trí
            </span>
          )}
        </div>

        {selectedIds.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xs p-3 text-center text-xs text-gray-400 bg-white">
            Chưa có tài liệu nào được chọn. Hãy tích chọn tài liệu ở danh sách bên dưới.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {selectedProducts.map((prod, idx) => {
              const posNumber = idx + 1;
              const inputVal = jumpInputs[prod.id] !== undefined ? jumpInputs[prod.id] : String(posNumber);

              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xs px-2.5 py-1.5 shadow-2xs hover:border-[#e60049]/40 transition"
                >
                  {/* Số thứ tự + Ô gõ số */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-5 text-center text-[10px] font-black text-gray-400">
                      #{posNumber}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={selectedIds.length}
                      value={inputVal}
                      onChange={(e) =>
                        setJumpInputs({ ...jumpInputs, [prod.id]: e.target.value })
                      }
                      onBlur={() => {
                        const target = parseInt(jumpInputs[prod.id], 10);
                        if (!isNaN(target)) {
                          handleJumpPosition(idx, target);
                        }
                        const nextInputs = { ...jumpInputs };
                        delete nextInputs[prod.id];
                        setJumpInputs(nextInputs);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      title="Gõ số thứ tự muốn đổi rồi nhấn Enter"
                      className="w-9 text-center border border-gray-200 rounded-xs text-[11px] font-bold py-0.5 text-[#e60049] bg-pink-50/30 focus:border-[#e60049] focus:outline-none"
                    />
                  </div>

                  {/* Tên sản phẩm */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-xs font-bold text-gray-800 truncate" title={prod.title}>
                      {prod.title}
                    </div>
                    {prod.category_slug && (
                      <span className="text-[9px] text-gray-400 uppercase font-semibold">
                        {prod.category_slug}
                      </span>
                    )}
                  </div>

                  {/* Cụm nút di chuyển: [▲ Lên] [▼ Xuống] [✕ Xóa] */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      title="Di chuyển lên trước"
                      className="w-6 h-6 rounded-xs border border-gray-200 bg-gray-50 hover:bg-[#e60049] hover:text-white hover:border-[#e60049] text-gray-600 disabled:opacity-30 disabled:hover:bg-gray-50 disabled:hover:text-gray-600 disabled:hover:border-gray-200 text-xs font-bold transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedIds.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      title="Di chuyển xuống sau"
                      className="w-6 h-6 rounded-xs border border-gray-200 bg-gray-50 hover:bg-[#e60049] hover:text-white hover:border-[#e60049] text-gray-600 disabled:opacity-30 disabled:hover:bg-gray-50 disabled:hover:text-gray-600 disabled:hover:border-gray-200 text-xs font-bold transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      title="Bỏ chọn tài liệu này"
                      className="w-6 h-6 rounded-xs border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-xs font-bold transition flex items-center justify-center cursor-pointer ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PHÂN VÙNG 2: BỘ CHỌN & TÌM KIẾM TÀI LIỆU (PICKER) */}
      <div className="pt-2 border-t border-gray-200/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-gray-700">Tích chọn tài liệu vào nhóm:</span>
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm theo tên hoặc mã sách..."
              className="w-full border border-gray-200 rounded-xs px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-[#e60049]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Danh sách cuộn checkbox */}
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xs bg-white p-1.5 space-y-1">
          {filteredAvailableProducts.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-400">
              Không tìm thấy tài liệu phù hợp với từ khóa "{searchQuery}"
            </div>
          ) : (
            filteredAvailableProducts.map((prod) => {
              const selectedIdx = selectedIds.findIndex(
                (id) => String(id).toLowerCase() === String(prod.id).toLowerCase()
              );
              const isSelected = selectedIdx >= 0;

              return (
                <label
                  key={prod.id}
                  className={`flex items-center justify-between gap-2 p-1.5 rounded-xs text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-pink-50/70 text-[#e60049] font-bold border border-pink-100'
                      : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleProduct(prod.id)}
                      className="accent-[#e60049] rounded-xs cursor-pointer shrink-0"
                    />
                    <span className="truncate">{prod.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 font-normal">
                      ({prod.category_slug || 'chung'})
                    </span>
                  </div>

                  {isSelected && (
                    <span className="bg-[#e60049] text-white text-[9px] font-black px-1.5 py-0.5 rounded-xs shrink-0 shadow-2xs">
                      #{selectedIdx + 1}
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
