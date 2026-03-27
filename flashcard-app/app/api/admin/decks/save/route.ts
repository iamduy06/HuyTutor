import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: appUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (appUser?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, title, description, level } = await request.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const adminClient = createAdminClient();

  if (id) {
    const { data, error } = await adminClient
      .from("decks")
      .update({ title, description: description || null, level: level || null })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ deck: data });
  } else {
    const { data, error } = await adminClient
      .from("decks")
      .insert({ title, description: description || null, level: level || null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ deck: data });
  }
}
