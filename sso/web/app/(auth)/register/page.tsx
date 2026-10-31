'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

function RegisterContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';
  const app = searchParams.get('app') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error?.message || 'Đăng ký không thành công.');
        setLoading(false);
        return;
      }

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (app === 'flashcard') {
        const flashcardUrl = process.env.NEXT_PUBLIC_FLASHCARD_URL ? process.env.NEXT_PUBLIC_FLASHCARD_URL : 'https://flashcard.huytutor.edu.vn';
        window.location.href = `${flashcardUrl.replace(/\/+$/, '')}/dashboard`;
      } else {
        const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL ? process.env.NEXT_PUBLIC_SHOP_URL : 'https://huytutor.edu.vn';
        window.location.href = shopUrl;
      }
    } catch (err: any) {
      console.error('[REGISTER_ERROR]', err);
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#1a1a2e] tracking-tight">Đăng ký tài khoản</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Một tài khoản duy nhất truy cập cả Huy Tutor Shop và Học Flashcard.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Họ và tên</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Số điện thoại (tùy chọn)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm"
          />
        </div>

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

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu (ít nhất 6 ký tự)</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Tạo tài khoản</span>
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-muted-foreground">
        Đã có tài khoản?{' '}
        <a href={`/login${redirectUrl ? '?redirect=' + encodeURIComponent(redirectUrl) : ''}`} className="text-brand font-bold hover:underline">
          Đăng nhập ngay
        </a>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}

