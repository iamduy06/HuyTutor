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
    const deckId   = row.id;
    const userList = parseStringArray(row.user); 
    const expireAt = parseDateToISO(row.expire_at);

    if (!deckId) {
      results.push({ id: "N/A", status: "error", error: "Thiếu Deck ID" });
      continue;
    }

    // 1. Verify Deck exists
    const { data: deck } = await supabase.from("decks").select("id").eq("id", deckId).maybeSingle();
    if (!deck) {
      results.push({ id: deckId, status: "error", error: "Bộ đề không tồn tại" });
      continue;
    }

    // 2. Resolve Users
    const resolvedUserIds: string[] = [];
    const userErrors = [];
    for (const uItem of userList) {
      const { data: uData } = await supabase.from("users").select("id").or(`email.eq.${uItem},id.eq.${uItem}`).maybeSingle();
      if (uData) resolvedUserIds.push(uData.id);
      else userErrors.push(uItem);
    }

    if (userErrors.length > 0) {
      results.push({ id: deckId, status: "error", error: `User ko tìm thấy: ${userErrors.join(", ")}` });
      continue;
    }

    // 3. Upsert into user_decks
    if (resolvedUserIds.length > 0) {
      const udRows = resolvedUserIds.map(uid => ({
        user_id: uid,
        deck_id: deckId,
        expired_at: expireAt,
        progress_percent: 0, learned_count: 0, streak: 0
      }));
      await supabase.from("user_decks").upsert(udRows, { onConflict: "user_id,deck_id" });
    }

    results.push({
      id: deckId,
      status: "success",
      message: `Đã gán ${resolvedUserIds.length} users vào bộ đề`,
      usersCount: resolvedUserIds.length
    });
  }

  return NextResponse.json(results);
}
