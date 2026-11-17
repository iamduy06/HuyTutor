import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { CartItem, formatVnd } from '../types';

function getSsoUrl(): string {
  const envUrl = import.meta.env.SSO_URL;
  if (envUrl) {
    return (envUrl as string).replace(/\/+$/, '');
  }
  return '';
}

export interface CheckoutAuthPromptModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  items?: CartItem[];
}

export const CheckoutAuthPromptModal: React.FC<CheckoutAuthPromptModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  items: propItems,
}) => {
  const store = useStore();

  const isOpen = propIsOpen !== undefined ? propIsOpen : store.isAuthPromptOpen;
  const onClose = propOnClose || store.closeAuthPrompt;
  const rawItems = propItems !== undefined ? propItems : store.pendingCheckoutItems;
  const items = Array.isArray(rawItems) ? rawItems : [];

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
    0
  );

  const handleLoginRedirect = () => {
    if (typeof window === 'undefined') return;
    const ssoBase = getSsoUrl();
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${ssoBase}/login?app=shop&redirect=${returnUrl}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-sm border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-auth-prompt-title"
      >
        {/* Header */}
        <div className="bg-[#e60049] text-white px-5 py-3.5 flex items-center justify-between">
          <h2
            id="checkout-auth-prompt-title"
            className="text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-snug"
          >
            [YÊU CẦU ĐĂNG NHẬP] - VUI LÒNG ĐĂNG NHẬP TÀI KHOẢN ĐỂ TIẾP TỤC THANH TOÁN
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 text-white/80 hover:text-white text-base font-bold leading-none cursor-pointer p-1 rounded-sm hover:bg-white/10 transition"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Thông báo từ hệ thống:
            </div>
            <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-medium">
              Bạn phải đăng nhập tài khoản để tiếp tục thanh toán và lưu trữ tài liệu vĩnh viễn vào Tủ sách cá nhân của bạn.
            </p>
          </div>

          {/* Pending items summary box */}
          {items.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-sm p-3.5 space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1.5">
                Đơn hàng đang chờ của bạn:
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={item.cartItemId || idx}
                    className="space-y-1 pb-2 border-b border-gray-100 last:border-b-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-500 font-medium shrink-0">• Tài liệu:</span>
                      <span className="font-bold text-gray-900 text-right leading-tight">{item.title}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500 font-medium">• Định dạng:</span>
                      <span className="font-semibold text-gray-800">
                        {item.formatCode === 'Word'
                          ? 'Tài liệu Word'
                          : item.formatCode === 'PDF'
                          ? 'Tài liệu PDF'
                          : item.formatCode === 'Flashcard'
                          ? 'Tài khoản Flashcard'
                          : item.formatCode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500 font-medium">• Số lượng:</span>
                      <span className="font-semibold text-gray-800">{item.quantity} bản</span>
                    </div>
                    {items.length > 1 && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-500 font-medium">• Thành tiền:</span>
                        <span className="font-bold text-[#e60049]">
                          {formatVnd((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold text-xs sm:text-sm">
                <span className="text-gray-700">• Tổng tiền:</span>
                <span className="text-[#e60049] font-extrabold text-sm sm:text-base">
                  {formatVnd(totalAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold text-xs rounded-sm hover:bg-gray-100 transition cursor-pointer text-center"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={handleLoginRedirect}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs rounded-sm shadow-xs transition cursor-pointer text-center uppercase tracking-wide"
            >
              ĐĂNG NHẬP QUA SSO ĐỂ TIẾP TỤC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
