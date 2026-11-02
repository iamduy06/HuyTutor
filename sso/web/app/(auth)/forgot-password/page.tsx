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
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error?.message || data.error || 'Đã có lỗi xảy ra, vui lòng thử lại.');
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
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand font-medium mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại đăng nhập
      </a>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#1a1a2e] tracking-tight">Quên mật khẩu?</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Nhập địa chỉ email đăng ký để nhận liên kết khôi phục mật khẩu.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {sent ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-green-800 mb-1">Đã gửi liên kết khôi phục!</h3>
          <p className="text-xs text-green-700">
            Vui lòng kiểm tra hộp thư đến (và thư mục Spam) của email <strong>{email}</strong> để đặt lại mật khẩu mới.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Địa chỉ Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Gửi liên kết khôi phục</span>
          </button>
        </form>
      )}
    </div>
  );
}

