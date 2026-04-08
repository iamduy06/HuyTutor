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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { max_users, name } = await request.json();
  const supabase = createAdminClient();

  const updates: any = {};
  if (max_users !== undefined) updates.max_users = max_users;
  if (name !== undefined) updates.name = name;

  const { error } = await supabase
    .from("groups")
    .update(updates)
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  
  // Custom logic to handle orphaned users could go here, 
  // but usually groups have users. We set them to null in DB.
  await supabase.from("users").update({ group_id: null }).eq("group_id", params.id);

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
