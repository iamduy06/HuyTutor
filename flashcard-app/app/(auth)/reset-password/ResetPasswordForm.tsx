"use client";

/**
 * Trang này được Supabase Auth redirect tới sau khi user click link email.
 * URL có dạng: /reset-password#access_token=...&type=recovery
 *
 * Supabase SSR tự đọc hash fragment và tạo session → ta chỉ cần gọi updateUser.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function ResetPasswordForm() {
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [tokenOk,   setTokenOk]   = useState<boolean | null>(null); // null = checking

  const router    = useRouter();
  const { toast } = useToast();

  // Kiểm tra session và lắng nghe sự kiện PASSWORD_RECOVERY
  useEffect(() => {
    const supabase = createClient();
    
    // 1. Kiểm tra session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setTokenOk(true);
      } else {
        // Nếu chưa có session, đợi 1 chút (tránh race condition với hash fragment)
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) setTokenOk(true);
          else if (tokenOk === null) setTokenOk(false);
        }, 1500);
      }
    });

    // 2. Lắng nghe sự kiện từ Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AUTH EVENT]", event);
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (session) setTokenOk(true);
      }
      if (event === "SIGNED_OUT") {
        // Không làm gì, để form Handle
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Mật khẩu không khớp", variant: "destructive" }); return;
    }
    if (password.length < 6) {
      toast({ title: "Mật khẩu tối thiểu 6 ký tự", variant: "destructive" }); return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "Đặt lại mật khẩu thất bại", description: error.message, variant: "destructive" });
      return;
    }

    // Sign out để user đăng nhập lại với mật khẩu mới
    await supabase.auth.signOut();
    setDone(true);
    toast({ title: "Mật khẩu đã được cập nhật 🎉" });
  }

  // Đang kiểm tra token
  if (tokenOk === null) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  // Token không hợp lệ / đã hết hạn
  if (tokenOk === false) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-14 h-14 text-destructive" />
        </div>
        <h1 className="text-xl font-extrabold text-[#1a1a2e] mb-2">Link không hợp lệ</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.<br />
          Vui lòng yêu cầu link mới.
        </p>
        <Button variant="brand" className="w-full rounded-full" asChild>
          <Link href="/forgot-password">Yêu cầu link mới</Link>
        </Button>
      </div>
    );
  }

  // Đặt lại thành công
  if (done) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>
        <h1 className="text-xl font-extrabold text-[#1a1a2e] mb-2">Mật khẩu đã được cập nhật!</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Vui lòng đăng nhập lại với mật khẩu mới của bạn.
        </p>
        <Button variant="brand" className="w-full rounded-full" asChild>
          <Link href="/login">Đăng nhập →</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-1">Đặt lại mật khẩu</h1>
      <p className="text-muted-foreground text-sm mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="password">Mật khẩu mới</Label>
          <div className="relative mt-1">
            <Input
              id="password" type={showPw ? "text" : "password"} required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
          <Input
            id="confirm" type="password" required className="mt-1"
            value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        {/* Strength indicator */}
        {password.length > 0 && (
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                i < Math.min(4, Math.floor(password.length / 3))
                  ? password.length < 6 ? "bg-red-400" : password.length < 10 ? "bg-yellow-400" : "bg-green-500"
                  : "bg-gray-200"
              }`} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {password.length < 6 ? "Quá ngắn" : password.length < 10 ? "Trung bình" : "Mạnh"}
            </span>
          </div>
        )}

        <Button type="submit" variant="brand" className="w-full rounded-full mt-2" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Cập nhật mật khẩu
        </Button>
      </form>
    </div>
  );
}
