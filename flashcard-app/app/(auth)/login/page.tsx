"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/services/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";

// Inner component uses useSearchParams — must be inside Suspense
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Inline error — does not depend on Toast being mounted
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirect = searchParams.get("redirect") ?? "/dashboard";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        // Map common Supabase error messages to Vietnamese
        const msg =
          authError.message === "Invalid login credentials"
            ? "Email hoặc mật khẩu không đúng"
            : authError.message === "Email not confirmed"
            ? "Email chưa được xác nhận. Kiểm tra hộp thư của bạn."
            : authError.message;
        setError(msg);
        return; // do NOT redirect on error
      }

      if (!data.session) {
        setError("Không thể tạo phiên đăng nhập. Vui lòng thử lại.");
        return;
      }

      // Session is now in cookies (handled by Supabase SSR client).
      // router.refresh() tells Next.js to re-run server components with
      // the new session, THEN push so middleware sees the cookie.
      router.refresh();
      router.push(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại. Thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* Inline error banner — always visible, no dependency on Toast */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}

// Page wraps LoginForm in Suspense so useSearchParams doesn't break hydration
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-red-light via-white to-white px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border-2 border-border p-8">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center font-extrabold text-white text-xl">
            H
          </div>
          <span className="font-extrabold text-xl text-gray-900">
            Huy Tutor <span className="text-brand-red">Flashcard</span>
          </span>
        </Link>

        <h1 className="text-2xl font-extrabold text-center mb-1">Chào mừng trở lại!</h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Đăng nhập để tiếp tục học
        </p>

        {/* Suspense required because LoginForm uses useSearchParams */}
        <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-red" /></div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-brand-red font-bold hover:underline">
            Đăng ký
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          <a
            href="https://web.facebook.com/huytutor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-red font-bold hover:underline"
          >
            Liên hệ Huy Tutor để mua bộ đề
          </a>
        </p>
      </div>
    </div>
  );
}
