import React, { useEffect, useState } from 'react';

const COOKIE_CONSENT_KEY = 'ht_cookie_consent_v1';

export interface CookieConsentState {
  essential: true;
  analytics: boolean;
  timestamp: string;
}

export const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    try {
      // 1. Kiểm tra tín hiệu Do-Not-Track hoặc Global Privacy Control (Điều 29 Nghị định 13/2023/NĐ-CP)
      const isDoNotTrack =
        (typeof navigator !== 'undefined' &&
          (navigator.doNotTrack === '1' ||
            (navigator as any).msDoNotTrack === '1' ||
            (window as any).doNotTrack === '1')) ||
        Boolean((navigator as any)?.globalPrivacyControl);

      const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

      if (savedConsent) {
        setShowBanner(false);
        return;
      }

      // Nếu người dùng bật DNT từ trình duyệt: Tự động chọn chỉ cookie thiết yếu, không làm phiền
      if (isDoNotTrack) {
        const dntConsent: CookieConsentState = {
          essential: true,
          analytics: false,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(dntConsent));
        setShowBanner(false);
        return;
      }

      // Chưa có cấu hình: Hiển thị banner
      setShowBanner(true);
    } catch {
      setShowBanner(false);
    }
  }, []);

  const handleAcceptEssentialOnly = () => {
    try {
      const consent: CookieConsentState = {
        essential: true,
        analytics: false,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
      setShowBanner(false);
    } catch {
      setShowBanner(false);
    }
  };

  const handleAcceptAll = () => {
    try {
      const consent: CookieConsentState = {
        essential: true,
        analytics: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
      setShowBanner(false);
    } catch {
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div
      role="region"
      aria-label="Thông báo Cookie và Bảo vệ Dữ liệu"
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-gray-300 shadow-xl"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-700">
        <div className="flex-1 text-left leading-relaxed">
          <span>
            Huy Tutor sử dụng cookie thiết yếu để duy trì phiên đăng nhập và giỏ hàng của bạn. Các tính năng phân tích chỉ được kích hoạt khi bạn cho phép theo Nghị định 13/2023/NĐ-CP.{' '}
            <a
              href="#"
              className="text-gray-900 font-bold underline hover:text-[#e60049] transition"
            >
              Chính sách bảo mật
            </a>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleAcceptEssentialOnly}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xs border border-gray-300 transition text-[11px] sm:text-xs cursor-pointer"
          >
            Chỉ cookie thiết yếu
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 sm:flex-none px-3.5 py-1.5 bg-[#e60049] hover:bg-[#cc0041] text-white font-bold rounded-xs transition text-[11px] sm:text-xs shadow-xs cursor-pointer"
          >
            Đồng ý tất cả
          </button>
        </div>
      </div>
    </div>
  );
};
