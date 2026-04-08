import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createAdminClient();

  const { data: subadmins } = await db
    .from("users")
    .select(`
      id, email, role, created_at, max_managed_users, group_id,
      group:groups!group_id(name),
      user_decks(id, deck_id, expired_at, deck:decks(title))
    `)
    .eq("role", "SUBADMIN")
    .order("created_at", { ascending: false });

  // For each subadmin, get count of users they manage
  const result = await Promise.all(
    (subadmins ?? []).map(async (sa: any) => {
      const { count } = await db
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("created_by", sa.id);
      return { ...sa, managed_count: count ?? 0 };
    })
  );

  return NextResponse.json({ subadmins: result });
}
