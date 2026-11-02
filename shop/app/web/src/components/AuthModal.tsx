import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function getSsoUrl(): string {
  const envUrl = import.meta.env.SSO_URL;
  if (envUrl) {
    return (envUrl as string).replace(/\/+$/, '');
  }
  return '';
}

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal } = useAuth();

  useEffect(() => {
    if (isAuthModalOpen && typeof window !== 'undefined') {
      const ssoBase = getSsoUrl();
      const path = authModalTab === 'register' ? '/register' : authModalTab === 'forgot' ? '/forgot-password' : '/login';
      const redirectUrl = encodeURIComponent(window.location.href);
      window.location.href = `${ssoBase}${path}?app=shop&redirect=${redirectUrl}`;
    }
  }, [isAuthModalOpen, authModalTab]);

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-3">
        <div className="text-sm font-bold text-gray-900">Đang chuyển hướng đến Huy Tutor SSO...</div>
        <p className="text-xs text-gray-500">Đăng nhập tài khoản dùng chung trên toàn hệ thống.</p>
        <button
          type="button"
          onClick={closeAuthModal}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Hủy
        </button>
      </div>
    </div>
  );
};
