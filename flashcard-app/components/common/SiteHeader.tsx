"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/features/auth/uiStore";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { LogOut, LayoutDashboard, Shield } from "lucide-react";

export function SiteHeader() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { mode, toggle } = useUIStore();

  return (
    <header className="sticky top-0 z-50 flex h-[62px] items-center justify-between border-b-2 border-gray-100 bg-white px-[5%]">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-red font-extrabold text-lg text-white">H</div>
        <span className="hidden font-extrabold text-gray-900 sm:block">
          Huy Tutor <span className="text-brand-red">Flashcard</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-500">
          🎓 <Switch checked={mode === "kid"} onCheckedChange={toggle} /> 🎈
        </label>

        {!loading && (
          <>
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Shield className="h-4 w-4 text-brand-red" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" onClick={signOut} title="Đăng xuất">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"><Button variant="outline" size="sm">Đăng nhập</Button></Link>
                <Link href="/register"><Button size="sm">Đăng ký</Button></Link>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
