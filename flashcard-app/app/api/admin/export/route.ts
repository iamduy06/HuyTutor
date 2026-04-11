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

/**
 * Helper to convert JSON array to CSV string
 */
function jsonToCsv(items: any[], columns: string[]): string {
  const header = columns.join(",");
  const rows = items.map(item => {
    return columns.map(col => {
      let val = item[col];
      if (val === null || val === undefined) val = "";
      if (typeof val === "object") val = JSON.stringify(val);
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",");
  });
  return [header, ...rows].join("\n");
}

export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type   = request.nextUrl.searchParams.get("type");
  const format = request.nextUrl.searchParams.get("format") ?? "json_full";
  const supabase = createAdminClient();

  // 1. EXPORT GROUPS
  if (type === "groups") {
    const { data: groups } = await supabase.from("groups")
      .select("*, group_users(user_id, is_subadmin, users(email, created_at)), group_decks(deck_id, decks(title, access_level))")
      .order("created_at", { ascending: false });

    // Fetch all user_decks for these users to get their specific IDs in user_deck table (for Full Json requirement)
    const userIds = groups?.flatMap(g => g.group_users.map((gu: any) => gu.user_id)) ?? [];
    const { data: allUserDecks } = await supabase.from("user_decks").select("user_id, deck_id").in("user_id", userIds);

    const exportData = (groups ?? []).map(g => {
      const users = g.group_users.map((gu: any) => {
        const uDecks = (allUserDecks ?? []).filter(ud => ud.user_id === gu.user_id).map(ud => ud.deck_id);
        return {
          email: gu.users?.email,
          role: gu.is_subadmin ? "SUBADMIN" : "USER",
          created_at: gu.users?.created_at,
          decks: uDecks
        };
      });

      const decks = g.group_decks.map((gd: any) => ({
        id: gd.deck_id,
        name: gd.decks?.title,
        access_level: gd.decks?.access_level
      }));

      return {
        id: g.id,
        name: g.name,
        created_at: g.created_at,
        users, // Detailed users for Full JSON
        decks, // Detailed decks for Full JSON
        user_emails: users.map((u: any) => u.email).join(", "),
        deck_titles: decks.map((d: any) => d.name).join(", ")
      };
    });

    if (format === "csv") {
      const csv = jsonToCsv(exportData, ["id", "name", "user_emails", "deck_titles", "created_at"]);
      return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="groups.csv"' } });
    }

    if (format === "json_mini") {
      const mini = exportData.map(g => ({
        ID: g.id,
        user: g.users.map((u: any) => u.email),
        deck: g.decks.map((d: any) => d.id)
      }));
      return NextResponse.json(mini);
    }

    return NextResponse.json(exportData);
  }

  // 2. EXPORT DECKS
  if (type === "decks") {
    const { data: decks } = await supabase.from("decks").select("*").order("created_at", { ascending: false });
    
    if (format === "csv") {
      const csv = jsonToCsv(decks ?? [], ["id", "title", "description", "level", "level_min", "level_max", "access_level", "created_at"]);
      return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="decks.csv"' } });
    }

    if (format === "json_mini") {
      const mini = (decks ?? []).map(d => ({ id: d.id, name: d.title }));
      return NextResponse.json(mini);
    }

    if (format === "json_ids") {
      const ids = (decks ?? []).map(d => d.id);
      return NextResponse.json({ id: ids });
    }

    return NextResponse.json(decks);
  }

  // 3. EXPORT USERS
  if (type === "users") {
    const { data: users } = await supabase.from("users")
      .select("*, user_decks(deck_id, expired_at, decks(title)), user_devices(device_id, device_name, ip_address, last_seen)")
      .order("created_at", { ascending: false });

    const exportData = (users ?? []).map(u => {
      const decks = (u.user_decks ?? []).map((ud: any) => ({
        id: ud.deck_id,
        name: ud.decks?.title,
        expire_at: ud.expired_at
      }));

      const devices = (u.user_devices ?? []).map((dv: any) => ({
        id: dv.device_id,
        name: dv.device_name,
        ip: dv.ip_address,
        last_seen: dv.last_seen
      }));

      return {
        id: u.id,
        email: u.email,
        role: u.role,
        max_device: u.max_devices,
        decks,
        devices,
        deck_ids_str: decks.map((d: any) => `"${d.id}"`).join(", "),
        device_names: devices.map((d: any) => d.name).join(", ")
      };
    });

    if (format === "csv") {
      const csv = jsonToCsv(exportData, ["id", "email", "role", "max_device", "deck_ids_str", "device_names"]);
      return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="users.csv"' } });
    }

    if (format === "json_mini") {
      const mini = exportData.map(u => ({
        id: u.id,
        email: u.email,
        deck: u.decks.map((d: any) => ({ id: d.id }))
      }));
      return NextResponse.json(mini);
    }

    return NextResponse.json(exportData);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
