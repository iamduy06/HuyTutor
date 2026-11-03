'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';
import { getDeviceId, getDeviceName } from '@/lib/clientDevice';

interface LoginClientProps {
  defaultFlashcardUrl: string;
  defaultShopUrl: string;
}

export default function LoginClient({ defaultFlashcardUrl, defaultShopUrl }: LoginClientProps) {
  const searchParams = useSearchParams();
  const app = searchParams.get('app') || '';
  const redirectUrl = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [blocked, setBlocked] = useState<{ message: string; contactUrl: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setBlocked(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          device_id: getDeviceId(),
          device_name: getDeviceName(),
          app,
          redirect_url: redirectUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error?.code === 'DEVICE_LIMIT_EXCEEDED') {
          setBlocked({
            message: data.error.message || 'Tài khoản đã đạt giới hạn thiết bị.',
            contactUrl: data.error.contactUrl || 'https://web.facebook.com/huytutor',
          });
          setLoading(false);
          return;
        }

        setErrorMsg(data.error?.message || 'Email hoặc mật khẩu không chính xác.');
        setLoading(false);
        return;
      }

      // Successful login
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
      console.error('[LOGIN_ERROR]', err);
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
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
          Đăng nhập
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {app === 'flashcard'
            ? 'Đăng nhập để vào không gian học tập Flashcard'
            : 'Sử dụng tài khoản Huy Tutor để tiếp tục'}
        </p>
      </div>

      {blocked && (
        <div className="mb-5 p-3.5 rounded-xs bg-amber-50 border border-amber-200 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 mb-1">Giới hạn thiết bị</p>
              <p className="text-xs text-amber-800 leading-relaxed mb-3">{blocked.message}</p>
              <div className="flex flex-col gap-2">
                <a
                  href="/devices"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Xem danh sách thiết bị của bạn</span>
                </a>
                <a
                  href={blocked.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Liên hệ Admin mở khóa thiết bị</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 p-3 rounded-xs bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-gray-700">
              Mật khẩu
            </label>
            <a
              href={`/forgot-password${app ? `?app=${app}` : ''}`}
              className="text-xs text-brand hover:underline font-medium"
            >
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
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
          <span>Đăng nhập</span>
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        Chưa có tài khoản?{' '}
        <a
          href={`/register${redirectUrl ? '?redirect=' + encodeURIComponent(redirectUrl) : ''}`}
          className="text-brand font-bold hover:underline"
        >
          Đăng ký ngay
        </a>
      </div>
    </div>
  );
}
