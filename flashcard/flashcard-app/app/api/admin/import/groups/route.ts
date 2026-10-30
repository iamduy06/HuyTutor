import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { parseDateToISO, parseStringArray } from "@/lib/import-utils";

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
    const groupId   = row.id;
    const userList  = parseStringArray(row.users);
    const deckList  = parseStringArray(row.decks);
    const expireAt  = parseDateToISO(row.expire_at);
    const assignAll = String(row.assign_all).toLowerCase() === "true";

    if (!groupId) {
      results.push({ id: "N/A", status: "error", error: "Thiếu Group ID" });
      continue;
    }

    // 1. Verify Group exists
    const { data: group, error: gErr } = await supabase.from("groups").select("id").eq("id", groupId).maybeSingle();
    if (gErr || !group) {
      results.push({ id: groupId, status: "error", error: "Nhóm không tồn tại" });
      continue;
    }

    // 2. Resolve Users (Emails or IDs)
    const resolvedUserIds: string[] = [];
    const userErrors = [];
    for (const uItem of userList) {
      const { data: uData } = await supabase.from("users").select("id").or(`email.eq.${uItem},id.eq.${uItem}`).maybeSingle();
      if (uData) resolvedUserIds.push(uData.id);
      else userErrors.push(uItem);
    }

    // 3. Resolve Decks
    const resolvedDeckIds: string[] = [];
    const deckErrors = [];
    for (const dItem of deckList) {
      const { data: dData } = await supabase.from("decks").select("id").eq("id", dItem).maybeSingle();
      if (dData) resolvedDeckIds.push(dData.id);
      else deckErrors.push(dItem);
    }

    const errors = [];
    if (userErrors.length > 0) errors.push(`User ko tìm thấy: ${userErrors.join(", ")}`);
    if (deckErrors.length > 0) errors.push(`Deck ko tìm thấy: ${deckErrors.join(", ")}`);

    if (errors.length > 0) {
      results.push({ id: groupId, status: "error", error: errors.join(" | ") });
      continue;
    }

    // 4. Update Group users
    if (resolvedUserIds.length > 0) {
      const guRows = resolvedUserIds.map(uid => ({ group_id: groupId, user_id: uid }));
      await supabase.from("group_users").upsert(guRows, { onConflict: "group_id,user_id" });
    }

    // 5. Update Group decks
    if (resolvedDeckIds.length > 0) {
      const gdRows = resolvedDeckIds.map(did => ({ group_id: groupId, deck_id: did, expired_at: expireAt }));
      await supabase.from("group_decks").upsert(gdRows, { onConflict: "group_id,deck_id" });
    }

    // 6. Assign All logic
    if (assignAll && resolvedUserIds.length > 0 && resolvedDeckIds.length > 0) {
      const udRows: any[] = [];
      resolvedUserIds.forEach(uid => {
        resolvedDeckIds.forEach(did => {
          udRows.push({
            user_id: uid,
            deck_id: did,
            expired_at: expireAt,
            progress_percent: 0, learned_count: 0, streak: 0
          });
        });
      });
      await supabase.from("user_decks").upsert(udRows, { onConflict: "user_id,deck_id" });
    }

    results.push({
      id: groupId,
      status: "success",
      message: `Đã cập nhật ${resolvedUserIds.length} users và ${resolvedDeckIds.length} decks`,
      usersCount: resolvedUserIds.length,
      decksCount: resolvedDeckIds.length
    });
  }

  return NextResponse.json(results);
}
