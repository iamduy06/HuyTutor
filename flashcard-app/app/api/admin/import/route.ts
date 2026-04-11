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
    const email       = (row.username ?? row.email) as string | undefined;
    const password    = (row.password as string | undefined) || generatePassword(10);
    const role        = ((row.role as string | undefined) ?? "USER").toUpperCase();
    const deckIds     = (row.deck ?? row.decks ?? []) as string[];
    const expiredAt   = (row.expired_at as string | undefined) ?? null;

    if (!email || !email.includes("@")) {
      results.push({ email: email ?? "?", status: "error", error: "Email không hợp lệ" });
      continue;
    }

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
      await supabase.from("users").upsert({ id: userId, email, role }, { onConflict: "id" });
      results.push({ email, status: "created", tempPassword: password });
    }

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
