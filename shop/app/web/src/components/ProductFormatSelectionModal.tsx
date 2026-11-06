import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { formatVnd, UiFormatCode } from '../types';

export const ProductFormatSelectionModal: React.FC = () => {
  const { user, isItemInLibrary } = useAuth();
  const {
    formatModalProduct,
    formatModalInitialFormat,
    formatModalDefaultAction,
    closeFormatModal,
    addToCart,
    buyNow,
  } = useStore();

  const [selectedFormat, setSelectedFormat] = useState<UiFormatCode>('Word');
  const [quantity, setQuantity] = useState<number>(1);

  // Lọc danh sách các định dạng đang bật và có giá hợp lệ
  const availableFormats = useMemo(() => {
    if (!formatModalProduct || !Array.isArray(formatModalProduct.formats)) {
      return [];
    }
    const active = formatModalProduct.formats.filter(
      (f) => f.is_active && Number(f.price) > 0
    );
    return active.length > 0 ? active : formatModalProduct.formats;
  }, [formatModalProduct]);

  // Thiết lập định dạng ban đầu khi mở modal
  useEffect(() => {
    if (formatModalProduct) {
      if (formatModalInitialFormat) {
        setSelectedFormat(formatModalInitialFormat);
      } else if (availableFormats.length > 0) {
        setSelectedFormat(availableFormats[0].format_code);
      } else {
        setSelectedFormat('Word');
      }
      setQuantity(1);
    }
  }, [formatModalProduct, formatModalInitialFormat, availableFormats]);

  if (!formatModalProduct) return null;

  const currentFormatObj =
    availableFormats.find((f) => f.format_code === selectedFormat) ||
    availableFormats[0] || {
      format_code: selectedFormat,
      price: 0,
    };
  const unitPrice = Number(currentFormatObj.price || 0);
  const isFlashcard = selectedFormat === 'Flashcard';
  const effectiveQty = isFlashcard ? Math.max(1, quantity) : 1;
  const lineTotal = unitPrice * effectiveQty;

  const isOwned = Boolean(
    isItemInLibrary && isItemInLibrary(formatModalProduct.slug, selectedFormat)
  );

  const handleAddToCart = () => {
    addToCart(formatModalProduct, selectedFormat, effectiveQty);
    closeFormatModal();
  };

  const handleBuyNow = () => {
    buyNow(formatModalProduct, selectedFormat, effectiveQty);
    closeFormatModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-gray-200 rounded-md shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="format-modal-title"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e60049]" />
            <h3 id="format-modal-title" className="text-xs font-black uppercase tracking-wider text-gray-900">
              Chọn Phân Loại Tài Liệu
            </h3>
          </div>
          <button
            type="button"
            onClick={closeFormatModal}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition cursor-pointer text-sm font-bold"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Nội dung chi tiết */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Thông tin tóm tắt sản phẩm */}
          <div className="flex items-start gap-3.5 pb-3 border-b border-gray-100">
            {formatModalProduct.thumbnail_url ? (
              <img
                src={formatModalProduct.thumbnail_url}
                alt={formatModalProduct.title}
                className="w-16 h-20 object-contain rounded border border-gray-200 bg-gray-50 shrink-0"
              />
            ) : (
              <div className="w-16 h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-bold shrink-0">
                Tài liệu
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <span className="inline-block text-[10px] font-bold uppercase text-[#e60049] bg-pink-50 px-2 py-0.5 rounded-xs">
                {formatModalProduct.category_name || 'Huy Tutor'}
              </span>
              <h4 className="font-extrabold text-sm text-gray-900 line-clamp-2 leading-snug">
                {formatModalProduct.title}
              </h4>
              <div className="pt-0.5">
                <span className="text-base font-extrabold text-[#e60049]">
                  {formatVnd(unitPrice)}
                </span>
                {isFlashcard && effectiveQty > 1 && (
                  <span className="text-gray-500 text-[11px] ml-2">
                    (Tổng: <strong>{formatVnd(lineTotal)}</strong>)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Danh sách phân loại (Định dạng) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-800">
              Định dạng tài liệu *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableFormats.map((fmt) => {
                const isSelected = fmt.format_code === selectedFormat;
                const fmtOwned = Boolean(
                  isItemInLibrary && isItemInLibrary(formatModalProduct.slug, fmt.format_code)
                );
                return (
                  <button
                    key={fmt.format_code}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.format_code)}
                    className={`relative p-2.5 rounded-sm border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#e60049] bg-pink-50/60 ring-1 ring-[#e60049]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`font-bold text-xs ${isSelected ? 'text-[#e60049]' : 'text-gray-900'}`}>
                        {fmt.format_code}
                      </span>
                      {isSelected && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#e60049] text-white flex items-center justify-center text-[9px] font-black shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-extrabold text-gray-700">
                      {formatVnd(fmt.price)}
                    </span>
                    {fmtOwned && (
                      <span className="text-[9px] text-amber-700 font-bold mt-1 bg-amber-100/70 px-1.5 py-0.5 rounded-xs w-fit">
                        Đã có trong Tủ sách
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Số lượng */}
          <div className="pt-2">
            {isFlashcard ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">
                  Số lượng tài khoản Flashcard
                </label>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center border border-gray-300 rounded-sm">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 hover:bg-gray-100 font-bold text-sm text-gray-600 transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-14 text-center text-xs font-bold py-1 focus:outline-none border-x border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(500, q + 1))}
                      className="px-3 py-1 hover:bg-gray-100 font-bold text-sm text-gray-600 transition"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Thành tiền: <strong className="text-[#e60049]">{formatVnd(lineTotal)}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-[11px] text-gray-600 leading-relaxed">
                ℹ️ Định dạng <strong>{selectedFormat}</strong> là tài liệu số có bản quyền, hệ thống tự động đặt số lượng <strong>1</strong> cho mỗi đơn hàng.
              </div>
            )}
          </div>

          {/* Cảnh báo nếu đã sở hữu trong Tủ sách */}
          {isOwned && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-900 font-medium">
              ⚠️ Tài khoản <strong>{user?.fullName || user?.email}</strong> đã sở hữu định dạng <strong>{selectedFormat}</strong> trong Tủ sách cá nhân. Bạn vẫn có thể mua thêm nếu có nhu cầu cấp quyền mới.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-2.5 px-3 rounded-xs text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              formatModalDefaultAction === 'add_to_cart'
                ? 'bg-[#fff0f3] hover:bg-pink-100 text-[#e60049] border-2 border-[#e60049]'
                : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            <span>🛒 Thêm vào giỏ</span>
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className={`w-full py-2.5 px-3 rounded-xs text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-white shadow-xs ${
              formatModalDefaultAction === 'buy_now'
                ? 'bg-[#e60049] hover:bg-[#cc0041] ring-2 ring-pink-300'
                : 'bg-[#e60049] hover:bg-[#cc0041]'
            }`}
          >
            <span>⚡ Mua ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
