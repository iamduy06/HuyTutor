import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deckId = request.nextUrl.searchParams.get("deck_id");
  if (!deckId) return NextResponse.json({ error: "deck_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_decks")
    .select("streak, learned_count, progress_percent, last_studied_at")
    .eq("user_id", user.id)
    .eq("deck_id", deckId)
    .maybeSingle();

  return NextResponse.json({ progress: data ?? null });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deck_id, learned_count, progress_percent } = await request.json();
  if (!deck_id) return NextResponse.json({ error: "deck_id required" }, { status: 400 });

  const admin = createAdminClient();

  // Kiểm tra quyền: lấy deck access_level và record user_decks hiện tại song song
  const [{ data: deck }, { data: existing }] = await Promise.all([
    admin.from("decks").select("access_level").eq("id", deck_id).single(),
    admin.from("user_decks").select("streak, last_studied_at").eq("user_id", user.id).eq("deck_id", deck_id).maybeSingle(),
  ]);

  if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

  const levels = (deck.access_level ?? {}) as { public?: boolean; auth?: boolean; paid?: boolean };
  const isFreeAccess = levels.public === true || levels.auth === true;
  const isPaidOnly = levels.paid === true && !isFreeAccess;

  // Nếu là paid-only deck và user chưa có record (chưa được cấp quyền) → từ chối
  if (isPaidOnly && !existing) {
    return NextResponse.json({ error: "Forbidden: no access" }, { status: 403 });
  }

  const now = new Date();
  const lastStudied = existing?.last_studied_at ? new Date(existing.last_studied_at) : null;
  let streak = existing?.streak ?? 0;

  if (lastStudied) {
    const todayDay = new Date(now.toDateString()).getTime();
    const lastDay = new Date(lastStudied.toDateString()).getTime();
    const diffDays = (todayDay - lastDay) / (1000 * 60 * 60 * 24);

    if (diffDays === 0) {
      // Cùng ngày — giữ nguyên streak
    } else if (diffDays === 1) {
      // Hôm qua — tăng streak
      streak += 1;
    } else {
      // Bỏ lỡ ngày — reset
      streak = 1;
    }
  } else {
    streak = 1;
  }

  const { error } = await admin.from("user_decks").upsert({
    user_id: user.id,
    deck_id,
    learned_count: Math.max(learned_count ?? 0, existing ? 0 : 0),
    progress_percent: progress_percent ?? 0,
    streak,
    last_studied_at: now.toISOString(),
  }, { onConflict: "user_id,deck_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, streak });
}
