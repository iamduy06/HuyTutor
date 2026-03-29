"use client";

import { useState } from "react";
import { Loader2, Mail, Calendar, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, loading } = useUser();
  const { toast } = useToast();
  const [newPw,    setNewPw]    = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving,   setSaving]   = useState(false);

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
    if (newPw !== confirmPw) { toast({ title: "Mật khẩu không khớp", variant: "destructive" }); return; }
    if (newPw.length < 6)   { toast({ title: "Mật khẩu tối thiểu 6 ký tự", variant: "destructive" }); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) { toast({ title: "Thất bại", description: error.message, variant: "destructive" }); }
    else       { toast({ title: "Đổi mật khẩu thành công 🎉" }); setNewPw(""); setConfirmPw(""); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-8">👤 Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 mb-6">
        <h2 className="font-bold text-lg text-[#1a1a2e] mb-5">Thông tin tài khoản</h2>
        <div className="flex flex-col gap-4">
          {[
            { icon: <Mail className="w-5 h-5 text-brand" />, label: "Email", value: user.email },
            { icon: <Calendar className="w-5 h-5 text-brand" />, label: "Ngày tham gia", value: formatDate(user.created_at) },
            { icon: <Shield className="w-5 h-5 text-brand" />, label: "Vai trò",
              value: <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-brand-light text-brand"}`}>
                {user.role === "ADMIN" ? "🛡️ Admin" : "👤 User"}
              </span>
            },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">{row.icon}</div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">{row.label}</div>
                <div className="font-semibold text-[#1a1a2e]">{row.value}</div>
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
            <Label>Mật khẩu mới</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="Tối thiểu 6 ký tự" required className="mt-1" />
          </div>
          <div>
            <Label>Xác nhận mật khẩu</Label>
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              placeholder="Nhập lại" required className="mt-1" />
          </div>
          <Button type="submit" variant="brand" className="w-full rounded-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Cập nhật
          </Button>
        </form>
      </div>
    </div>
  );
}
