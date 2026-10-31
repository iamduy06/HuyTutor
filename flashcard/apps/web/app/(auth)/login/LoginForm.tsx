"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next") || "https://flashcard.huytutor.edu.vn/dashboard";

  const ssoLoginUrl = `https://sso.huytutor.edu.vn/login?app=flashcard&redirect=${encodeURIComponent(next)}`;
  const ssoDevicesUrl = "https://sso.huytutor.edu.vn/devices";

  useEffect(() => {
    // If not in error state, redirect automatically to Central SSO
    if (!error) {
      window.location.href = ssoLoginUrl;
    }
  }, [error, ssoLoginUrl]);

  if (error === "device_limit_exceeded") {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-red-200 p-8 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Đạt giới hạn thiết bị</h1>
        <p className="text-xs text-gray-600 leading-relaxed mb-6">
          Tài khoản của bạn đã đạt giới hạn thiết bị học Flashcard được cấp phép. Bạn chưa thể sử dụng tài khoản trên thiết bị này.
        </p>

        <div className="space-y-3">
          <Button variant="brand" className="w-full justify-center gap-2" asChild>
            <a href={ssoDevicesUrl}>
              <span>Quản lý thiết bị đã liên kết</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>

          <Button variant="ghost" className="w-full text-xs text-gray-500" asChild>
            <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
              Liên hệ Admin hỗ trợ
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (error === "device_revoked") {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-amber-200 p-8 text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Thiết bị đã bị hủy liên kết</h1>
        <p className="text-xs text-gray-600 leading-relaxed mb-6">
          Thiết bị này đã được Quản trị viên gỡ bỏ quyền truy cập. Vui lòng đăng nhập lại để cập nhật phiên.
        </p>

        <Button variant="brand" className="w-full justify-center gap-2" asChild>
          <a href={ssoLoginUrl}>
            <span>Đăng nhập lại qua SSO</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 text-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-800 mb-1">Đang chuyển hướng đến Huy Tutor SSO...</h2>
      <p className="text-xs text-muted-foreground mb-6">Hệ thống xác thực tập trung một tài khoản duy nhất.</p>

      <Button variant="brand-outline" size="sm" asChild>
        <a href={ssoLoginUrl}>Bấm vào đây nếu trình duyệt không tự chuyển</a>
      </Button>
    </div>
  );
}
