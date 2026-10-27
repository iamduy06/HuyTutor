import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getApiUrl } from "@/lib/apiUrl";
import { LayoutDashboard, Users, Shield, Paintbrush2 } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";

const baseNavItems = [
  { href: "/subadmin",       label: "Tổng quan",  icon: LayoutDashboard },
  { href: "/subadmin/users", label: "Người dùng", icon: Users },
];

export default async function SubAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) redirect("/login");

  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/subadmin/overview`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/dashboard");
  }

  const { hasBrandingAccess } = await res.json();

  const navItems = [
    ...baseNavItems,
    ...(hasBrandingAccess
      ? [{ href: "/subadmin/branding", label: "Branding", icon: Paintbrush2 }]
      : []),
  ];

  const { SubAdminGuard } = await import("@/components/auth/SubAdminGuard");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        <aside className="w-56 bg-white border-r-2 border-[#f0e0e7] flex-shrink-0 sticky top-[62px] h-[calc(100vh-62px)] hidden md:flex flex-col py-4">
          <div className="px-4 pb-3 border-b border-[#f0e0e7] mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Sub Admin Panel
              </span>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#495057] hover:bg-brand-light hover:text-brand transition-all">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#f0e0e7] flex">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-2 text-xs font-semibold text-muted-foreground hover:text-brand">
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>

        <main className="flex-1 bg-[#f8f9fa] min-w-0 pb-16 md:pb-0">
          <SubAdminGuard>
            {children}
          </SubAdminGuard>
        </main>
      </div>
    </div>
  );
}
