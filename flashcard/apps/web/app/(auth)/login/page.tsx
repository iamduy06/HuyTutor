import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const supportUrl = process.env.SUPPORT_URL ? process.env.SUPPORT_URL : "";

  return (
    <Suspense fallback={
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <LoginForm supportUrl={supportUrl} />
    </Suspense>
  );
}
