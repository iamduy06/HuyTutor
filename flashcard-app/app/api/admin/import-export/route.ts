import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { generatePassword } from "@/lib/utils";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

// ── EXPORT ───────────────────────────────────────────────────────────────────
// GET /api/admin/import-export?type=users | decks | all
export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = request.nextUrl.searchParams.get("type") ?? "all";
  const supabase = createAdminClient();

  if (type === "users" || type === "all") {
    const { data: users } = await supabase
      .from("users")
      .select("id, email, role, created_at")
      .order("created_at");

    const { data: userDecks } = await supabase
      .from("user_decks")
      .select("user_id, deck_id, expired_at, progress_percent, learned_count, streak");

    // Build export format: { username, deck: ["id1","id2",...] }
    const decksByUser: Record<string, string[]> = {};
    (userDecks ?? []).forEach(ud => {
      if (!decksByUser[ud.user_id]) decksByUser[ud.user_id] = [];
      decksByUser[ud.user_id].push(ud.deck_id);
    });

    const exportUsers = (users ?? []).map(u => ({
      email:      u.email,
      role:       u.role,
      created_at: u.created_at,
      decks:      decksByUser[u.id] ?? [],
    }));

    if (type === "users") {
      return NextResponse.json(exportUsers, {
        headers: { "Content-Disposition": "attachment; filename=users.json" },
      });
    }

    // type === "all" → return both
    const { data: decks } = await supabase
      .from("decks")
      .select("id, title, description, level, created_at")
      .order("created_at");

    return NextResponse.json(
      { users: exportUsers, decks: decks ?? [] },
      { headers: { "Content-Disposition": "attachment; filename=flashcard-export.json" } }
    );
  }

  if (type === "decks") {
    const { data: decks } = await supabase
      .from("decks")
      .select("id, title, description, level, created_at")
      .order("created_at");
    return NextResponse.json(decks ?? [], {
      headers: { "Content-Disposition": "attachment; filename=decks.json" },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

// ── IMPORT ───────────────────────────────────────────────────────────────────
// POST /api/admin/import-export
// Body: JSON array of users:
// [
//   {
//     "username": "user@email.com",   // hoặc "email"
//     "password": "optional",         // nếu không có → tự gen
//     "deck": ["deck-id-1", "deck-id-2"],  // hoặc "decks"
//     "role": "USER" | "ADMIN",       // optional, default USER
//     "expired_at": "2025-12-31"     // optional
//   }
// ]
export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = Array.isArray(body) ? body : [body];
  const supabase = createAdminClient();

  const results: { email: string; status: "created" | "skipped" | "error"; tempPassword?: string; error?: string }[] = [];

  for (const row of rows as Record<string, unknown>[]) {
    // Hỗ trợ cả "username" và "email" field
    const email       = (row.username ?? row.email) as string | undefined;
    const password    = (row.password as string | undefined) || generatePassword(10);
    const role        = ((row.role as string | undefined) ?? "USER").toUpperCase();
    const deckIds     = (row.deck ?? row.decks ?? []) as string[];
    const expiredAt   = (row.expired_at as string | undefined) ?? null;

    if (!email || !email.includes("@")) {
      results.push({ email: email ?? "?", status: "error", error: "Email không hợp lệ" });
      continue;
    }

    // Kiểm tra email đã tồn tại chưa
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let userId: string;

    if (existing) {
      userId = existing.id;
      results.push({ email, status: "skipped" });
    } else {
      // Tạo auth user
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authErr || !authUser.user) {
        results.push({ email, status: "error", error: authErr?.message ?? "Auth error" });
        continue;
      }

      userId = authUser.user.id;

      // Tạo profile
      await supabase.from("users").upsert({ id: userId, email, role }, { onConflict: "id" });
      results.push({ email, status: "created", tempPassword: password });
    }

    // Gán decks
    if (deckIds.length > 0) {
      const upsertRows = deckIds.map(deckId => ({
        user_id:          userId,
        deck_id:          deckId,
        expired_at:       expiredAt,
        progress_percent: 0,
        learned_count:    0,
        streak:           0,
      }));

      await supabase.from("user_decks").upsert(upsertRows, { onConflict: "user_id,deck_id" });
    }
  }

  const created = results.filter(r => r.status === "created").length;
  const skipped = results.filter(r => r.status === "skipped").length;
  const errors  = results.filter(r => r.status === "error").length;

  return NextResponse.json({
    summary: { total: rows.length, created, skipped, errors },
    results,
  });
}
