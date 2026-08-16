import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiClient } from "@/lib/server-api-client";
import SubAdminBrandingClient from "./client";

interface BrandingData {
  groups: { id: string; name: string; branding: any }[];
  isAdmin: boolean;
}

export default async function SubAdminBrandingPage() {
  // Auth check only — no DB query
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All DB access goes through the Express API server
  let brandingData: BrandingData | null = null;
  try {
    brandingData = await serverApiClient.get<BrandingData>("/subadmin/branding");
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg.includes("403") || msg.includes("401")) redirect("/subadmin");
    throw err;
  }

  if (!brandingData) redirect("/subadmin");

  // Admin always has access
  if (brandingData.isAdmin) {
    return <SubAdminBrandingClient />;
  }

  // Subadmin: check if any managed group has allow_custom_branding
  const hasAccess = (brandingData.groups ?? []).some(
    (g) => g.branding?.allow_custom_branding === true
  );

  if (!hasAccess) redirect("/subadmin");

  return <SubAdminBrandingClient />;
}
