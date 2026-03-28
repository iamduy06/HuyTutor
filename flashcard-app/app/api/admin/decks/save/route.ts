import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, title, description, level } = await request.json() as {
    id?: string; title: string; description?: string | null; level?: string | null;
  };
  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const admin = createAdminClient();
  const payload = { title: title.trim(), description: description ?? null, level: level ?? null };

  if (id) {
    const { data, error } = await admin.from("decks").update(payload).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ deck: data });
  }

  const { data, error } = await admin.from("decks").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deck: data });
}
