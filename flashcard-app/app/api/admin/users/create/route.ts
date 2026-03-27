import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { generatePassword } from "@/lib/utils";

export async function POST(request: NextRequest) {
  // Auth check — must be admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: appUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (appUser?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role = "USER" } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const password = generatePassword(8);
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Insert into public.users
  await adminClient.from("users").upsert({
    id: data.user.id,
    email,
    role,
  });

  const newUser = await adminClient.from("users").select("*").eq("id", data.user.id).single();

  return NextResponse.json({ user: newUser.data, password });
}
