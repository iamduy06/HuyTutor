"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/components/common/UserContext";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const nextUrl = pathname ? `/login?next=${encodeURIComponent(pathname)}` : "/login";
      router.replace(nextUrl);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Đang xác thực thông tin tài khoản...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-muted-foreground">
          Đang chuyển hướng đến trang đăng nhập...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
