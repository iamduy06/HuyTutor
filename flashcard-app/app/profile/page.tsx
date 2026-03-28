"use client";
import { useState } from "react";
import { createClient } from "@/services/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/common/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import { Loader2, Mail, Calendar, Shield, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, appUser, loading } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPw !== confirmPw) { setError("Mật khẩu xác nhận không khớp"); return; }
    if (newPw.length < 8) { setError("Mật khẩu mới phải có ít nhất 8 ký tự"); return; }
    setSaving(true);
    try {
      // Re-authenticate first
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPw,
      });
      if (reAuthError) throw new Error("Mật khẩu hiện tại không đúng");

      const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
      if (updateError) throw updateError;

      toast({ title: "✅ Đổi mật khẩu thành công!" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thất bại");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
        <h1 className="mb-8 text-3xl font-extrabold">Hồ sơ cá nhân</h1>

        <div className="mb-6 rounded-2xl border-2 border-gray-100 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Mail className="h-5 w-5 text-brand-red" /> Thông tin tài khoản
          </h2>
          <div className="space-y-3">
            {[
              { icon: <Mail className="h-4 w-4 text-gray-400" />, label: "Email", value: user?.email },
              { icon: <Calendar className="h-4 w-4 text-gray-400" />, label: "Ngày đăng ký", value: appUser?.created_at ? formatDate(appUser.created_at) : "—" },
              { icon: <Shield className="h-4 w-4 text-gray-400" />, label: "Loại tài khoản", value: appUser?.role === "ADMIN" ? "👑 Admin" : "👤 Thành viên" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                {item.icon}
                <div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                  <div className="font-semibold">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-gray-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">🔒 Đổi mật khẩu</h2>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cur">Mật khẩu hiện tại</Label>
              <Input id="cur" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">Mật khẩu mới</Label>
              <Input id="new" type="password" placeholder="Tối thiểu 8 ký tự" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf">Xác nhận mật khẩu mới</Label>
              <Input id="conf" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu mật khẩu
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
