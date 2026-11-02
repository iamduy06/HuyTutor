import React, { useEffect } from 'react';

function getSsoUrl(): string {
  const envUrl = import.meta.env.SSO_URL;
  if (envUrl) {
    return (envUrl as string).replace(/\/+$/, '');
  }
  return '';
}

export const ResetPasswordPage: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ssoBase = getSsoUrl();
      const targetUrl = `${ssoBase}/reset-password${window.location.search || ''}`;
      window.location.href = targetUrl;
    }
  }, []);

  return (
    <main className="max-w-[460px] mx-auto px-4 py-16 text-center">
      <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm space-y-3">
        <h1 className="text-sm font-extrabold text-[#e60049] uppercase">
          Đang chuyển hướng đến Huy Tutor SSO...
        </h1>
        <p className="text-xs text-gray-600">
          Đặt lại mật khẩu được quản lý tập trung tại cổng xác thực SSO.
        </p>
      </div>
    </main>
  );
};
