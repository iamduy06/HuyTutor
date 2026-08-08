import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import * as XLSX from "xlsx";

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

/**
 * Helper to convert JSON array to XLSX Response
 */
function xlsxResponse(items: any[], filename: string): Response {
  const worksheet = XLSX.utils.json_to_sheet(items);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
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
      return new Response("\ufeff" + csv, { 
        headers: { 
          "Content-Type": "text/csv; charset=utf-8", 
          "Content-Disposition": 'attachment; filename="groups.csv"' 
        } 
      });
    }

    if (format === "json_mini") {
      const mini = exportData.map(g => ({
        ID: g.id,
        user: g.users.map((u: any) => u.email),
        deck: g.decks.map((d: any) => d.id)
      }));
      return new Response(JSON.stringify(mini, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. EXPORT DECKS
  if (type === "decks") {
    const { data: decks } = await supabase.from("decks").select("*").order("created_at", { ascending: false });
    
    if (format === "csv") {
      const csv = jsonToCsv(decks ?? [], ["id", "title", "description", "level", "level_min", "level_max", "access_level", "created_at"]);
      return new Response("\ufeff" + csv, { 
        headers: { 
          "Content-Type": "text/csv; charset=utf-8", 
          "Content-Disposition": 'attachment; filename="decks.csv"' 
        } 
      });
    }

    if (format === "json_mini") {
      const mini = (decks ?? []).map(d => ({ id: d.id, name: d.title }));
      return new Response(JSON.stringify(mini, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (format === "json_ids") {
      const ids = (decks ?? []).map(d => d.id);
      return new Response(JSON.stringify({ id: ids }, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(decks, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
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
      return new Response("\ufeff" + csv, { 
        headers: { 
          "Content-Type": "text/csv; charset=utf-8", 
          "Content-Disposition": 'attachment; filename="users.csv"' 
        } 
      });
    }

    if (format === "json_mini") {
      const mini = exportData.map(u => ({
        id: u.id,
        email: u.email,
        deck: u.decks.map((d: any) => ({ id: d.id }))
      }));
      return new Response(JSON.stringify(mini, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // 4. EXPORT EMAILS
  if (type === "emails") {
    const subtype = request.nextUrl.searchParams.get("subtype");

    if (subtype === "all") {
      const { data: users } = await supabase
        .from("users")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false });

      const rows = (users ?? []).map((u, i) => ({
        "STT": i + 1,
        "Email": u.email,
        "Role": u.role,
        "Created At": u.created_at
      }));

      if (format === "csv") {
        const csv = jsonToCsv(rows, ["STT", "Email", "Role", "Created At"]);
        return new Response("\ufeff" + csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="all_emails.csv"'
          }
        });
      }

      if (format === "xlsx") {
        return xlsxResponse(rows, "all_emails");
      }

      return new Response(JSON.stringify(users ?? [], null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (subtype === "by_group") {
      const { data: groups } = await supabase
        .from("groups")
        .select("id, name, created_at, group_users(user_id, is_subadmin, users(id, email, role, created_at))")
        .order("created_at", { ascending: false });

      const rows: any[] = [];
      (groups ?? []).forEach(g => {
        (g.group_users ?? []).forEach((gu: any) => {
          rows.push({
            "Group ID": g.id,
            "Group Name": g.name,
            "User Email": gu.users?.email ?? "",
            "Role In Group": gu.is_subadmin ? "SUBADMIN" : "MEMBER",
            "Account Role": gu.users?.role ?? "",
            "Created At": gu.users?.created_at ?? ""
          });
        });
      });

      if (format === "csv") {
        const csv = jsonToCsv(rows, ["Group ID", "Group Name", "User Email", "Role In Group", "Account Role", "Created At"]);
        return new Response("\ufeff" + csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="emails_by_group.csv"'
          }
        });
      }

      if (format === "xlsx") {
        return xlsxResponse(rows, "emails_by_group");
      }

      return new Response(JSON.stringify(rows, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Default or full json: return combined emails & groups data
    const [{ data: users }, { data: groups }] = await Promise.all([
      supabase.from("users").select("id, email, role, created_at").order("created_at", { ascending: false }),
      supabase.from("groups").select("id, name, created_at, group_users(user_id, is_subadmin, users(id, email, role, created_at))").order("created_at", { ascending: false })
    ]);

    const formattedGroups = (groups ?? []).map(g => {
      const groupUsers = (g.group_users ?? []).map((gu: any) => ({
        id: gu.users?.id,
        email: gu.users?.email,
        role: gu.users?.role,
        is_subadmin: gu.is_subadmin
      }));
      return {
        id: g.id,
        name: g.name,
        created_at: g.created_at,
        user_count: groupUsers.length,
        emails: groupUsers.map(u => u.email).filter(Boolean),
        users: groupUsers
      };
    });

    return NextResponse.json({
      all_emails: (users ?? []).map(u => u.email).filter(Boolean),
      users: users ?? [],
      groups: formattedGroups
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
