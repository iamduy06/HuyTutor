import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function getSubAdminGroups() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, groupIds: [], isAdmin: false };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return { user: null, groupIds: [], isAdmin: false };

  const isAdmin = profile.role === "ADMIN";
  if (isAdmin) {
    const admin = createAdminClient();
    const { data: allGroups } = await admin.from("groups").select("id");
    return { user, groupIds: (allGroups ?? []).map((g: any) => g.id), isAdmin: true };
  }

  if (profile.role !== "SUBADMIN") return { user: null, groupIds: [], isAdmin: false };

  const { data: myGroups } = await supabase
    .from("group_users")
    .select("group_id")
    .eq("user_id", user.id)
    .eq("is_subadmin", true);

  return {
    user,
    groupIds: (myGroups ?? []).map((g: any) => g.group_id),
    isAdmin: false,
  };
}

export async function GET() {
  const { user, groupIds, isAdmin } = await getSubAdminGroups();
  if (!user || groupIds.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: groups, error } = await admin
    .from("groups")
    .select("id, name, branding")
    .in("id", groupIds)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ groups: groups ?? [], isAdmin });
}

export async function PATCH(req: NextRequest) {
  const { user, groupIds, isAdmin } = await getSubAdminGroups();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { group_id, show_header, show_footer, header_logo_text } = body;

  if (!group_id || !groupIds.includes(group_id)) {
    return NextResponse.json({ error: "Forbidden: không có quyền quản lý nhóm này" }, { status: 403 });
  }

  const adminClient = createAdminClient();

  const { data: group, error: fetchErr } = await adminClient
    .from("groups")
    .select("branding")
    .eq("id", group_id)
    .single();

  if (fetchErr || !group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const currentBranding = (group.branding ?? {}) as Record<string, any>;

  if (!currentBranding.allow_custom_branding && !isAdmin) {
    return NextResponse.json({ error: "Tính năng branding chưa được admin kích hoạt cho nhóm này" }, { status: 403 });
  }

  const updatedBranding = {
    ...currentBranding,
    show_header: typeof show_header === "boolean" ? show_header : currentBranding.show_header ?? true,
    show_footer: typeof show_footer === "boolean" ? show_footer : currentBranding.show_footer ?? true,
    header_logo_text: typeof header_logo_text === "string" && header_logo_text.trim()
      ? header_logo_text.trim()
      : null,
  };

  const { error } = await adminClient
    .from("groups")
    .update({ branding: updatedBranding })
    .eq("id", group_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, branding: updatedBranding });
}
