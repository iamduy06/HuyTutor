import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createAdminClient();

  // 1. Get all groups where current user is a subadmin
  const { data: managedGroups, error: groupError } = await adminSupabase
    .from("group_users")
    .select("group_id, groups(id, name, description, max_users)")
    .eq("user_id", user.id)
    .eq("is_subadmin", true);

  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 });
  if (!managedGroups || managedGroups.length === 0) {
     return NextResponse.json({ usersByGroup: [] });
  }

  const groupIds = managedGroups.map(mg => mg.group_id);

  // 2. Get all users belonging to these groups
  // We join with group_users to find all members of the subadmin's groups
  const { data: members, error: membersError } = await adminSupabase
    .from("group_users")
    .select(`
      user_id,
      group_id,
      is_subadmin,
      user:users(id, email, role, created_at, user_decks(id, deck_id, expired_at, deck:decks(title)))
    `)
    .in("group_id", groupIds);

  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  // 3. Format result
  const result = managedGroups.map(mg => {
    const groupUsers = members
      .filter(m => m.group_id === mg.group_id)
      .map(m => ({
        ...m.user,
        is_subadmin_in_group: m.is_subadmin
      }));

    return {
      id: mg.group_id,
      name: (mg.groups as any)?.name,
      description: (mg.groups as any)?.description,
      max_users: (mg.groups as any)?.max_users,
      users: groupUsers
    };
  });

  return NextResponse.json({ groups: result });
}
