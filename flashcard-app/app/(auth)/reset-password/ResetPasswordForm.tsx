"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function ResetPasswordForm() {
  const router = useRouter();
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

  // Pre-fill email from URL if available
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  // Handle OTP Verification
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !otp) {
      toast({ title: "Vui lòng nhập đầy đủ thông tin", variant: "destructive" });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Xác thực thất bại",
        description: error.message === "Token has expired or is invalid" 
          ? "Mã OTP không hợp lệ hoặc đã hết hạn." 
          : error.message,
        variant: "destructive",
      });
      return;
    }

    if (data.session) {
      toast({ title: "Xác thực mã OTP thành công! 🎉" });
      setStep("reset");
    }
  }

  // Handle Password Update
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
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({
        title: "Đặt lại mật khẩu thất bại",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Sign out to force fresh login with new password
    await supabase.auth.signOut();
    setDone(true);
    toast({ title: "Mật khẩu đã được cập nhật thành công 🎉" });
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-light rounded-lg">
            <KeyRound className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1a1a2e]">Xác thực OTP</h1>
            <p className="text-muted-foreground text-xs font-medium">Nhập mã 6 số được gửi tới email</p>
          </div>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email tài khoản</Label>
            <div className="relative">
              <Input id="email" type="email" placeholder="you@example.com" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="pl-9" />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">Mã xác thực 6 số</Label>
            <Input id="otp" type="text" placeholder="------" required maxLength={6}
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.5em] font-bold" />
          </div>

          <Button type="submit" variant="brand" className="w-full rounded-full mt-2" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Xác thực mã OTP
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Chưa nhận được mã?{" "}
          <Link href="/forgot-password" weights="semibold" className="text-brand font-semibold hover:underline">
            Gửi lại yêu cầu
          </Link>
        </p>
      </div>
    );
  }

  // Step 2: New Password
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-1">Thiết lập mật khẩu mới</h1>
      <p className="text-muted-foreground text-sm mb-6">Nhập mật khẩu mới an toàn cho tài khoản của bạn.</p>

      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="password">Mật khẩu mới</Label>
          <div className="relative mt-1">
            <Input id="password" type={showPw ? "text" : "password"} required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự" />
            <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
          <Input id="confirm" type="password" required className="mt-1"
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Nhập lại mật khẩu mới" />
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
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Cập nhật mật khẩu
        </Button>
      </form>
    </div>
  );
}
