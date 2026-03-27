"use client";

import { useState } from "react";
import { createClient } from "@/services/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Loader2, User, Mail, Calendar, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user, appUser, loading } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast({ title: "Lỗi", description: "Mật khẩu xác nhận không khớp", variant: "destructive" });
      return;
    }
    if (newPw.length < 8) {
      toast({ title: "Lỗi", description: "Mật khẩu phải có ít nhất 8 ký tự", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Re-auth first
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPw,
      });
      if (authError) throw new Error("Mật khẩu hiện tại không đúng");

      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;

      toast({ title: "Thành công!", description: "Mật khẩu đã được đổi" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <h1 className="text-3xl font-extrabold mb-8">Hồ sơ cá nhân</h1>

      {/* Info card */}
      <div className="bg-white rounded-2xl border-2 border-border p-6 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-brand-red" /> Thông tin tài khoản
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="font-semibold">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Ngày đăng ký</div>
              <div className="font-semibold">
                {appUser?.created_at ? formatDate(appUser.created_at) : "—"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Loại tài khoản</div>
              <div className="font-semibold">
                {appUser?.role === "ADMIN" ? "👑 Admin" : "👤 Thành viên"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border-2 border-border p-6">
        <h2 className="font-bold text-lg mb-4">🔒 Đổi mật khẩu</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPw">Mật khẩu hiện tại</Label>
            <Input
              id="currentPw" type="password" placeholder="••••••••"
              value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPw">Mật khẩu mới</Label>
            <Input
              id="newPw" type="password" placeholder="Tối thiểu 8 ký tự"
              value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPw">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPw" type="password" placeholder="Nhập lại mật khẩu mới"
              value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Lưu mật khẩu
          </Button>
        </form>
      </div>
    </div>
  );
}
