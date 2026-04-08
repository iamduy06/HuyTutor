"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/common/UserContext";

export function SubAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      console.log("[SUBADMIN_GUARD DEBUG] Checking access:", { 
        id: user?.id, 
        role: user?.role, 
        is_subadmin: user?.is_subadmin 
      });

      const hasAccess = user?.role === "ADMIN" || (user?.role === "SUBADMIN" && user?.is_subadmin);

      if (!hasAccess) {
        console.warn("[SUBADMIN_GUARD] Restricted access. Redirecting to dashboard.");
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  const hasAccess = user?.role === "ADMIN" || (user?.role === "SUBADMIN" && user?.is_subadmin);
  
  if (!hasAccess) {
    return null; // Will be redirected by useEffect
  }

  return <>{children}</>;
}
