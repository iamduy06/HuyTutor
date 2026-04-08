import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function isSubadminOfGroup(userId: string, groupId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("group_users")
    .select("is_subadmin")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("is_subadmin", true)
    .maybeSingle();
  return !!data;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { user_id, deck_id, expired_at, group_id } = body;

  if (!user_id || !deck_id || !group_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. Verify Permission
  const hasPermission = await isSubadminOfGroup(user.id, group_id);
  if (!hasPermission) {
    return NextResponse.json({ error: "Bạn không có quyền quản lý nhóm này" }, { status: 403 });
  }

  const adminSupabase = createAdminClient();

  // 2. Enforce Expiry Constraint
  // Get group's deck expiry
  const { data: groupDeck } = await adminSupabase
    .from("group_decks")
    .select("expired_at")
    .eq("group_id", group_id)
    .eq("deck_id", deck_id)
    .maybeSingle();

  if (!groupDeck) {
    return NextResponse.json({ error: "Bộ đề này chưa được cấp cho Nhóm của bạn" }, { status: 403 });
  }

  if (expired_at) {
    const userExpiry = new Date(expired_at);
    
    if (groupDeck.expired_at) {
      const groupExpiry = new Date(groupDeck.expired_at);
      if (userExpiry > groupExpiry) {
        return NextResponse.json({ 
          error: `Thời hạn của thành viên không được vượt quá thời hạn của Nhóm (${new Date(groupDeck.expired_at).toLocaleDateString("vi-VN")})` 
        }, { status: 400 });
      }
    }
  }

  // 3. Perform Assignment
  const { error } = await adminSupabase.from("user_decks").upsert({
    user_id,
    deck_id,
    expired_at: expired_at || null,
    progress_percent: 0,
    learned_count: 0,
    streak: 0
  }, { onConflict: "user_id,deck_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
