"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/features/auth/store";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Shield } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export function SiteHeader() {
  const { user, appUser, loading, signOut, isAdmin } = useAuth();
  const { mode, toggleMode } = useUIStore();

  return (
    <header className="flex items-center justify-between px-[5%] h-[62px] bg-white border-b-[1.5px] border-border sticky top-0 z-[200] flex-shrink-0">
      <Link href={ROUTES.home} className="flex items-center gap-2.5 no-underline">
        <div className="w-9 h-9 bg-brand-red rounded-xl flex items-center justify-center font-extrabold text-white text-lg">H</div>
        <span className="font-extrabold text-[1.05em] text-gray-900 hidden sm:block">
          Huy Tutor <span className="text-brand-red">Flashcard</span>
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {/* Kid mode toggle */}
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
          🎓
          <Switch checked={mode === "kid"} onCheckedChange={toggleMode} />
          🎈
        </label>

        {!loading && (
          <>
            {user ? (
              <>
                <Link href={ROUTES.dashboard}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href={ROUTES.admin.root}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Shield className="h-4 w-4 text-brand-red" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" onClick={signOut} title="Đăng xuất">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href={ROUTES.login}>
                  <Button variant="outline" size="sm">Đăng nhập</Button>
                </Link>
                <Link href={ROUTES.register}>
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
}
