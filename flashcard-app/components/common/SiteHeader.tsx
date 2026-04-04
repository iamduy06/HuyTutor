"use client";

import Link from "next/link";
import { LogOut, User, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, getSupabaseClient } from "@/components/common/UserContext";
import { useToast } from "@/hooks/use-toast";
import { UIModeToggle } from "@/components/common/UIModeToggle";
import { Logo } from "@/components/common/Logo";

export function SiteHeader() {
  const { user } = useUser();
  const { toast } = useToast();

  async function handleLogout() {
    try {
      // 1. Gọi signOut → Supabase server revoke token
      await getSupabaseClient().auth.signOut();
    } catch {
      // ignore – vẫn tiếp tục xóa cookie client-side
    }

    // 2. Xóa tất cả cookie liên quan đến Supabase session
    //    (tên cookie mặc định của @supabase/ssr dạng sb-<ref>-auth-token*)
    try {
      document.cookie.split(";").forEach(cookie => {
        const name = cookie.split("=")[0].trim();
        if (name.startsWith("sb-") || name.includes("supabase")) {
          // Xóa ở nhiều path/domain để chắc chắn
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        }
      });
    } catch {
      // ignore cookie manipulation errors
    }

    // 3. Hard reload về trang chủ → server render lại với session mới (null)
    //    Dùng window.location.href thay vì router.push để đảm bảo reset hoàn toàn
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-[5%] h-[62px] bg-white border-b-2 border-[#f0e0e7]">
      <Link href="/" className="flex items-center">
        <Logo height={40} />
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
