"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { verifyOtpApi, resetPasswordApi } from "@/lib/auth";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  // Step 1: Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !otp) {
      toast({ title: "Vui lòng nhập đầy đủ email và mã OTP", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const res = await verifyOtpApi({
        email,
        token: otp,
        type: "recovery",
      });

      setLoading(false);

      if (!res.success) {
        toast({
          title: "Xác thực thất bại",
          description: res.error?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Xác thực mã OTP thành công! 🎉" });
      setStep("reset");
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }

  // Step 2: Handle Password Update
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Mật khẩu không khớp", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Mật khẩu tối thiểu 6 ký tự", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordApi({
        email,
        token: otp,
        new_password: password,
      });

      setLoading(false);

      if (!res.success) {
        toast({
          title: "Đặt lại mật khẩu thất bại",
          description: res.error?.message || "Có lỗi xảy ra khi đổi mật khẩu.",
          variant: "destructive",
        });
        return;
      }

      setDone(true);
      toast({ title: "Mật khẩu đã được cập nhật thành công 🎉" });
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }

  // Success Screen
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
          <Link href="/login">Đăng nhập ngay →</Link>
        </Button>
      </div>
    );
  }

  // Step 1: Verify OTP
  if (step === "verify") {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
        <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-brand" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-1 text-center">Xác thực mã OTP</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Nhập mã OTP 6 số đã được gửi tới email của bạn.
        </p>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
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
            <Label htmlFor="otp">Mã xác thực 6 số</Label>
            <Input
              id="otp"
              type="text"
              placeholder="------"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="mt-1 text-center text-lg tracking-[0.5em] font-bold h-12"
            />
          </div>

          <Button type="submit" variant="brand" className="w-full rounded-full mt-2" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Tiếp tục đặt lại mật khẩu →
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/login" className="text-brand font-semibold hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    );
  }

  // Step 2: Reset Password Form
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
        <KeyRound className="w-6 h-6 text-brand" />
      </div>
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-1 text-center">Mật khẩu mới</h1>
      <p className="text-muted-foreground text-sm mb-6 text-center">
        Nhập mật khẩu mới cho tài khoản <strong className="text-brand">{email}</strong>.
      </p>

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <Label htmlFor="new-pw">Mật khẩu mới</Label>
          <div className="relative mt-1">
            <Input
              id="new-pw"
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
          <Label htmlFor="confirm-pw">Xác nhận mật khẩu</Label>
          <Input
            id="confirm-pw"
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
          Cập nhật mật khẩu
        </Button>
      </form>
    </div>
  );
}
