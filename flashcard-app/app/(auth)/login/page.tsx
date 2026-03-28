"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/services/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/useToast";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        const msg =
          authError.message === "Invalid login credentials"
            ? "Email hoặc mật khẩu không đúng"
            : authError.message === "Email not confirmed"
            ? "Email chưa được xác nhận. Kiểm tra hộp thư."
            : authError.message;
        setError(msg);
        return;
      }

      if (!data.session) {
        setError("Không tạo được phiên đăng nhập. Vui lòng thử lại.");
        return;
      }

      // ✅ Correct order: refresh server state FIRST, then push
      toast({ title: "Đăng nhập thành công!", description: `Xin chào ${data.user.email}` });
      router.refresh();
      router.push(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)} required autoComplete="email" disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" type="password" placeholder="••••••••" value={password}
          onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" disabled={loading} />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-red-light via-white to-white px-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-xl">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red font-extrabold text-xl text-white">H</div>
          <span className="font-extrabold text-xl text-gray-900">Huy Tutor <span className="text-brand-red">Flashcard</span></span>
        </Link>
        <h1 className="mb-1 text-center text-2xl font-extrabold">Chào mừng trở lại!</h1>
        <p className="mb-6 text-center text-sm text-gray-500">Đăng nhập để tiếp tục học</p>

        {/* Suspense required — useSearchParams needs it in Next.js 14 */}
        <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-red" /></div>}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-bold text-brand-red hover:underline">Đăng ký</Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer"
            className="font-bold text-brand-red hover:underline">
            💬 Liên hệ mua bộ đề
          </a>
        </p>
      </div>
    </div>
  );
}
