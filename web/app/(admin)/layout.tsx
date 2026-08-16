import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiClient } from "@/lib/server-api-client";
import { SiteHeader } from "@/components/common/SiteHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth check only — no DB query
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All DB access goes through the Express API server
  try {
    const { profile } = await serverApiClient.get<{ profile: { role: string } }>("/me/profile");
    if (profile?.role !== "ADMIN") redirect("/dashboard");
  } catch (err: any) {
    // Unauthorized / Forbidden from the API means no access
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        <AdminSidebar />

        <main className="flex-1 bg-[#f8f9fa] min-w-0 pt-[52px] md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
