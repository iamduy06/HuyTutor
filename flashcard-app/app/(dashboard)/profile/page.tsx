"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { Loader2, User, Mail, Calendar, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/services/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, loading } = useUser();
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

  if (!user) {
    redirect("/login");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast({ title: "Mật khẩu mới không khớp", variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: "Mật khẩu phải có ít nhất 6 ký tự", variant: "destructive" });
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) {
      toast({ title: "Đổi mật khẩu thất bại", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Đổi mật khẩu thành công! 🎉" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-[5%] py-10">
      <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-8">👤 Hồ sơ cá nhân</h1>

      {/* Info card */}
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 mb-6">
        <h2 className="font-bold text-lg text-[#1a1a2e] mb-5">Thông tin tài khoản</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Email</div>
              <div className="font-semibold text-[#1a1a2e]">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Ngày tham gia</div>
              <div className="font-semibold text-[#1a1a2e]">{formatDate(user.created_at)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Membership</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  user.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-brand-light text-brand"
                }`}>
                  {user.role === "ADMIN" ? "🛡️ Admin" : "👤 User"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6">
        <h2 className="font-bold text-lg text-[#1a1a2e] mb-5 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-brand" /> Đổi mật khẩu
        </h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="newPw">Mật khẩu mới</Label>
            <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
              placeholder="Tối thiểu 6 ký tự" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="confirmPw">Xác nhận mật khẩu mới</Label>
            <Input id="confirmPw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Nhập lại mật khẩu mới" required className="mt-1" />
          </div>
          <Button type="submit" variant="brand" className="w-full rounded-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Cập nhật mật khẩu
          </Button>
        </form>
      </div>
    </div>
  );
}
