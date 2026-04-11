import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { parseDateToISO, parseStringArray } from "@/lib/import-utils";
import { generatePassword } from "@/lib/utils";

const DEFAULT_GROUP_ID = "159b18f1-f6de-4567-b83a-6cffcc287438";
const RESTRICTED_GROUPS = [
  "00ba87df-2e06-454d-96db-e0039680b7c3",
  "159b18f1-f6de-4567-b83a-6cffcc287438"
];

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = Array.isArray(body) ? body : [body];
  const supabase = createAdminClient();
  const results = [];

  for (const row of rows) {
    const email       = row.email;
    const password    = row.password || "goidangkyflashcard";
    const groupId     = row.group_id || DEFAULT_GROUP_ID;
    const role        = (row.role || "USER").toUpperCase();
    const deckList    = parseStringArray(row.deck);
    const expireAt    = parseDateToISO(row.expire_at);

    if (!email || !email.includes("@")) {
      results.push({ email: email || "N/A", status: "error", error: "Email không hợp lệ" });
      continue;
    }

    // 1. Validation for SUBADMIN
    if (role === "SUBADMIN") {
      if (RESTRICTED_GROUPS.includes(groupId)) {
        results.push({ email, status: "error", error: "SUBADMIN không được thuộc nhóm hệ thống mặc định" });
        continue;
      }
      
      const { data: group } = await supabase.from("groups").select("is_system").eq("id", groupId).maybeSingle();
      if (!group || group.is_system) {
        results.push({ email, status: "error", error: "SUBADMIN phải thuộc nhóm người dùng (is_system=false)" });
        continue;
      }
    } else {
       // Ensure group exists even for normal users
       const { data: groupEx } = await supabase.from("groups").select("id").eq("id", groupId).maybeSingle();
       if (!groupEx) {
         results.push({ email, status: "error", error: "Group ID không tồn tại" });
         continue;
       }
    }

    // 2. Create/Resolve User
    let userId: string;
    const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    
    if (existing) {
      userId = existing.id;
      // Update role and current profile if needed
      await supabase.from("users").update({ role }).eq("id", userId);
    } else {
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true
      });
      if (authErr || !authUser.user) {
        results.push({ email, status: "error", error: authErr?.message || "Lỗi tạo tài khoản" });
        continue;
      }
      userId = authUser.user.id;
      await supabase.from("users").upsert({ id: userId, email, role }, { onConflict: "id" });
    }

    // 3. Assign to Group
    await supabase.from("group_users").upsert({ group_id: groupId, user_id: userId }, { onConflict: "group_id,user_id" });

    // 4. Assign Decks
    const resolvedDeckIds: string[] = [];
    const deckErrors = [];
    for (const dItem of deckList) {
      const { data: dData } = await supabase.from("decks").select("id").eq("id", dItem).maybeSingle();
      if (dData) resolvedDeckIds.push(dData.id);
      else deckErrors.push(dItem);
    }

    if (resolvedDeckIds.length > 0) {
      const udRows = resolvedDeckIds.map(did => ({
        user_id: userId,
        deck_id: did,
        expired_at: expireAt,
        progress_percent: 0, learned_count: 0, streak: 0
      }));
      await supabase.from("user_decks").upsert(udRows, { onConflict: "user_id,deck_id" });
    }

    results.push({
      email,
      status: "success",
      message: deckErrors.length > 0 ? `Tạo mới xong, nhưng ko tìm thấy decks: ${deckErrors.join(", ")}` : "Thành công",
      tempPassword: existing ? undefined : password,
      groupId
    });
  }

  return NextResponse.json(results);
}
