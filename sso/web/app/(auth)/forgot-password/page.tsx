'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorText = data.error?.message || (typeof data.error === 'string' ? data.error : 'Đã có lỗi xảy ra, vui lòng thử lại.');
        setErrorMsg(errorText);
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setErrorMsg('Đã có lỗi xảy ra, vui lòng thử lại.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8">
      <a
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand font-medium mb-4 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập
      </a>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-xs border border-gray-200">
            Khôi phục
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Quên mật khẩu?
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Nhập địa chỉ email đăng ký để nhận liên kết khôi phục mật khẩu.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xs text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {sent ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xs text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
          <h3 className="text-sm font-bold text-green-800">Đã gửi liên kết khôi phục!</h3>
          <p className="text-xs text-green-700 leading-relaxed">
            Vui lòng kiểm tra hộp thư đến (và thư mục Spam) của email <strong>{email}</strong> để đặt lại mật khẩu mới.
          </p>
          <div className="pt-2">
            <a
              href="/login"
              className="inline-block px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xs transition"
            >
              Về trang Đăng nhập
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xs font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Gửi liên kết khôi phục</span>
          </button>
        </form>
      )}
    </div>
  );
}
