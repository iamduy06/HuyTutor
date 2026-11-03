'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface RegisterClientProps {
  defaultFlashcardUrl: string;
  defaultShopUrl: string;
}

export default function RegisterClient({ defaultFlashcardUrl, defaultShopUrl }: RegisterClientProps) {
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
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error?.message || 'Đăng ký không thành công.');
        setLoading(false);
        return;
      }

      if (redirectUrl) {
        try {
          const urlObj = new URL(redirectUrl, window.location.origin);
          if (data.token) {
            urlObj.searchParams.set('sso_token', data.token);
          }
          window.location.href = urlObj.toString();
        } catch {
          window.location.href = redirectUrl;
        }
      } else if (app === 'flashcard' && defaultFlashcardUrl) {
        window.location.href = `${defaultFlashcardUrl.replace(/\/+$/, '')}/dashboard`;
      } else if (defaultShopUrl) {
        window.location.href = defaultShopUrl;
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('[REGISTER_ERROR]', err);
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-xs border border-gray-200">
            Huy Tutor ID
          </span>
          {app && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-soft text-brand px-1.5 py-0.5 rounded-xs border border-pink-200">
              {app === 'flashcard' ? 'Flashcard' : 'Shop'}
            </span>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Đăng ký tài khoản
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Tài khoản dùng chung truy cập đồng bộ cả Tài liệu Shop và Flashcard học tập.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xs bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Họ và tên
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Email
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

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Số điện thoại (tùy chọn)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912 345 678"
            className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Mật khẩu (tối thiểu 6 ký tự)
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xs font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Tạo tài khoản</span>
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        Đã có tài khoản?{' '}
        <a
          href={`/login${redirectUrl ? '?redirect=' + encodeURIComponent(redirectUrl) : ''}`}
          className="text-brand font-bold hover:underline"
        >
          Đăng nhập ngay
        </a>
      </div>
    </div>
  );
}
