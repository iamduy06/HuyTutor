"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function ForgotPasswordForm() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Sau khi user click link trong email, redirect về trang đổi mật khẩu
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Gửi email thất bại",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-2">Kiểm tra Email!</h1>
        <p className="text-muted-foreground text-sm mb-2">
          Chúng tôi đã gửi mã xác thực (OTP) tới:
        </p>
        <p className="font-semibold text-brand mb-6">{email}</p>
        <p className="text-muted-foreground text-xs mb-6">
          Vui lòng nhập mã OTP 6 số vào trang đặt lại mật khẩu để tiếp tục. 
          Mã có hiệu lực trong <strong>5 phút</strong>.
        </p>
        <div className="space-y-3">
          <Button variant="brand" className="w-full rounded-full" asChild>
            <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
              Nhập mã xác thực →
            </Link>
          </Button>
          <Button variant="ghost" className="w-full rounded-full text-xs" onClick={() => { setEmail(""); setSent(false); }}>
            Gửi lại mã khác
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/login" className="text-brand font-semibold hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Quay lại đăng nhập
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-1">Quên mật khẩu?</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Nhập email của bạn — chúng tôi sẽ gửi mã OTP đặt lại mật khẩu.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email" type="email" autoComplete="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" className="mt-1"
          />
        </div>
        <Button type="submit" variant="brand" className="w-full rounded-full mt-2" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Gửi mã OTP xác thực
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/login" className="text-brand font-semibold hover:underline flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
