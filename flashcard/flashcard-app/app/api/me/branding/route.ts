import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ branding: null });
  }

  const admin = createAdminClient();

  const { data: groupUsers } = await admin
    .from("group_users")
    .select("group_id")
    .eq("user_id", user.id);

  if (!groupUsers || groupUsers.length === 0) {
    return NextResponse.json({ branding: null });
  }

  const groupIds = groupUsers.map((g: any) => g.group_id);

  const { data: groups } = await admin
    .from("groups")
    .select("branding")
    .in("id", groupIds);

  if (!groups) return NextResponse.json({ branding: null });

  const activeBranding = groups
    .map((g: any) => g.branding)
    .find((b: any) => b && b.allow_custom_branding === true);

  return NextResponse.json({ branding: activeBranding ?? null });
}
