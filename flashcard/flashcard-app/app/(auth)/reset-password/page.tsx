import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8 flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
