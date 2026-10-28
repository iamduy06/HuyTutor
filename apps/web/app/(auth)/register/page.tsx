"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { registerApi, verifyOtpApi } from "@/lib/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Mật khẩu không khớp", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Mật khẩu ít nhất 6 ký tự", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const res = await registerApi({
        email,
        password,
        full_name: fullName.trim() || email.split("@")[0],
      });

      setLoading(false);

      if (!res.success) {
        toast({
          title: "Đăng ký thất bại",
          description: res.error?.message || "Không thể tạo tài khoản. Vui lòng thử lại.",
          variant: "destructive",
        });
        return;
      }

      setStep("verify");
      toast({ title: "Vui lòng kiểm tra mã OTP trong email! 📬" });
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast({ title: "Vui lòng nhập mã OTP 6 số", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const res = await verifyOtpApi({
        email,
        token: otp,
        type: "signup",
      });

      setLoading(false);

      if (!res.success) {
        toast({
          title: "Xác thực thất bại",
          description: res.error?.message || "Mã OTP không chính xác hoặc đã hết hạn.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Đăng ký và xác thực thành công! 🎉" });
      window.location.href = "/dashboard";
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Lỗi xác thực",
        description: "Đã có lỗi xảy ra khi xác thực mã OTP.",
        variant: "destructive",
      });
    }
  }

  // ── Bước 2: Xác thực OTP ──────────────────────────────────────────
  if (step === "verify") {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 text-center">
        <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-8 h-8 text-brand" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-2">Xác thực tài khoản</h1>
        <p className="text-muted-foreground text-sm mb-1">
          Chúng tôi đã gửi mã OTP 6 số tới:
        </p>
        <p className="font-bold text-brand text-base mb-2">{email}</p>
        <p className="text-muted-foreground text-[10px] mb-6 italic">
          Mã có hiệu lực trong <strong>5 phút</strong>.
        </p>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="otp">Mã xác thực 6 số</Label>
            <Input
              id="otp"
              type="text"
              placeholder="------"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.5em] font-bold h-12"
            />
          </div>

          <Button type="submit" variant="brand" className="w-full rounded-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Xác nhận và Hoàn tất
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Nhập sai email?{" "}
          <button
            type="button"
            onClick={() => setStep("form")}
            className="text-brand font-semibold hover:underline"
          >
            Quay lại đăng ký
          </button>
        </p>
      </div>
    );
  }

  // ── Bước 1: Form đăng ký ────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-1">Đăng ký</h1>
      <p className="text-muted-foreground text-sm mb-6">Tạo tài khoản để theo dõi tiến độ.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="pw">Mật khẩu</Label>
          <div className="relative mt-1">
            <Input
              id="pw"
              type={showPw ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
          <Input
            id="confirm"
            type="password"
            required
            className="mt-1"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" variant="brand" className="w-full rounded-full mt-2" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Đăng ký ngay
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
