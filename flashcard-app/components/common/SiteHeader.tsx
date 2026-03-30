"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/common/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UIModeToggle } from "@/components/common/UIModeToggle";

export function SiteHeader() {
  // user/loading từ Context — không bao giờ reset khi navigate
  const { user, loading } = useUser();
  const router  = useRouter();
  const { toast } = useToast();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Context sẽ tự reset user về null qua onAuthStateChange
    toast({ title: "Đã đăng xuất" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-[5%] h-[62px] bg-white border-b-2 border-[#f0e0e7]">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-black text-lg">H</div>
        <span className="font-extrabold text-[1.05em] text-[#1a1a2e]">
          Huy Tutor <span className="text-brand">Flashcard</span>
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <UIModeToggle />

        {/* Chỉ ẩn hoàn toàn khi đang load lần đầu (< 300ms thường) */}
        {loading ? (
          <div className="w-24 h-8 rounded-full bg-gray-100 animate-pulse" />
        ) : user ? (
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
