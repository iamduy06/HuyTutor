import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Shield
} from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/dashboard");

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
