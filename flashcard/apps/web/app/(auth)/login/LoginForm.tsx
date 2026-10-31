"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

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
            <Link href="/devices">
              <span>Quản lý thiết bị đã liên kết</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
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

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 text-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-800 mb-1">Đang chuyển hướng đến Huy Tutor SSO...</h2>
      <p className="text-xs text-muted-foreground mb-6">Đăng nhập một tài khoản chung cho toàn bộ hệ thống.</p>

      <Button variant="brand-outline" size="sm" asChild>
        <Link href="/login" className="gap-2">
          <span>Tiếp tục đăng nhập</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
