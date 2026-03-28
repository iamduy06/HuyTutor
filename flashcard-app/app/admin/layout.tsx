import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { SiteHeader } from "@/components/common/SiteHeader";
import Link from "next/link";
import { Users, BookOpen, BarChart3, LayoutDashboard } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/decks", label: "Bộ đề", icon: BookOpen },
  { href: "/admin/analytics", label: "Thống kê", icon: BarChart3 },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: appUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (appUser?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden">
        <nav className="w-52 flex-shrink-0 border-r-2 border-gray-100 bg-white py-4">
          <div className="mb-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">Admin</div>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-brand-red-light hover:text-brand-red">
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
