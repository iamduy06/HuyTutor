"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, getSupabaseClient } from "@/components/common/UserContext";
import { useToast } from "@/hooks/use-toast";
import { UIModeToggle } from "@/components/common/UIModeToggle";
import { Logo } from "@/components/common/Logo";
import { useBranding } from "@/components/common/BrandingContext";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const { toast } = useToast();
  const { branding } = useBranding();

  const isLearningPage = pathname.startsWith("/learning/") || pathname.startsWith("/decks/");
  const showModeToggle = isLearningPage && pathname.split("/").length >= 3;

  if (branding && branding.allow_custom_branding && branding.show_header === false) {
    return null;
  }

  async function handleLogout() {
    try {
      await getSupabaseClient().auth.signOut();
    } catch {
    }

    try {
      document.cookie.split(";").forEach(cookie => {
        const name = cookie.split("=")[0].trim();
        if (name.startsWith("sb-") || name.includes("supabase")) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        }
      });
    } catch {
    }

    window.location.href = "/";
  }

  const customLogoText = branding?.allow_custom_branding ? branding.header_logo_text : null;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-[5%] h-[62px] bg-white border-b-2 border-[#f0e0e7]">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center">
          {customLogoText ? (
            <span className="font-extrabold text-xl text-brand leading-tight">{customLogoText}</span>
          ) : (
            <Logo height={34} />
          )}
        </Link>
        
        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/" className="px-3 py-1.5 rounded-lg text-sm font-bold text-[#6b7280] hover:bg-[#fff0f4] hover:text-[#ed0046] transition-all">
            Trang chủ
          </Link>
          <Link href="/pricing" className="px-3 py-1.5 rounded-lg text-sm font-bold text-[#6b7280] hover:bg-[#fff0f4] hover:text-[#ed0046] transition-all">
            Báo giá
          </Link>
          <Link href="/decks" className="px-3 py-1.5 rounded-lg text-sm font-bold text-[#6b7280] hover:bg-[#fff0f4] hover:text-[#ed0046] transition-all">
            Flashcard
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {showModeToggle && <UIModeToggle />}

        {loading && !user ? (
          <div className="w-10 h-8 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
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
            {user.role === "SUBADMIN" && user.is_subadmin && (
              <Button variant="brand-outline" size="sm" asChild>
                <Link href="/subadmin">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">SubAdmin</span>
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

