import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatVnd, UiFormatCode } from '../types';
import { ensurePackageFormatPricings, getProductRetailPrice } from '../utils/comboPricingEngine';

export const ComboFormatSelectionModal: React.FC = () => {
  const {
    comboModalPackage,
    comboModalAction,
    comboModalInitialFormat,
    closeComboFormatModal,
    addComboToCart,
    products,
  } = useStore();

  const [selectedFormat, setSelectedFormat] = useState<UiFormatCode>('Word');

  // Lọc danh sách các định dạng đang bật và có giá combo hợp lệ
  const availableFormats = useMemo(() => {
    if (!comboModalPackage) return [];
    return ensurePackageFormatPricings(comboModalPackage).filter(
      (fp) => fp.is_enabled && typeof fp.combo_price === 'number' && fp.combo_price > 0
    );
  }, [comboModalPackage]);

  // Thiết lập định dạng ban đầu khi mở modal
  useEffect(() => {
    if (comboModalPackage) {
      if (
        comboModalInitialFormat &&
        availableFormats.some((f) => f.format_code === comboModalInitialFormat)
      ) {
        setSelectedFormat(comboModalInitialFormat);
      } else if (availableFormats.length > 0) {
        setSelectedFormat(availableFormats[0].format_code);
      } else {
        setSelectedFormat('Word');
      }
    }
  }, [comboModalPackage, comboModalInitialFormat, availableFormats]);

  if (!comboModalPackage) return null;

  const pkgProducts = (comboModalPackage.product_ids || [])
    .map((id) => products.find((p) => p.id === id || p.slug === id))
    .filter(Boolean);

  const currentFormatObj =
    availableFormats.find((f) => f.format_code === selectedFormat) ||
    availableFormats[0] || {
      format_code: selectedFormat,
      combo_price: 0,
    };

  const comboPrice = Number(currentFormatObj.combo_price || 0);

  // Tính tổng giá gốc của các cuốn trong combo theo định dạng đang chọn
  const totalOriginalPrice = pkgProducts.reduce(
    (sum, p) => (p ? sum + getProductRetailPrice(p, selectedFormat) : sum),
    0
  );

  const discountPercent =
    totalOriginalPrice > 0 && comboPrice > 0 && totalOriginalPrice > comboPrice
      ? Math.round(((totalOriginalPrice - comboPrice) / totalOriginalPrice) * 100)
      : 0;

  const handleConfirm = () => {
    const actionType = comboModalAction === 'buy_now' ? 'open_checkout' : 'add_to_cart';
    addComboToCart(comboModalPackage, selectedFormat, actionType);
    closeComboFormatModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-gray-200 rounded-md shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="combo-format-modal-title"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e60049]" />
            <h3
              id="combo-format-modal-title"
              className="text-xs font-black uppercase tracking-wider text-gray-900"
            >
              Chọn Định Dạng Gói Combo
            </h3>
          </div>
          <button
            type="button"
            onClick={closeComboFormatModal}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-xs transition cursor-pointer"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nội dung Modal */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Ảnh Thumbnail gói Combo (hiển thị trọn vẹn hình ảnh, không viền khung trắng) */}
          {comboModalPackage.thumbnail_url?.trim() ? (
            <div className="overflow-hidden rounded-md flex items-center justify-center">
              <img
                src={comboModalPackage.thumbnail_url.trim()}
                alt={comboModalPackage.title}
                className="w-full h-auto max-h-44 object-contain rounded-md"
              />
            </div>
          ) : null}

          {/* Tiêu đề & Thông tin gói */}
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-gray-900 leading-snug">
              {comboModalPackage.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-pink-50 text-[#e60049] border border-pink-200 font-bold px-1.5 py-0.5 rounded-xs text-[10px]">
                Gói Combo THPT
              </span>
              <span>Gồm {pkgProducts.length} tài liệu thành phần</span>
            </div>
          </div>

          {/* Danh sách Định dạng khả dụng */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              Chọn định dạng bạn muốn sở hữu:
            </label>
            <div className="space-y-2">
              {availableFormats.map((fmt) => {
                const isSelected = selectedFormat === fmt.format_code;
                const fmtComboPrice = Number(fmt.combo_price || 0);
                const fmtOrigPrice = pkgProducts.reduce(
                  (sum, p) => (p ? sum + getProductRetailPrice(p, fmt.format_code) : sum),
                  0
                );
                const fmtDiscount =
                  fmtOrigPrice > fmtComboPrice && fmtComboPrice > 0
                    ? Math.round(((fmtOrigPrice - fmtComboPrice) / fmtOrigPrice) * 100)
                    : 0;

                return (
                  <button
                    key={fmt.format_code}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.format_code)}
                    className={`w-full text-left p-3 rounded-xs border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#e60049] bg-pink-50/50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#e60049] bg-[#e60049]' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <span>Định dạng {fmt.format_code}</span>
                          {fmtDiscount > 0 && (
                            <span className="bg-[#b30038] text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs">
                              TIẾT KIỆM {fmtDiscount}%
                            </span>
                          )}
                        </div>
                        {fmtOrigPrice > fmtComboPrice && (
                          <div className="text-[10px] text-gray-400 line-through">
                            Giá gốc: {formatVnd(fmtOrigPrice)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-[#e60049]">
                        {formatVnd(fmtComboPrice)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ghi chú về cơ chế khấu trừ thông minh */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xs p-2.5 text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold">Lưu ý:</span> Nếu bạn đã sở hữu một số tài liệu trong gói combo này ở Tủ sách cá nhân, hệ thống sẽ tự động khấu trừ đúng số tiền tài liệu đó khi tiến hành thanh toán.
          </div>
        </div>

        {/* Footer Modal CTA */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-extrabold text-xs py-3 px-4 rounded-xs transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            {comboModalAction === 'buy_now' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Tiến hành thanh toán ngay ({formatVnd(comboPrice)})</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Thêm gói combo vào giỏ ({formatVnd(comboPrice)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
