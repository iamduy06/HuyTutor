'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

function ChangePasswordContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent('/change-password')}`;
          return;
        }
        const errorText = data.error?.message || (typeof data.error === 'string' ? data.error : 'Đã có lỗi xảy ra, vui lòng thử lại.');
        setErrorMsg(errorText);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setErrorMsg('Đã có lỗi xảy ra, vui lòng thử lại.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-xs border border-gray-200">
            Bảo mật
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-brand" /> Đổi mật khẩu
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Cập nhật mật khẩu tài khoản hệ thống Huy Tutor.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xs text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {success ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xs text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
          <h3 className="text-sm font-bold text-green-800">Đổi mật khẩu thành công!</h3>
          <p className="text-xs text-green-700 leading-relaxed mb-3">
            Mật khẩu mới đã được cập nhật đồng bộ trên toàn bộ hệ thống Huy Tutor.
          </p>
          <a
            href={redirectUrl || '/'}
            className="inline-block px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xs transition shadow-xs uppercase tracking-wide"
          >
            Quay lại
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mật khẩu mới (tối thiểu 6 ký tự)
            </label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xs font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Cập nhật mật khẩu</span>
          </button>
        </form>
      )}
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-8 text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto mb-3" />
          <h2 className="text-sm font-bold text-gray-900 mb-1">Đang tải...</h2>
        </div>
      }
    >
      <ChangePasswordContent />
    </Suspense>
  );
}
