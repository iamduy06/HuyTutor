"use client";

import { useSubadmin } from "@/hooks/use-subadmin";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function SubAdminGuard({ children }: { children: ReactNode }) {
  const { loading, canAccessPanel } = useSubadmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !canAccessPanel) {
      router.push("/dashboard");
    }
  }, [loading, canAccessPanel, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang xác thực quyền SubAdmin...</p>
      </div>
    );
  }

  // If not loading, but user is definitely not allowed, show nothing while redirect happens
  if (!canAccessPanel) {
    return null;
  }

  return <>{children}</>;
}
