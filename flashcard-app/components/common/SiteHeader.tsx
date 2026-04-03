"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, getSupabaseClient } from "@/components/common/UserContext";
import { useToast } from "@/hooks/use-toast";
import { UIModeToggle } from "@/components/common/UIModeToggle";
import { Logo } from "@/components/common/Logo";

export function SiteHeader() {
  const { user, refresh } = useUser();
  const router    = useRouter();
  const { toast } = useToast();

  async function handleLogout() {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) {
      toast({ title: "Lỗi đăng xuất", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
    toast({ title: "Đã đăng xuất" });
    router.push("/");
    router.refresh();
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
