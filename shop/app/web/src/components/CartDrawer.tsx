import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { formatVnd, UiFormatCode } from '../types';

export const CartDrawer: React.FC = () => {
  const { isItemInLibrary } = useAuth();
  const {
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    cartItems,
    selectedCartItems,
    selectedFormats,
    hasFormatConflict,
    hasMultipleProductsConflict,
    subtotalAmount,
    discountPercent,
    discountAmount,
    totalAmount,
    toggleCartItemSelect,
    selectOnlyFormat,
    products,
    updateCartItemQty,
    updateCartItemFormat,
    removeCartItem,
  } = useStore();

  if (!isCartOpen) return null;

  const distinctFormatsInCart = Array.from(
    new Set(cartItems.map((item) => item.formatCode))
  ) as UiFormatCode[];

  const hasOwnedItemSelected = selectedCartItems.some((item) => {
    if (item.isUpgrade) return false;
    if (!isItemInLibrary) return false;
    if (item.formatCode === 'PDF' && isItemInLibrary(item.slug, 'Word')) return true;
    return isItemInLibrary(item.slug, item.formatCode);
  });

  const isCheckoutDisabled =
    selectedCartItems.length === 0 || hasFormatConflict || hasMultipleProductsConflict || hasOwnedItemSelected;

  const handleProceedCheckout = () => {
    if (isCheckoutDisabled) return;
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
              Giỏ hàng ({cartItems.length})
            </h2>
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
            cartItems.map((item) => {
              const alreadyOwned = isItemInLibrary && isItemInLibrary(item.slug, item.formatCode);
              return (
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-block bg-[#e60049] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                          Định dạng: {item.formatCode}
                        </span>
                        {item.isUpgrade && (
                          <span className="inline-block bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                            NÂNG CẤP TỪ PDF ➔ WORD
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-gray-900 mt-1.5 leading-snug">
                        {item.title}
                      </h3>

                      {/* Ưu đãi nâng cấp bù tiền */}
                      {item.isUpgrade ? (
                        <div className="mt-2 p-2 bg-pink-50 border border-pink-200 rounded text-[11px] text-gray-800 leading-snug space-y-0.5">
                          <div className="font-bold text-[#e60049] flex items-center gap-1">
                            <span>💡</span>
                            <span>Ưu đãi bù tiền nâng cấp</span>
                          </div>
                          <div className="text-[10px] text-gray-600">
                            Giá Word: {formatVnd(item.originalPrice || item.unitPrice + (item.upgradeOffset || 0))} - Khấu trừ bản PDF: -{formatVnd(item.upgradeOffset || 0)}
                          </div>
                        </div>
                      ) : item.formatCode === 'PDF' && isItemInLibrary && isItemInLibrary(item.slug, 'Word') ? (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-800 font-semibold flex items-start gap-1.5 leading-snug">
                          <span className="shrink-0">⚠️</span>
                          <span>
                            Bạn đã sở hữu định dạng Word, không cần mua thêm bản PDF vì nội dung chúng là giống nhau.
                          </span>
                        </div>
                      ) : alreadyOwned ? (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-800 font-semibold flex items-start gap-1.5 leading-snug">
                          <span className="shrink-0">⚠️</span>
                          <span>
                            Bạn đã sở hữu tài liệu này ({item.formatCode}) trong Tủ sách cá nhân! Hãy kiểm tra Tủ sách trước khi thanh toán lại.
                          </span>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                        <span className="text-xs font-extrabold text-[#e60049]">
                          {formatVnd(item.unitPrice * item.quantity)}
                        </span>

                        {(() => {
                          const productObj = products.find(
                            (p) => p.id === item.productId || p.slug === item.slug
                          );
                          const availableFormats = (productObj?.formats || []).filter(
                            (f) => f.is_active
                          );

                          return (
                            <div className="flex items-center gap-2">
                              {/* Bộ chọn đổi định dạng (đồng thời đổi giá luôn) */}
                              {availableFormats.length > 1 ? (
                                <div className="flex items-center gap-1">
                                  <label className="text-[11px] text-gray-500 font-medium">
                                    Định dạng:
                                  </label>
                                  <select
                                    value={item.formatCode}
                                    onChange={(e) =>
                                      updateCartItemFormat(
                                        item.cartItemId,
                                        e.target.value as UiFormatCode
                                      )
                                    }
                                    className="text-xs font-bold text-gray-800 bg-white border border-gray-300 hover:border-[#e60049] rounded-xs px-2 py-1 cursor-pointer focus:outline-none focus:border-[#e60049] transition shadow-2xs"
                                  >
                                    {availableFormats.map((fmt) => (
                                      <option key={fmt.format_code} value={fmt.format_code}>
                                        {fmt.format_code} ({formatVnd(fmt.price)})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-xs">
                                  {item.formatCode}
                                </span>
                              )}

                              {item.formatCode === 'Flashcard' && (
                                <div className="flex items-center gap-1 border border-gray-300 rounded-xs bg-white px-1">
                                  <button
                                    type="button"
                                    onClick={() => updateCartItemQty(item.cartItemId, -1)}
                                    className="w-5 h-5 text-xs font-bold text-gray-700 hover:text-[#e60049] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-bold w-5 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCartItemQty(item.cartItemId, 1)}
                                    className="w-5 h-5 text-xs font-bold text-gray-700 hover:text-[#e60049] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => removeCartItem(item.cartItemId)}
                                className="text-[11px] text-gray-500 hover:text-[#e60049] font-semibold cursor-pointer ml-1"
                              >
                                Xóa
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cảnh báo Quy tắc Single-Format nếu tích chọn lẫn lộn nhiều định dạng */}
        {hasFormatConflict && (
          <div className="mx-5 mb-2 p-3 bg-[#fff0f3] border border-[#e60049] rounded-md text-[11px] text-[#e60049] leading-relaxed">
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

        {/* Cảnh báo tài liệu đã sở hữu trong Tủ sách (Chặn thanh toán) */}
        {hasOwnedItemSelected && (
          <div className="mx-5 mb-2 p-3 bg-amber-50 border border-amber-400 rounded-md text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <span className="text-base shrink-0 leading-none">⛔</span>
            <div>
              <p className="font-extrabold uppercase mb-0.5">
                Không thể thanh toán tài liệu đã sở hữu:
              </p>
              <p>
                Đơn hàng có tài liệu bạn đã sở hữu trong Tủ sách cá nhân. Vui lòng bỏ tích chọn tài liệu đó để có thể tiếp tục thanh toán.
              </p>
            </div>
          </div>
        )}

        {/* Cảnh báo Giới hạn 1 sản phẩm cho non-Flashcard */}
        {hasMultipleProductsConflict && (
          <div className="mx-5 mb-2 p-3 bg-red-50 border border-red-400 rounded-md text-[11px] text-red-700 leading-relaxed">
            <p className="font-extrabold uppercase mb-1">
              ⚠️ Giới hạn đơn hàng (Trừ Flashcard):
            </p>
            <p>
              Trừ định dạng Flashcard, mỗi đơn hàng chỉ được phép đặt <strong>tối đa 1 sản phẩm</strong> với số lượng 1. Vui lòng chỉ chọn 1 tài liệu để tiếp tục thanh toán.
            </p>
          </div>
        )}

        {/* Tổng kết & Nút Tiến hành thanh toán */}
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
            disabled={isCheckoutDisabled}
            onClick={handleProceedCheckout}
            className={`w-full py-2.5 rounded-sm font-bold text-xs text-white transition ${
              isCheckoutDisabled
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
