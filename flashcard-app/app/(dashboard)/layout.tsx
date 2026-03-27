import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { SiteHeader } from "@/components/common/SiteHeader";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <footer className="text-center py-4 text-muted-foreground text-xs border-t bg-white">
        © Bản quyền thuộc về <strong>Huy Tutor</strong>
      </footer>
    </div>
  );
}
