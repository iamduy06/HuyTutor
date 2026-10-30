import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, branding")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ branding: data.branding });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { branding } = body;
  if (!branding || typeof branding !== "object") {
    return NextResponse.json({ error: "branding is required" }, { status: 400 });
  }

  const validBranding = {
    allow_custom_branding: Boolean(branding.allow_custom_branding),
    show_header: Boolean(branding.show_header ?? true),
    show_footer: Boolean(branding.show_footer ?? true),
    header_logo_text: typeof branding.header_logo_text === "string" && branding.header_logo_text.trim()
      ? branding.header_logo_text.trim()
      : null,
  };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("groups")
    .update({ branding: validBranding })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, branding: validBranding });
}
