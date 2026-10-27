import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getApiUrl } from "@/lib/apiUrl";
import {
  Shield
} from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) redirect("/login");

  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/me/profile`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401) redirect("/login");
    redirect("/dashboard");
  }

  const { user } = await res.json();
  if (user?.role !== "ADMIN") redirect("/dashboard");

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
