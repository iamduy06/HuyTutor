import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const shopUrl = process.env.SHOP_URL ? process.env.SHOP_URL : "";
  const supportUrl = process.env.SUPPORT_URL ? process.env.SUPPORT_URL : "";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 bg-[#f8f9fa]">{children}</main>
      <SiteFooter shopUrl={shopUrl} supportUrl={supportUrl} />
    </div>
  );
}
