'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
  LogOut,
  Smartphone,
  BookOpen,
  ShoppingBag,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  created_at?: string;
}

export default function SsoHomePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const flashcardUrl = process.env.FLASHCARD_URL || '';
  const shopUrl = process.env.SHOP_URL || '';

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch {
      // ignore
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8 text-center">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xs bg-brand flex items-center justify-center text-white mb-3 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight uppercase">
            SSO Portal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Cổng Đăng Nhập &amp; Quản Lý Xác Thực Tập Trung
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
            <span className="text-xs text-gray-500 font-medium">
              Đang kiểm tra trạng thái tài khoản...
            </span>
          </div>
        ) : user ? (
          /* Trạng thái 1: ĐÃ ĐĂNG NHẬP */
          <div className="space-y-4 text-left">
            {/* User Info Card */}
            <div className="bg-brand-soft border border-pink-200 rounded-xs p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xs bg-brand text-white font-extrabold text-base flex items-center justify-center shrink-0">
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                      {user.full_name || 'Học viên'}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" />
                      Đã đăng nhập
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-2 pt-1">
              <Link
                href="/change-password"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand hover:bg-brand-hover text-white font-bold text-xs sm:text-sm rounded-xs transition shadow-xs"
              >
                <KeyRound className="w-4 h-4" />
                <span>Đổi mật khẩu tài khoản</span>
              </Link>

              <Link
                href="/devices"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm rounded-xs transition"
              >
                <Smartphone className="w-4 h-4 text-brand" />
                <span>Quản lý thiết bị &amp; phiên</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xs transition disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
              </button>
            </div>

            {/* Quick App Portals */}
            {(flashcardUrl || shopUrl) && (
              <div className="pt-3 border-t border-gray-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Ứng dụng trong hệ thống
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {flashcardUrl && (
                    <a
                      href={flashcardUrl}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xs bg-white hover:bg-brand-soft text-gray-700 hover:text-brand border border-gray-200 text-xs font-bold transition shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-brand" />
                      <span>Flashcard</span>
                    </a>
                  )}
                  {shopUrl && (
                    <a
                      href={shopUrl}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xs bg-white hover:bg-brand-soft text-gray-700 hover:text-brand border border-gray-200 text-xs font-bold transition shadow-2xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-brand" />
                      <span>Tài liệu Shop</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Trạng thái 2: CHƯA ĐĂNG NHẬP */
          <div className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Sử dụng một tài khoản duy nhất để truy cập toàn bộ hệ thống tài liệu và học tập.
            </p>

            <div className="space-y-2 pt-1">
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand hover:bg-brand-hover text-white font-bold text-xs sm:text-sm rounded-xs transition shadow-xs uppercase tracking-wide"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>

              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm rounded-xs transition shadow-2xs uppercase tracking-wide"
              >
                <UserPlus className="w-4 h-4 text-brand" />
                <span>Đăng ký tài khoản</span>
              </Link>
            </div>

            <div className="pt-1">
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand transition"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Quick App Portals */}
            {(flashcardUrl || shopUrl) && (
              <div className="pt-3 border-t border-gray-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Ứng dụng trong hệ sinh thái
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {flashcardUrl && (
                    <a
                      href={flashcardUrl}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xs bg-white hover:bg-brand-soft text-gray-700 hover:text-brand border border-gray-200 text-xs font-bold transition shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-brand" />
                      <span>Flashcard</span>
                    </a>
                  )}
                  {shopUrl && (
                    <a
                      href={shopUrl}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xs bg-white hover:bg-brand-soft text-gray-700 hover:text-brand border border-gray-200 text-xs font-bold transition shadow-2xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-brand" />
                      <span>Tài liệu Shop</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
