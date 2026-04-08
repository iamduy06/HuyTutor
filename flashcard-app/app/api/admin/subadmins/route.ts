import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();

  // Load groups with:
  // 1. Group members (users + device info + personal decks count)
  // 2. Group decks (decks shared with the whole group)
  const { data: groups, error } = await supabase
    .from("groups")
    .select(`
      *,
      group_decks(
        deck_id, expired_at, 
        deck:decks(title)
      ),
      group_users(
        is_subadmin,
        user:users(
          id, email, role, created_at, max_devices,
          user_devices!user_devices_user_id_fkey(device_id, device_name, ip_address, last_seen),
          user_decks(deck_id, expired_at, progress_percent, learned_count, deck:decks(title))
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Subadmins fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Process data for UI
  const processed = (groups ?? []).map(g => ({
    ...g,
    user_count: g.group_users?.length || 0,
    group_users: (g.group_users ?? [])
      // Sort SUBADMIN to top
      .sort((a: any, b: any) => {
         if (a.is_subadmin && !b.is_subadmin) return -1;
         if (!a.is_subadmin && b.is_subadmin) return 1;
         return 0;
      })
      .map((gu: any) => {
        const u = gu.user;
        return {
          id: u.id,
          email: u.email,
          role: u.role,
          created_at: u.created_at,
          max_devices: u.max_devices,
          is_group_subadmin: gu.is_subadmin,
          device_count: u.user_devices?.length || 0,
          deck_count: u.user_decks?.length || 0,
          user_devices: u.user_devices || [],
          user_decks: u.user_decks || [],
          decks: (u.user_decks ?? []).map((ud: any) => ({
            id: ud.deck_id,
            title: ud.deck?.title
          }))
        };
      })
  }));

  return NextResponse.json({ groups: processed });
}
