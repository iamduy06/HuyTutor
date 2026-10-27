import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import SubAdminBrandingClient from "./client";

export default async function SubAdminBrandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "ADMIN") {
    return <SubAdminBrandingClient />;
  }

  if (profile?.role !== "SUBADMIN") redirect("/subadmin");

  const { data: managedGroups } = await supabase
    .from("group_users")
    .select("group_id")
    .eq("user_id", user.id)
    .eq("is_subadmin", true);

  if (!managedGroups || managedGroups.length === 0) redirect("/subadmin");

  const groupIds = managedGroups.map((g: any) => g.group_id);
  const adminClient = createAdminClient();
  const { data: brandingGroups } = await adminClient
    .from("groups")
    .select("branding")
    .in("id", groupIds);

  const hasAccess = (brandingGroups ?? []).some(
    (g: any) => g.branding?.allow_custom_branding === true
  );

  if (!hasAccess) redirect("/subadmin");

  return <SubAdminBrandingClient />;
}
