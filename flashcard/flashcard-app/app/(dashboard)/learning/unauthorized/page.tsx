import Link from "next/link";
import { ShieldX } from "lucide-react";
import { FACEBOOK_URL } from "@/lib/constants";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] px-4 py-20 text-center gap-6">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 border-2 border-red-200">
        <ShieldX className="w-10 h-10 text-red-500" />
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <h1 className="text-2xl font-extrabold text-[#1a1a2e]">
          Bạn không có quyền truy cập vào Flashcard này
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Bộ Flashcard này yêu cầu quyền truy cập đặc biệt. Vui lòng liên hệ{" "}
          <Link
            href={FACEBOOK_URL}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-brand underline underline-offset-2 hover:text-brand-dark transition-colors"
          >
            Huy Tutor
          </Link>{" "}
          để được hỗ trợ và cấp quyền.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={FACEBOOK_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow"
        >
          📩 Liên hệ Huy Tutor
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border-2 border-brand text-brand font-semibold text-sm hover:bg-brand-light transition-colors"
        >
          ← Quay lại Dashboard
        </Link>
      </div>
    </div>
  );
}
