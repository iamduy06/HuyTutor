import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { openAuthModal } = useAuth();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg('Không tìm thấy mã khôi phục mật khẩu hợp lệ trên đường dẫn.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.resetPassword({ token, newPassword });
      setDoneMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi đặt lại mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-[460px] mx-auto px-4 py-14">
      <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h1 className="text-sm font-extrabold text-[#e60049] uppercase">
            Đặt lại mật khẩu tài khoản
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Thiết lập mật khẩu mới cho tài khoản Huy Tutor của bạn.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-[#e60049] text-[#e60049] text-xs font-bold rounded-sm">
            {errorMsg}
          </div>
        )}

        {doneMsg ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-600 text-emerald-800 text-xs font-semibold rounded-sm">
              {doneMsg}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-2 rounded-sm transition"
              >
                Đăng nhập ngay
              </button>
              <Link
                to="/"
                className="border border-gray-300 text-gray-700 font-bold text-xs px-4 py-2 rounded-sm"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Mật khẩu mới (tối thiểu 6 ký tự) *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Xác nhận mật khẩu mới *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2.5 rounded-sm transition"
            >
              {submitting ? 'Đang lưu mật khẩu...' : 'Xác nhận đặt lại mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
