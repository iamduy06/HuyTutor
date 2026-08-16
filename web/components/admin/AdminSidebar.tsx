"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { 
  LayoutDashboard, Users, BookOpen, 
  BarChart3, ArrowLeftRight, Monitor, Shield,
  Upload, Download
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

const navItems: NavItem[] = [
  { href: "/admin",               label: "Tổng quan",     icon: LayoutDashboard },
  { href: "/admin/users",         label: "Người dùng",    icon: Users           },
  { href: "/admin/subadmins",     label: "SubAdmin",      icon: Shield          },
  { href: "/admin/decks",         label: "Flashcard",    icon: BookOpen        },
  { href: "/admin/groupdecks",    label: "Nhóm bộ đề",    icon: ArrowLeftRight  },
  { href: "/admin/devices",       label: "Thiết bị",      icon: Monitor         },
  { href: "/admin/analytics",     label: "Thống kê",      icon: BarChart3       },
  { href: "/admin/import",        label: "Import",        icon: Upload          },
  { href: "/admin/export",        label: "Export",        icon: Download        },
];

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ── Mobile Header / Toggle ── */}
      <div className="md:hidden fixed top-[62px] left-0 right-0 z-40 bg-white border-b-2 border-[#f0e0e7] px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Panel</span>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
          <Menu className="w-5 h-5 text-brand" />
        </Button>
      </div>

      {/* ── Desktop Sidebar ── */}
      <aside className="w-56 bg-white border-r-2 border-[#f0e0e7] flex-shrink-0 sticky top-[62px] h-[calc(100vh-62px)] hidden md:flex flex-col py-4">
        <div className="px-4 pb-3 border-b border-[#f0e0e7] mb-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                pathname === item.href 
                  ? "bg-brand-light text-brand" 
                  : "text-[#495057] hover:bg-brand-light/50 hover:text-brand"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              <ChevronRight className={cn(
                "w-3 h-3 ml-auto transition-opacity",
                pathname === item.href ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )} />
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      <div 
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
        
        {/* Sidebar Content */}
        <aside 
          className={cn(
            "absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b-2 border-[#f0e0e7]">
             <span className="text-sm font-bold text-brand uppercase tracking-wider">Admin Menu</span>
             <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
               <X className="w-5 h-5" />
             </Button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                  pathname === item.href 
                    ? "bg-brand-light text-brand shadow-sm" 
                    : "text-[#495057] hover:bg-brand-light/50"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t border-[#f0e0e7] bg-gray-50">
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
               Huy Tutor Admin
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
