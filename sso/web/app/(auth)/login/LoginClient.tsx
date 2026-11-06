'use client';

import { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';
import { getDeviceId, getDeviceName } from '@/lib/clientDevice';
import { Turnstile, type TurnstileRef } from '@/components/Turnstile';

interface LoginClientProps {
  defaultFlashcardUrl: string;
  defaultShopUrl: string;
}

export default function LoginClient({ defaultFlashcardUrl, defaultShopUrl }: LoginClientProps) {
  const searchParams = useSearchParams();
  const app = searchParams.get('app') || '';
  const redirectUrl = searchParams.get('redirect') || '';
  const initialEmail = searchParams.get('email') || '';
  const isVerified = searchParams.get('verified') === 'true';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unactivatedEmail, setUnactivatedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<{ message: string; contactUrl: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileRef>(null);

  async function handleResendActivation() {
    const targetEmail = unactivatedEmail || email.trim().toLowerCase();
    if (!targetEmail || resending) return;
    setResending(true);
    setResendStatus(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendStatus('Đã gửi lại email kích hoạt! Vui lòng kiểm tra hộp thư (cả mục Spam).');
      } else {
        setResendStatus(data.error?.message || 'Không thể gửi email kích hoạt.');
      }
    } catch {
      setResendStatus('Lỗi kết nối máy chủ.');
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setBlocked(null);
    setUnactivatedEmail(null);
    setResendStatus(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          device_id: getDeviceId(),
          device_name: getDeviceName(),
          app,
          redirect_url: redirectUrl,
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        turnstileRef.current?.reset();
        setTurnstileToken('');

        if (data.error?.code === 'DEVICE_LIMIT_EXCEEDED') {
          setBlocked({
            message: data.error.message || 'Tài khoản đã đạt giới hạn thiết bị.',
            contactUrl: data.error.contactUrl || '',
          });
          setLoading(false);
          return;
        }

        if (data.error?.code === 'ACCOUNT_NOT_ACTIVATED') {
          setUnactivatedEmail(data.error?.email || cleanEmail);
          setErrorMsg(data.error?.message || 'Tài khoản chưa được kích hoạt qua email.');
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
                {blocked.contactUrl && (
                  <a
                    href={blocked.contactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Liên hệ Admin mở khóa thiết bị</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="mb-5 p-3 rounded-xs bg-green-50 border border-green-200 text-xs text-green-700 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
          <span>Tài khoản của bạn đã được xác thực thành công! Vui lòng nhập mật khẩu để đăng nhập.</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 p-3 rounded-xs bg-red-50 border border-red-200 text-xs text-red-600 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          {unactivatedEmail && (
            <div className="pt-2 border-t border-red-200/80 flex items-center justify-between">
              <span className="text-[11px] text-red-700">Chưa nhận được email?</span>
              <button
                type="button"
                onClick={handleResendActivation}
                disabled={resending}
                className="text-xs font-bold text-brand hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {resending && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Gửi lại mã kích hoạt</span>
              </button>
            </div>
          )}
        </div>
      )}

      {resendStatus && (
        <div className="mb-4 p-3 rounded-xs bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
          <span>{resendStatus}</span>
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

        <Turnstile
          ref={turnstileRef}
          onSuccess={(token) => setTurnstileToken(token)}
          onError={() => setTurnstileToken('')}
          onExpire={() => setTurnstileToken('')}
          action="login"
        />

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
