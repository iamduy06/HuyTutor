import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'user' | 'admin' | 'subadmin'>;
}> = ({ children, allowedRoles = ['user', 'admin', 'subadmin'] }) => {
  const { user, isLoading, openAuthModal } = useAuth();

  if (isLoading) {
    return (
      <main className="max-w-[760px] mx-auto px-4 py-16 text-center">
        <div className="text-xs text-gray-500">Đang xác thực phiên đăng nhập...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-[540px] mx-auto px-4 py-16">
        <div className="bg-white border border-gray-200 rounded-md p-6 text-center space-y-3 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
            Yêu cầu đăng nhập tài khoản
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Vui lòng đăng nhập tài khoản để truy cập khu vực này.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-2 rounded-sm transition"
            >
              Đăng nhập ngay
            </button>
            <Link
              to="/"
              className="border border-gray-300 text-gray-700 hover:border-[#e60049] hover:text-[#e60049] font-bold text-xs px-4 py-2 rounded-sm transition"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <main className="max-w-[540px] mx-auto px-4 py-16">
        <div className="bg-white border border-gray-200 rounded-md p-6 text-center space-y-3 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
            Không có quyền truy cập
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Tài khoản <strong>{user.email}</strong> đang có vai trò{' '}
            <strong>{user.role.toUpperCase()}</strong> và không có quyền truy cập khu vực Quản
            trị viên.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Link
              to="/my-library"
              className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-2 rounded-sm transition"
            >
              Mở Tủ sách của tôi
            </Link>
            <Link
              to="/"
              className="border border-gray-300 text-gray-700 hover:border-[#e60049] hover:text-[#e60049] font-bold text-xs px-4 py-2 rounded-sm transition"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};

