"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const router    = useRouter();
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
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error || !data.user) {
      toast({ title: "Đăng ký thất bại", description: error?.message, variant: "destructive" });
      setLoading(false); return;
    }

    // Insert public profile (trigger also does this, belt-and-suspenders)
    await supabase.from("users").upsert({ id: data.user.id, email, role: "USER" });

    toast({ title: "Đăng ký thành công 🎉" });
    router.refresh();
    setTimeout(() => router.push("/dashboard"), 50);
  }

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
