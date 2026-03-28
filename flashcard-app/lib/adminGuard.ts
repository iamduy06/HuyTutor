import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), adminClient: null };

  const { data: appUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (appUser?.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), adminClient: null };

  return { error: null, adminClient: createAdminClient() };
}
