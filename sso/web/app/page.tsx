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
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-[#f0e0e7] p-8 text-center transition-all">
        {/* Brand Logo Header */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ed0046] to-[#ff4d7e] flex items-center justify-center text-white shadow-lg shadow-[#ed0046]/25 mb-3">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-[#1a1a2e] tracking-tight">
            SSO Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Cổng Đăng Nhập & Quản Lý Xác Thực Tập Trung
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <span className="text-xs text-muted-foreground font-medium">
              Đang kiểm tra trạng thái tài khoản...
            </span>
          </div>
        ) : user ? (
          /* Trạng thái 1: ĐÃ ĐĂNG NHẬP */
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* User Info Card */}
            <div className="bg-gradient-to-b from-[#fff5f8] to-[#fff0f4] border border-[#fbd2df] rounded-2xl p-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1a1a2e] truncate">
                      {user.full_name || 'Học viên'}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-0.5 inline" />
                      Đã đăng nhập
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-2.5">
              <Link
                href="/change-password"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand text-white font-bold text-sm rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/20"
              >
                <KeyRound className="w-4 h-4" />
                <span>Đổi mật khẩu tài khoản</span>
              </Link>

              <Link
                href="/devices"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-[#f0e0e7] bg-white text-gray-700 font-bold text-sm rounded-xl hover:border-brand/40 hover:bg-pink-50/30 transition-all"
              >
                <Smartphone className="w-4 h-4 text-brand" />
                <span>Quản lý thiết bị đăng nhập</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-red-200 bg-red-50/60 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
              </button>
            </div>

            {/* Quick App Portals */}
            {(flashcardUrl || shopUrl) && (
              <div className="pt-3 border-t border-[#f0e0e7]">
                <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                  Truy cập ứng dụng hệ thống
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {flashcardUrl && (
                    <a
                      href={flashcardUrl}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-brand border border-gray-200/80 text-xs font-bold transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-brand" />
                      <span>Flashcard</span>
                    </a>
                  )}
                  {shopUrl && (
                    <a
                      href={shopUrl}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-brand border border-gray-200/80 text-xs font-bold transition-all"
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
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              Sử dụng một tài khoản duy nhất để truy cập toàn bộ hệ thống học tập và tài liệu.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand text-white font-bold text-sm rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>

              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-[#f0e0e7] bg-white text-gray-800 font-bold text-sm rounded-xl hover:border-brand/40 hover:bg-pink-50/30 transition-all"
              >
                <UserPlus className="w-4 h-4 text-brand" />
                <span>Đăng ký tài khoản</span>
              </Link>
            </div>

            <div className="pt-2">
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-brand transition-colors"
              >
                <span>Quên mật khẩu?</span>
              </Link>
            </div>

            {/* Quick App Portals */}
            {(flashcardUrl || shopUrl) && (
              <div className="pt-4 border-t border-[#f0e0e7]">
                <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                  Ứng dụng trong hệ sinh thái
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {flashcardUrl && (
                    <a
                      href={flashcardUrl}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-brand border border-gray-200/80 text-xs font-bold transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-brand" />
                      <span>Flashcard</span>
                    </a>
                  )}
                  {shopUrl && (
                    <a
                      href={shopUrl}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-brand border border-gray-200/80 text-xs font-bold transition-all"
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
