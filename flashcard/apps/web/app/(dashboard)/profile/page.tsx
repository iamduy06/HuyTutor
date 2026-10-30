"use client";

import { useState } from "react";
import { Loader2, Mail, Calendar, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClientToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { useSubadmin } from "@/hooks/use-subadmin";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, loading } = useUser();
  const { isSystemAdmin, isSystemSubadmin, isGroupActive, effectiveRoleLabel } = useSubadmin();
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }
  if (!user) return null;

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPw) {
      toast({ title: "Vui lòng nhập mật khẩu hiện tại", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Mật khẩu mới không khớp", variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: "Mật khẩu tối thiểu 6 ký tự", variant: "destructive" });
      return;
    }
    setSaving(true);
    toast({ title: "Đang cập nhật mật khẩu...", description: "Vui lòng đợi giây lát." });

    const token = getClientToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers,
      body: JSON.stringify({
        password: newPw,
        current_password: currentPw,
      }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      const errMsg =
        typeof result?.error === "string"
          ? result.error
          : result?.error?.message || "Có lỗi xảy ra";
      toast({ title: "Thất bại", description: errMsg, variant: "destructive" });
    } else {
      toast({ title: "Đổi mật khẩu thành công 🎉" });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
  }

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
        <h2 className="font-bold text-lg text-[#1a1a2e] mb-5 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-brand" /> Đổi mật khẩu
        </h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div>
            <Label>Mật khẩu hiện tại</Label>
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Nhập mật khẩu đang dùng"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Mật khẩu mới</Label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Xác nhận mật khẩu mới</Label>
            <Input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" variant="brand" className="w-full rounded-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang xử lý...
              </>
            ) : (
              "Cập nhật mật khẩu"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
