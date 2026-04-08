"use client";

import { useUser } from "@/components/common/UserContext";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function SubAdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if NOT loading AND permission is invalid
    if (!loading) {
      if (!user || (user.role !== "SUBADMIN" && user.role !== "ADMIN")) {
        router.push("/dashboard");
      } else if (user.role === "SUBADMIN" && !user.is_subadmin) {
         // Subadmin role but no specific group permission
         router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang xác thực quyền SubAdmin...</p>
      </div>
    );
  }

  // If not loading, but user is definitely not allowed, show nothing while redirect happens
  if (!user || (user.role !== "SUBADMIN" && user.role !== "ADMIN") || (user.role === "SUBADMIN" && !user.is_subadmin)) {
    return null;
  }

  return <>{children}</>;
}
