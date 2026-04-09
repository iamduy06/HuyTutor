"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [registered,  setRegistered]  = useState(false); // show confirm screen
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Mật khẩu không khớp", variant: "destructive" }); return;
    }
    if (password.length < 6) {
      toast({ title: "Mật khẩu ít nhất 6 ký tự", variant: "destructive" }); return;
    }
    setLoading(true);
    const supabase = createClient();

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Sau khi click link xác nhận → về /login
        emailRedirectTo: `${origin}/login`,
      },
    });

    setLoading(false);

    if (error) {
      toast({ title: "Đăng ký thất bại", description: error.message, variant: "destructive" });
      return;
    }

    // Supabase trả session=null khi email confirm bắt buộc
    // Nếu có session ngay → auto-confirmed (dev mode) → vào dashboard
    if (data.session) {
      window.location.href = "/dashboard";
      return;
    }

    // Email confirm required → hiện màn xác nhận
    setRegistered(true);
  }

  // ── Màn xác nhận email ──────────────────────────────────────────
  if (registered) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 text-center">
        <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-5">
          <Mail className="w-8 h-8 text-brand" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-2">Kiểm tra email!</h1>
        <p className="text-muted-foreground text-sm mb-1">
          Chúng tôi đã gửi email xác nhận tới:
        </p>
        <p className="font-bold text-brand text-base mb-5">{email}</p>
        <div className="bg-[#f8f9fa] border border-[#f0e0e7] rounded-xl p-4 text-sm text-[#495057] text-left mb-6 space-y-2">
          <p>📬 Mở email và nhấn <strong>Confirm your email</strong></p>
          <p>🔗 Link xác nhận sẽ đưa bạn tới trang đăng nhập</p>
          <p>⚠️ Nếu không thấy, hãy kiểm tra thư mục <strong>Spam/Junk</strong></p>
        </div>
        <Button variant="brand" className="w-full rounded-full" asChild>
          <Link href="/login">Đi đến trang đăng nhập →</Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Nhập sai email?{" "}
          <button onClick={() => setRegistered(false)}
            className="text-brand font-semibold hover:underline">
            Đăng ký lại
          </button>
        </p>
      </div>
    );
  }

  // ── Form đăng ký ────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-1">Đăng ký</h1>
      <p className="text-muted-foreground text-sm mb-6">Tạo tài khoản để theo dõi tiến độ.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="pw">Mật khẩu</Label>
          <div className="relative mt-1">
            <Input id="pw" type={showPw ? "text" : "password"} required
              value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
          <Input id="confirm" type="password" required className="mt-1"
            value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
        <Button type="submit" variant="brand" className="w-full rounded-full mt-2" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Đăng ký
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-brand font-semibold hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
}
