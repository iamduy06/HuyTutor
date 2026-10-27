import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getApiUrl } from "@/lib/apiUrl";
import SubAdminBrandingClient from "./client";

export default async function SubAdminBrandingPage() {
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
    redirect("/subadmin");
  }

  const { hasBrandingAccess } = await res.json();
  if (!hasBrandingAccess) {
    redirect("/subadmin");
  }

  return <SubAdminBrandingClient />;
}
