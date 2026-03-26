import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-brand-light to-[#ffd6e4] p-4">
      <Link href="/" className="flex items-center gap-2 mb-8 no-underline">
        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-black text-xl">H</div>
        <span className="font-extrabold text-xl text-[#1a1a2e]">
          Huy Tutor <span className="text-brand">Flashcard</span>
        </span>
      </Link>
      {children}
    </div>
  );
}
