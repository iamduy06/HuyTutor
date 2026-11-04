'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Turnstile, type TurnstileRef } from '@/components/Turnstile';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileRef>(null);

  useEffect(() => {
    if (!token) {
      setCheckingToken(false);
      setTokenValid(false);
      return;
    }

    let active = true;

    async function checkToken() {
      try {
        const res = await fetch(`/api/auth/verify-token?token=${encodeURIComponent(token)}`, {
          method: 'GET',
        });
        const data = await res.json();

        if (!active) return;

        if (res.ok && data.success && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          const errorText = data.error?.message || (typeof data.error === 'string' ? data.error : 'Liên kết không hợp lệ hoặc đã hết hạn.');
          setErrorMsg(errorText);
        }
      } catch {
        if (!active) return;
        setTokenValid(false);
        setErrorMsg('Đã có lỗi xảy ra, vui lòng thử lại.');
      } finally {
        if (active) {
          setCheckingToken(false);
        }
      }
    }

    checkToken();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password, turnstileToken }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        turnstileRef.current?.reset();
        setTurnstileToken('');
        const errorText = data.error?.message || (typeof data.error === 'string' ? data.error : 'Đã có lỗi xảy ra, vui lòng thử lại.');
        setErrorMsg(errorText);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      turnstileRef.current?.reset();
      setTurnstileToken('');
      setErrorMsg('Đã có lỗi xảy ra, vui lòng thử lại.');
      setLoading(false);
    }
  }

  if (checkingToken) {
    return (
      <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8 text-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto mb-3" />
        <h2 className="text-sm font-bold text-gray-900 mb-1">Đang kiểm tra liên kết...</h2>
        <p className="text-xs text-gray-500">Vui lòng chờ trong giây lát.</p>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-gray-900 mb-1">Liên kết không hợp lệ</h2>
        <p className="text-xs text-gray-500 mb-4">
          {errorMsg || 'Liên kết xác thực không tồn tại hoặc đã hết hạn.'}
        </p>
        <a href="/forgot-password" className="text-xs text-brand font-bold hover:underline">
          Gửi lại yêu cầu khôi phục
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-xs border border-gray-200">
            Khôi phục
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Đặt lại mật khẩu
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Nhập mật khẩu mới cho tài khoản của bạn.
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
            Mật khẩu mới của bạn đã có hiệu lực trên toàn bộ hệ thống.
          </p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xs transition shadow-xs uppercase tracking-wide"
          >
            Đăng nhập ngay
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={6}
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
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors"
            />
          </div>

          <Turnstile
            ref={turnstileRef}
            onSuccess={(t) => setTurnstileToken(t)}
            onError={() => setTurnstileToken('')}
            onExpire={() => setTurnstileToken('')}
            action="reset_password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xs font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Cập nhật mật khẩu</span>
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-8 flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
