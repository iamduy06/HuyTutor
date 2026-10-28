"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId, getDeviceName } from "@/lib/device";
import { loginApi } from "@/lib/auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<{ message: string; contactUrl: string } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isUpgraded = searchParams.get("notice") === "upgraded";

  // Option B: Clean Cutover - Clean legacy Supabase storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setBlocked(null);

    try {
      const res = await loginApi({
        email,
        password,
        device_id: getDeviceId(),
        device_name: getDeviceName(),
      });

      if (!res.success) {
        if (res.error?.code === "DEVICE_LIMIT_EXCEEDED") {
          setBlocked({
            message: res.error.message || "Tài khoản đã đạt giới hạn thiết bị.",
            contactUrl: res.error.contactUrl || "https://web.facebook.com/huytutor",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Đăng nhập thất bại",
          description: res.error?.message || "Email hoặc mật khẩu không chính xác.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({ title: "Đăng nhập thành công 🎉" });
      router.refresh();
      const next = searchParams.get("next") ?? "/dashboard";
      setTimeout(() => router.push(next), 50);
    } catch (err: any) {
      console.error("[LOGIN_ERROR]", err);
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-1">Đăng nhập</h1>
      <p className="text-muted-foreground text-sm mb-6">Chào mừng trở lại!</p>

      {/* Option B: Security Upgrade Banner */}
      {isUpgraded && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-blue-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Hệ thống đã nâng cấp bảo mật toàn diện. Vui lòng đăng nhập lại để tiếp tục.</span>
        </div>
      )}

      {/* Device blocked message */}
      {blocked && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Không thể đăng nhập</p>
              <p className="text-xs text-red-600 mb-3">{blocked.message}</p>
              <a
                href={blocked.contactUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Liên hệ hỗ trợ
              </a>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Label htmlFor="password">Mật khẩu</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
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
        <Button type="submit" variant="brand" className="w-full rounded-full mt-2" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Đăng nhập
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-brand font-semibold hover:underline">
            Đăng ký
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="text-muted-foreground hover:text-brand hover:underline text-xs">
            Quên mật khẩu?
          </Link>
        </p>
      </div>
    </div>
  );
}
