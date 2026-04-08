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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, max_users } = body;
  const supabase = createAdminClient();

  // Validate max_users >= current user count
  if (max_users !== undefined) {
    const { count } = await supabase.from("group_users").select("*", { count: "exact", head: true }).eq("group_id", params.id);
    if (count && max_users < count) {
      return NextResponse.json({ error: `Giới hạn (max_users) không được nhỏ hơn số user hiện tại (${count})` }, { status: 400 });
    }
  }

  const { error } = await supabase.from("groups").update({ name, max_users }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();

  // Double check: Cannot delete group if it still has users
  const { count } = await supabase.from("group_users").select("*", { count: "exact", head: true }).eq("group_id", params.id);
  
  if (count && count > 0) {
    return NextResponse.json({ error: "Không thể xoá nhóm vẫn còn thành viên. Vui lòng di chuyển hoặc xoá vĩnh viễn users trước." }, { status: 400 });
  }

  const { error } = await supabase.from("groups").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
