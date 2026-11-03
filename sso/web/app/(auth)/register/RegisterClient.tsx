'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, Mail, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pending verification state
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [unactivatedEmail, setUnactivatedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success: boolean; message: string } | null>(null);

  async function handleResendVerification() {
    if (!registeredEmail || resending) return;
    setResending(true);
    setResendStatus(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendStatus({ success: true, message: 'Đã gửi lại email xác thực thành công. Vui lòng kiểm tra hộp thư!' });
      } else {
        setResendStatus({ success: false, message: data.error?.message || 'Không thể gửi lại email xác thực.' });
      }
    } catch {
      setResendStatus({ success: false, message: 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.' });
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);
    setUnactivatedEmail(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.error?.code === 'ACCOUNT_EXISTS_UNACTIVATED') {
          setUnactivatedEmail(data.error?.email || cleanEmail);
        }
        setErrorMsg(data.error?.message || 'Đăng ký không thành công.');
        setLoading(false);
        return;
      }

      if (data.require_verification) {
        setRegisteredEmail(data.email || cleanEmail);
        setLoading(false);
        return;
      }

      // Fallback in case of immediate login token
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

  // Render pending verification screen after successful registration
  if (registeredEmail) {
    const loginLink = `/login?email=${encodeURIComponent(registeredEmail)}${redirectUrl ? '&redirect=' + encodeURIComponent(redirectUrl) : ''}${app ? '&app=' + encodeURIComponent(app) : ''}`;

    return (
      <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8 text-center">
        <div className="w-14 h-14 bg-pink-50 border border-pink-200 rounded-full flex items-center justify-center mx-auto mb-4 text-brand">
          <Mail className="w-7 h-7" />
        </div>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-xs border border-gray-200">
            Huy Tutor ID
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            Kiểm tra hộp thư của bạn
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Chúng tôi đã gửi một liên kết xác thực tài khoản tới địa chỉ email:
          </p>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xs text-sm font-bold text-gray-900 mb-4 break-all">
          {registeredEmail}
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-6 text-left bg-amber-50/60 p-3 rounded-xs border border-amber-200/80">
          Vui lòng mở hộp thư email và nhấn vào nút <strong>Xác thực tài khoản</strong> để hoàn tất kích hoạt. Nếu không tìm thấy, vui lòng kiểm tra cả thư mục <strong>Thư rác (Spam)</strong>.
        </p>

        {resendStatus && (
          <div
            className={`mb-4 p-3 rounded-xs border text-xs text-left flex items-start gap-2 ${
              resendStatus.success
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            {resendStatus.success ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span>{resendStatus.message}</span>
          </div>
        )}

        <div className="space-y-3">
          <a
            href={loginLink}
            className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xs font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            <span>Đi đến trang Đăng nhập</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xs font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {resending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            )}
            <span>Gửi lại email xác thực</span>
          </button>
        </div>
      </div>
    );
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
        <div className="mb-4 p-3 rounded-xs bg-red-50 border border-red-200 text-xs text-red-600 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          {unactivatedEmail && (
            <div className="pt-2 border-t border-red-200/80 flex items-center justify-between">
              <span className="text-[11px] text-red-700">Chưa nhận được email?</span>
              <button
                type="button"
                onClick={() => {
                  setRegisteredEmail(unactivatedEmail);
                  handleResendVerification();
                }}
                className="text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                Gửi lại email xác thực
              </button>
            </div>
          )}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Xác nhận lại mật khẩu
          </label>
          <div className="relative">
            <input
              type={showConfirmPw ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xs font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide cursor-pointer"
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
