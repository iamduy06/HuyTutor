import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard, Users, BookOpen,
  BarChart3, ChevronRight, ArrowLeftRight, Monitor
} from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";

const navItems = [
  { href: "/admin",               label: "Tổng quan",     icon: LayoutDashboard },
  { href: "/admin/users",         label: "Người dùng",    icon: Users           },
  { href: "/admin/decks",         label: "Bộ đề",         icon: BookOpen        },
  { href: "/admin/devices",       label: "Thiết bị",      icon: Monitor         },
  { href: "/admin/analytics",     label: "Thống kê",      icon: BarChart3       },
  { href: "/admin/import-export", label: "Import/Export", icon: ArrowLeftRight  },
];

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
        {/* Desktop sidebar */}
        <aside className="w-56 bg-white border-r-2 border-[#f0e0e7] flex-shrink-0 sticky top-[62px] h-[calc(100vh-62px)] hidden md:flex flex-col py-4">
          <div className="px-4 pb-3 border-b border-[#f0e0e7] mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Panel</span>
          </div>
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#495057] hover:bg-brand-light hover:text-brand transition-all group"
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#f0e0e7] flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-muted-foreground hover:text-brand transition-colors">
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold truncate w-full text-center px-0.5">{item.label}</span>
            </Link>
          ))}
        </div>

        <main className="flex-1 bg-[#f8f9fa] min-w-0 pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
