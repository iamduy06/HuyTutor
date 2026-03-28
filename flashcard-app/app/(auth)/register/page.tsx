"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/services/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/useToast";

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp"); return; }
    if (password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự"); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { role: "USER" } },
      });
      if (authError) throw authError;
      toast({ title: "Đăng ký thành công!", description: "Kiểm tra email xác nhận (nếu bật)" });
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{error}</span>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" value={email}
          onChange={e => setEmail(e.target.value)} required disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" type="password" placeholder="Tối thiểu 8 ký tự" value={password}
          onChange={e => setPassword(e.target.value)} required disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
        <Input id="confirm" type="password" placeholder="Nhập lại mật khẩu" value={confirm}
          onChange={e => setConfirm(e.target.value)} required disabled={loading} />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
      </Button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-red-light via-white to-white px-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-xl">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red font-extrabold text-xl text-white">H</div>
          <span className="font-extrabold text-xl text-gray-900">Huy Tutor <span className="text-brand-red">Flashcard</span></span>
        </Link>
        <h1 className="mb-1 text-center text-2xl font-extrabold">Tạo tài khoản</h1>
        <p className="mb-6 text-center text-sm text-gray-500">Học miễn phí ngay hôm nay</p>
        <Suspense fallback={<div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-red" /></div>}>
          <RegisterForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-bold text-brand-red hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
