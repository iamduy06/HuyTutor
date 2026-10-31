"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSsoUrl, getAppUrl } from "@/lib/sso";

export default function RegisterPage() {
  const ssoBase = getSsoUrl();
  const appBase = getAppUrl();
  const targetUrl = appBase ? `${appBase}/dashboard` : "/dashboard";
  const ssoRegisterUrl = ssoBase
    ? `${ssoBase}/register?app=flashcard&redirect=${encodeURIComponent(targetUrl)}`
    : "/login";

  useEffect(() => {
    window.location.href = ssoRegisterUrl;
  }, [ssoRegisterUrl]);

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 text-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-800 mb-1">Đang chuyển hướng đến Huy Tutor SSO...</h2>
      <p className="text-xs text-muted-foreground mb-6">Đăng ký tài khoản chung cho toàn bộ hệ thống Huy Tutor.</p>

      <Button variant="brand-outline" size="sm" asChild>
        <a href={ssoRegisterUrl}>Bấm vào đây nếu trình duyệt không tự chuyển</a>
      </Button>
    </div>
  );
}
