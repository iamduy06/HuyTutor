import Link from "next/link";
import { Logo } from "@/components/common/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-brand-light to-[#ffd6e4] p-4">
      <Link href="/" className="flex items-center mb-8">
        <Logo height={56} />
      </Link>
      {children}
    </div>
  );
}
