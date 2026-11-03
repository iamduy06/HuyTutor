'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMsg('Liên kết không chứa mã xác thực hợp lệ.');
      return;
    }

    let active = true;

    async function doVerify() {
      try {
        const query = new URLSearchParams({
          token,
          type: 'signup',
          ...(emailParam ? { email: emailParam } : {}),
        });

        const res = await fetch(`/api/auth/verify-token?${query.toString()}`, {
          method: 'GET',
        });
        const data = await res.json();

        if (!active) return;

        if (res.ok && data.success) {
          setSuccess(true);
          if (data.already_verified) {
            setAlreadyVerified(true);
          }
          if (data.email) {
            setResendEmail(data.email);
          }
        } else {
          setSuccess(false);
          const msg = data.error?.message || (typeof data.error === 'string' ? data.error : 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.');
          setErrorMsg(msg);
        }
      } catch {
        if (!active) return;
        setSuccess(false);
        setErrorMsg('Lỗi kết nối máy chủ khi xác thực tài khoản. Vui lòng thử lại sau.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    doVerify();

    return () => {
      active = false;
    };
  }, [token, emailParam]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail || resending) return;
    setResending(true);
    setResendStatus(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
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

  if (loading) {
    return (
      <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8 text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
        <h2 className="text-base font-extrabold text-gray-900 mb-1">Đang xác thực tài khoản...</h2>
        <p className="text-xs text-gray-500">Hệ thống đang tiến hành kích hoạt tài khoản của bạn.</p>
      </div>
    );
  }

  if (success) {
    const loginUrl = `/login?verified=true${resendEmail ? '&email=' + encodeURIComponent(resendEmail) : ''}`;

    return (
      <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8 text-center">
        <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-xs border border-gray-200">
            Huy Tutor ID
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            {alreadyVerified ? 'Tài khoản đã kích hoạt' : 'Xác thực tài khoản thành công!'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {alreadyVerified
              ? 'Tài khoản của bạn đã được kích hoạt trước đó.'
              : 'Tài khoản của bạn đã được kích hoạt thành công trên toàn bộ hệ thống.'}
          </p>
        </div>

        {resendEmail && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xs text-xs font-bold text-gray-800 mb-5 break-all">
            {resendEmail}
          </div>
        )}

        <a
          href={loginUrl}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xs font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
        >
          <span>Đăng nhập ngay</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8 text-center">
      <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-xs border border-gray-200">
          Huy Tutor ID
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
          Xác thực không thành công
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {errorMsg || 'Mã xác thực không hợp lệ hoặc đã hết hạn.'}
        </p>
      </div>

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

      <form onSubmit={handleResend} className="space-y-3 mb-4 text-left">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Gửi lại email xác thực
          </label>
          <input
            type="email"
            required
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="Nhập email của bạn"
            className="w-full px-3 py-2 text-sm rounded-xs border border-gray-300 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-gray-400 text-gray-900 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={resending}
          className="w-full py-2 bg-gray-900 hover:bg-black text-white rounded-xs font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {resending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          <span>Gửi lại mã kích hoạt</span>
        </button>
      </form>

      <div className="pt-3 border-t border-gray-200">
        <a href="/login" className="text-xs text-brand font-bold hover:underline">
          Quay lại trang Đăng nhập
        </a>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xs p-8 flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
