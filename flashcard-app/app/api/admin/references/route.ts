import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const supabase = createAdminClient();
    
    const [decksRes, groupsRes] = await Promise.all([
      supabase.from("decks").select("id, title").order("title"),
      supabase.from("groups").select("id, name").order("name")
    ]);

    return NextResponse.json({
      decks: decksRes.data ?? [],
      groups: groupsRes.data ?? [],
      error: decksRes.error || groupsRes.error
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
