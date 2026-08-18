import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (data?.role !== "ADMIN") return null;
  return user;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data: rawGroups, error } = await supabase
    .from("groups")
    .select("*, group_decks(expired_at)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const groups = rawGroups?.map((g: any) => {
    let maxExpiry = null;
    const upperName = g.name.trim().toUpperCase();
    
    if (upperName === "ĐĂNG KÝ 6 THÁNG") {
      const now = new Date(); now.setMonth(now.getMonth() + 6);
      maxExpiry = now.toISOString().split('T')[0];
    } else if (upperName === "ĐĂNG KÝ 1 NĂM") {
      const now = new Date(); now.setFullYear(now.getFullYear() + 1);
      maxExpiry = now.toISOString().split('T')[0];
    } else if (upperName === "ĐĂNG KÝ 2 NĂM") {
      const now = new Date(); now.setFullYear(now.getFullYear() + 2);
      maxExpiry = now.toISOString().split('T')[0];
    } else if (upperName === "ĐĂNG KÝ 3 NĂM") {
      const now = new Date(); now.setFullYear(now.getFullYear() + 3);
      maxExpiry = now.toISOString().split('T')[0];
    } else if (g.group_decks && g.group_decks.length > 0) {
      const expiries = g.group_decks
        .map((gd: any) => gd.expired_at)
        .filter(Boolean)
        .map((dateStr: string) => new Date(dateStr).getTime());
      if (expiries.length > 0) {
        maxExpiry = new Date(Math.max(...expiries)).toISOString().split('T')[0];
      }
    }
    
    const { group_decks, ...rest } = g;
    return { ...rest, max_expired_at: maxExpiry };
  }) || [];

  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, description } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: newGroup, error } = await supabase
    .from("groups")
    .insert({ name, description })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: newGroup });
}
