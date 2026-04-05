import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { generatePassword } from "@/lib/utils";

async function checkSubAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!data || (data.role !== "SUBADMIN" && data.role !== "ADMIN")) return null;
  return data;
}

// GET: List users created by this subadmin
export async function GET() {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  // If ADMIN → all users; if SUBADMIN → only users they created
  let query = admin
    .from("users")
    .select("id, email, role, created_at, created_by, user_decks(id, deck_id, expired_at, deck:decks(title))")
    .order("created_at", { ascending: false });

  if (me.role === "SUBADMIN") {
    query = query.eq("created_by", me.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    users: data ?? [],
    me: {
      id: me.id,
      email: me.email,
      role: me.role,
      max_managed_users: me.max_managed_users ?? 10,
      current_managed: (data ?? []).length,
    },
  });
}

// POST: Create user under this subadmin
export async function POST(request: NextRequest) {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role = "USER" } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // SubADMIN can only create USER or SUBADMIN (not ADMIN)
  if (!["USER", "SUBADMIN"].includes(role)) {
    return NextResponse.json({ error: "SubAdmin cannot create ADMIN" }, { status: 403 });
  }

  // Check max_managed_users limit (only for SUBADMIN)
  if (me.role === "SUBADMIN") {
    const admin = createAdminClient();
    const { count } = await admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("created_by", me.id);

    const max = me.max_managed_users ?? 10;
    if ((count ?? 0) >= max) {
      return NextResponse.json(
        { error: `Đã đạt giới hạn ${max} tài khoản. Liên hệ Admin để tăng giới hạn.` },
        { status: 403 }
      );
    }
  }

  const password = generatePassword(8);
  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const { error: profileError } = await admin.from("users").insert({
    id: authUser.user.id,
    email,
    role,
    created_by: me.id,
  });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ user: authUser.user, tempPassword: password });
}
