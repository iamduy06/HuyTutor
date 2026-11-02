"use client";

import { Loader2, Mail, Calendar, Shield, KeyRound, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { useSubadmin } from "@/hooks/use-subadmin";
import { formatDate } from "@/lib/utils";
import { getSsoUrl } from "@/lib/sso";

export default function ProfilePage() {
  const { user, loading } = useUser();
  const { isSystemAdmin, isSystemSubadmin, isGroupActive, effectiveRoleLabel } = useSubadmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }
  if (!user) return null;

  // Xác định màu badge
  const getBadgeStyles = () => {
    if (isSystemAdmin) return "bg-purple-100 text-purple-700 ring-1 ring-purple-200";
    if (isSystemSubadmin) {
      return isGroupActive
        ? "bg-green-100 text-green-700 ring-1 ring-green-200"
        : "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200";
    }
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  };

  const ssoBase = getSsoUrl();
  const ssoChangePasswordUrl = `${ssoBase}/change-password?redirect=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.href : ""
  )}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-8">👤 Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 mb-6">
        <h2 className="font-bold text-lg text-[#1a1a2e] mb-5">Thông tin tài khoản</h2>
        <div className="flex flex-col gap-4">
          {[
            { icon: <Mail className="w-5 h-5 text-brand" />, label: "Email", value: user.email },
            {
              icon: <Calendar className="w-5 h-5 text-brand" />,
              label: "Ngày tham gia",
              value: formatDate(user.created_at),
            },
            {
              icon: <Shield className="w-5 h-5 text-brand" />,
              label: "Vai trò hoạt động",
              value: (
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex items-center w-fit text-[11px] font-bold px-3 py-1 rounded-full ${getBadgeStyles()}`}
                  >
                    {isSystemAdmin && "🛡️ "}
                    {effectiveRoleLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground italic">
                    (Phân quyền dựa trên vai trò hệ thống và nhóm quản lý)
                  </span>
                </div>
              ),
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
                {row.icon}
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">{row.label}</div>
                <div className="font-semibold text-[#1a1a2e] leading-tight">{row.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6">
        <h2 className="font-bold text-lg text-[#1a1a2e] mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-brand" /> Quản lý mật khẩu
        </h2>
        <Button variant="brand" className="rounded-full flex items-center gap-2" asChild>
          <a href={ssoChangePasswordUrl}>
            <span>Sử dụng SSO portal để đổi mật khẩu của bạn</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
