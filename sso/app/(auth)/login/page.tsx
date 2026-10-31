'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';
import { getDeviceId, getDeviceName } from '@/lib/clientDevice';

function LoginContent() {
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
          redirect_url: redirectUrl
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error?.code === 'DEVICE_LIMIT_EXCEEDED') {
          setBlocked({
            message: data.error.message || 'Tài khoản đã đạt giới hạn thiết bị.',
            contactUrl: data.error.contactUrl || 'https://web.facebook.com/huytutor'
          });
          setLoading(false);
          return;
        }

        setErrorMsg(data.error?.message || 'Email hoặc mật khẩu không chính xác.');
        setLoading(false);
        return;
      }

      // Successful login
      // If redirect URL provided and is safe (*.huytutor.edu.vn or localhost), redirect there
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (app === 'flashcard') {
        window.location.href = 'https://flashcard.huytutor.edu.vn/dashboard';
      } else {
        window.location.href = 'https://huytutor.edu.vn';
      }
    } catch (err: any) {
      console.error('[LOGIN_ERROR]', err);
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#1a1a2e] tracking-tight">Đăng nhập tài khoản</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {app === 'flashcard' ? 'Đăng nhập vào hệ thống Học Flashcard' : 
           app === 'shop' ? 'Đăng nhập vào Hệ thống Tài liệu Huy Tutor' : 
           'Sử dụng một tài khoản duy nhất cho mọi dịch vụ của Huy Tutor.'}
        </p>
      </div>

      {/* App Badge */}
      {app && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-light text-brand">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{app === 'flashcard' ? 'Flashcard Học tập' : 'Huy Tutor Shop'}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Device Blocked Notice (Flashcard Context Only) */}
      {blocked && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Không thể truy cập Flashcard</p>
              <p className="text-xs text-red-600 mb-3">{blocked.message}</p>
              <div className="flex items-center gap-2">
                <a
                  href={blocked.contactUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Liên hệ Admin gỡ thiết bị
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700">Mật khẩu</label>
            <a href="/forgot-password" className="text-xs text-brand hover:underline font-medium">
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
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
          <span>Đăng nhập</span>
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-muted-foreground">
        Chưa có tài khoản?{' '}
        <a href={`/register${redirectUrl ? '?redirect=' + encodeURIComponent(redirectUrl) : ''}`} className="text-brand font-bold hover:underline">
          Đăng ký ngay
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

