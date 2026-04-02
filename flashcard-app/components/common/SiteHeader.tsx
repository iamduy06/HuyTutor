"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, getSupabaseClient } from "@/components/common/UserContext";
import { useToast } from "@/hooks/use-toast";
import { UIModeToggle } from "@/components/common/UIModeToggle";

export function SiteHeader() {
  const { user, refresh } = useUser();
  const router    = useRouter();
  const { toast } = useToast();

  async function handleLogout() {
    // 1. Gọi signOut trên singleton (cùng instance với UserContext subscription)
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) {
      toast({ title: "Lỗi đăng xuất", description: error.message, variant: "destructive" });
      return;
    }
    // 2. Manually clear user ngay lập tức (không chờ event)
    await refresh(); // refresh() sẽ getUser() → null → setUser(null)
    toast({ title: "Đã đăng xuất" });
    // 3. Redirect + revalidate server cache
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-[5%] h-[62px] bg-white border-b-2 border-[#f0e0e7]">
      <Link href="/" className="flex items-center gap-2.5">
        {/* Logo image */}
        <img
          src="https://drive.google.com/thumbnail?id=1chYG_qCghZCS2li7fgixW8rHcBAL8rPC&sz=w200"
          alt="Huy Tutor"
          className="h-9 w-auto object-contain"
          onError={e => {
            // Fallback nếu image không load được
            (e.target as HTMLImageElement).style.display = "none";
            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div className="w-9 h-9 rounded-xl bg-brand items-center justify-center text-white font-black text-lg hidden" aria-hidden>
          H
        </div>
        <span className="font-extrabold text-[1.05em] text-[#1a1a2e]">
          Huy Tutor <span className="text-brand">Flashcard</span>
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <UIModeToggle />

        {user ? (
          <>
            {user.role === "ADMIN" && (
              <Button variant="brand-outline" size="sm" asChild>
                <Link href="/admin">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile"><User className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button variant="brand" size="sm" asChild>
              <Link href="/register">Đăng ký</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
