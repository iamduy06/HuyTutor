import React from 'react';
import { useStore } from '../context/StoreContext';
import { FORMAT_TO_GOOGLE_FORM_MAP, formatVnd, UiFormatCode } from '../types';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    cartItems,
    selectedCartItems,
    selectedFormats,
    hasFormatConflict,
    subtotalAmount,
    discountPercent,
    discountAmount,
    totalAmount,
    toggleCartItemSelect,
    selectOnlyFormat,
    updateCartItemQty,
    removeCartItem,
  } = useStore();

  if (!isCartOpen) return null;

  const distinctFormatsInCart = Array.from(
    new Set(cartItems.map((item) => item.formatCode))
  ) as UiFormatCode[];

  const handleProceedCheckout = () => {
    if (selectedCartItems.length === 0 || hasFormatConflict) return;
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-gray-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#fff5f7]">
          <div>
            <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
              Giỏ hàng thông minh ({cartItems.length})
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Lưu nhiều định dạng, thanh toán theo từng định dạng đồng nhất
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-[#e60049] border border-gray-300 rounded-sm bg-white"
          >
            Đóng
          </button>
        </div>

        {/* Bộ lọc nhanh theo định dạng nếu giỏ hàng có từ 2 định dạng trở lên */}
        {distinctFormatsInCart.length > 1 && (
          <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-600 mr-1">
              Chọn nhanh 1 định dạng:
            </span>
            {distinctFormatsInCart.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => selectOnlyFormat(fmt)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border transition ${
                  selectedFormats.length === 1 && selectedFormats[0] === fmt
                    ? 'bg-[#e60049] text-white border-[#e60049]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#e60049]'
                }`}
              >
                Chỉ chọn {fmt}
              </button>
            ))}
          </div>
        )}

        {/* Danh sách sản phẩm trong giỏ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">
              Giỏ hàng của bạn đang trống. Hãy chọn tài liệu và định dạng cần mua.
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.cartItemId}
                className={`p-3.5 rounded-md border transition ${
                  item.selected
                    ? 'border-[#e60049] bg-[#fff5f7]/40'
                    : 'border-gray-200 bg-white opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleCartItemSelect(item.cartItemId)}
                    className="mt-1 accent-[#e60049] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-block bg-[#e60049] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                        Định dạng: {item.formatCode}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        Ghi chú Form: {FORMAT_TO_GOOGLE_FORM_MAP[item.formatCode]}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 mt-1.5 leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                      <span className="text-xs font-extrabold text-[#e60049]">
                        {formatVnd(item.unitPrice * item.quantity)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCartItemQty(item.cartItemId, -1)}
                          className="w-6 h-6 border border-gray-300 rounded-sm text-xs font-bold text-gray-700 hover:border-[#e60049]"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartItemQty(item.cartItemId, 1)}
                          className="w-6 h-6 border border-gray-300 rounded-sm text-xs font-bold text-gray-700 hover:border-[#e60049]"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.cartItemId)}
                          className="ml-2 text-[11px] text-gray-500 hover:text-[#e60049] font-semibold"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cảnh báo Quy tắc Single-Format nếu tích chọn lẫn lộn nhiều định dạng */}
        {hasFormatConflict && (
          <div className="mx-5 mb-3 p-3 bg-[#fff0f3] border border-[#e60049] rounded-md text-[11px] text-[#e60049] leading-relaxed">
            <p className="font-extrabold uppercase mb-1">
              Quy tắc thanh toán đồng nhất 1 định dạng:
            </p>
            <p>
              Bạn đang tích chọn nhiều định dạng khác nhau ({selectedFormats.join(', ')}). Mỗi đơn
              hàng chỉ được phép thanh toán cho <strong>1 định dạng duy nhất</strong>. Vui lòng bấm
              nút lọc định dạng ở phía trên hoặc bỏ tích các định dạng khác.
            </p>
          </div>
        )}

        {/* Tổng kết & Nút Tiến hành thanh toán (Thuần chữ, không icon) */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Tạm tính ({selectedCartItems.length} mục đã chọn):</span>
            <span className="font-bold text-gray-800">{formatVnd(subtotalAmount)}</span>
          </div>

          {discountPercent > 0 && (
            <div className="flex justify-between text-xs text-[#e60049] font-bold">
              <span>Ưu đãi Combo tự động (-{discountPercent}%):</span>
              <span>-{formatVnd(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1 border-t border-gray-200">
            <span>Tổng thanh toán:</span>
            <span className="text-[#e60049]">{formatVnd(totalAmount)}</span>
          </div>

          <button
            type="button"
            disabled={selectedCartItems.length === 0 || hasFormatConflict}
            onClick={handleProceedCheckout}
            className={`w-full py-2.5 rounded-sm font-bold text-xs text-white transition ${
              selectedCartItems.length === 0 || hasFormatConflict
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[#e60049] hover:bg-[#cc0041]'
            }`}
          >
            Tiến hành thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};
