import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import Link from "next/link";
import { SiteHeader } from "@/components/common/SiteHeader";
import { Users, BookOpen, BarChart3, LayoutDashboard } from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
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
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Admin sidebar */}
        <nav className="w-56 bg-white border-r-2 border-border flex-shrink-0 py-4">
          <div className="px-4 mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Panel</span>
          </div>
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-brand-red-light hover:text-brand-red transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
