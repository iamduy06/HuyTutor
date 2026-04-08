import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No user logged in", authError });
  }

  const { data: profile, error: dbError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    userId: user.id,
    profile,
    dbError,
  });
}
