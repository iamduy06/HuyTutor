"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSsoUrl } from "@/lib/sso";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const ssoBase = getSsoUrl();
  const ssoResetUrl = token
    ? `${ssoBase}/reset-password?token=${encodeURIComponent(token)}`
    : `${ssoBase}/reset-password`;

  useEffect(() => {
    window.location.href = ssoResetUrl;
  }, [ssoResetUrl]);

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 text-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-800 mb-1">Đang chuyển hướng đến Huy Tutor SSO...</h2>
      <p className="text-xs text-muted-foreground mb-6">Xác thực và đặt lại mật khẩu tập trung trên hệ thống Huy Tutor SSO.</p>

      <Button variant="brand-outline" size="sm" asChild>
        <Link href={ssoResetUrl}>Bấm vào đây nếu trình duyệt không tự chuyển</Link>
      </Button>
    </div>
  );
}
