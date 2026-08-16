import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";
import { jsonToCsv } from "../../lib/utils";
import * as XLSX from "xlsx";

const router = Router();

function xlsxResponse(res: Response, items: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(items);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
  return res.send(buf);
}

/**
 * GET /api/admin/export?type=groups|decks|users|emails&format=json_full|csv|xlsx|json_mini|json_ids
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string;
    const format = (req.query.format as string) ?? "json_full";
    const supabase = createAdminClient();

    // 1. EXPORT GROUPS
    if (type === "groups") {
      const { data: groups } = await supabase
        .from("groups")
        .select("*, group_users(user_id, is_subadmin, users(email, created_at)), group_decks(deck_id, decks(title, access_level))")
        .order("created_at", { ascending: false });

      const userIds = groups?.flatMap((g) => (g as any).group_users.map((gu: any) => gu.user_id)) ?? [];
      const { data: allUserDecks } = await supabase.from("user_decks").select("user_id, deck_id").in("user_id", userIds);

      const exportData = (groups ?? []).map((g: any) => {
        const users = g.group_users.map((gu: any) => {
          const uDecks = (allUserDecks ?? []).filter((ud: any) => ud.user_id === gu.user_id).map((ud: any) => ud.deck_id);
          return { email: gu.users?.email, role: gu.is_subadmin ? "SUBADMIN" : "USER", created_at: gu.users?.created_at, decks: uDecks };
        });
        const decks = g.group_decks.map((gd: any) => ({ id: gd.deck_id, name: gd.decks?.title, access_level: gd.decks?.access_level }));
        return {
          id: g.id, name: g.name, created_at: g.created_at,
          users, decks,
          user_emails: users.map((u: any) => u.email).join(", "),
          deck_titles: decks.map((d: any) => d.name).join(", "),
        };
      });

      if (format === "csv") {
        const csv = jsonToCsv(exportData, ["id", "name", "user_emails", "deck_titles", "created_at"]);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="groups.csv"');
        return res.send("\ufeff" + csv);
      }
      if (format === "json_mini") {
        return res.json(exportData.map((g: any) => ({ ID: g.id, user: g.users.map((u: any) => u.email), deck: g.decks.map((d: any) => d.id) })));
      }
      return res.json(exportData);
    }

    // 2. EXPORT DECKS
    if (type === "decks") {
      const { data: decks } = await supabase.from("decks").select("*").order("created_at", { ascending: false });
      if (format === "csv") {
        const csv = jsonToCsv(decks ?? [], ["id", "title", "description", "level", "level_min", "level_max", "access_level", "created_at"]);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="decks.csv"');
        return res.send("\ufeff" + csv);
      }
      if (format === "json_mini") return res.json((decks ?? []).map((d: any) => ({ id: d.id, name: d.title })));
      if (format === "json_ids") return res.json({ id: (decks ?? []).map((d: any) => d.id) });
      return res.json(decks);
    }

    // 3. EXPORT USERS
    if (type === "users") {
      const { data: users } = await supabase
        .from("users")
        .select("*, user_decks(deck_id, expired_at, decks(title)), user_devices(device_id, device_name, ip_address, last_seen)")
        .order("created_at", { ascending: false });

      const exportData = (users ?? []).map((u: any) => {
        const decks = (u.user_decks ?? []).map((ud: any) => ({ id: ud.deck_id, name: ud.decks?.title, expire_at: ud.expired_at }));
        const devices = (u.user_devices ?? []).map((dv: any) => ({ id: dv.device_id, name: dv.device_name, ip: dv.ip_address, last_seen: dv.last_seen }));
        return {
          id: u.id, email: u.email, role: u.role, max_device: u.max_devices,
          decks, devices,
          deck_ids_str: decks.map((d: any) => `"${d.id}"`).join(", "),
          device_names: devices.map((d: any) => d.name).join(", "),
        };
      });

      if (format === "csv") {
        const csv = jsonToCsv(exportData, ["id", "email", "role", "max_device", "deck_ids_str", "device_names"]);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
        return res.send("\ufeff" + csv);
      }
      if (format === "json_mini") return res.json(exportData.map((u: any) => ({ id: u.id, email: u.email, deck: u.decks.map((d: any) => ({ id: d.id })) })));
      return res.json(exportData);
    }

    // 4. EXPORT EMAILS
    if (type === "emails") {
      const subtype = req.query.subtype as string;

      if (subtype === "all") {
        const { data: users } = await supabase.from("users").select("id, email, role, created_at").order("created_at", { ascending: false });
        const rows = (users ?? []).map((u: any, i: number) => ({ "STT": i + 1, "Email": u.email, "Role": u.role, "Created At": u.created_at }));
        if (format === "csv") {
          const csv = jsonToCsv(rows, ["STT", "Email", "Role", "Created At"]);
          res.setHeader("Content-Type", "text/csv; charset=utf-8");
          res.setHeader("Content-Disposition", 'attachment; filename="all_emails.csv"');
          return res.send("\ufeff" + csv);
        }
        if (format === "xlsx") return xlsxResponse(res, rows, "all_emails");
        return res.json(users ?? []);
      }

      if (subtype === "by_group") {
        const { data: groups } = await supabase
          .from("groups")
          .select("id, name, created_at, group_users(user_id, is_subadmin, users(id, email, role, created_at))")
          .order("created_at", { ascending: false });

        const rows: any[] = [];
        (groups ?? []).forEach((g: any) => {
          (g.group_users ?? []).forEach((gu: any) => {
            rows.push({
              "Group ID": g.id, "Group Name": g.name,
              "User Email": gu.users?.email ?? "",
              "Role In Group": gu.is_subadmin ? "SUBADMIN" : "MEMBER",
              "Account Role": gu.users?.role ?? "",
              "Created At": gu.users?.created_at ?? "",
            });
          });
        });

        if (format === "csv") {
          const csv = jsonToCsv(rows, ["Group ID", "Group Name", "User Email", "Role In Group", "Account Role", "Created At"]);
          res.setHeader("Content-Type", "text/csv; charset=utf-8");
          res.setHeader("Content-Disposition", 'attachment; filename="emails_by_group.csv"');
          return res.send("\ufeff" + csv);
        }
        if (format === "xlsx") return xlsxResponse(res, rows, "emails_by_group");
        return res.json(rows);
      }

      const [{ data: users }, { data: groups }] = await Promise.all([
        supabase.from("users").select("id, email, role, created_at").order("created_at", { ascending: false }),
        supabase.from("groups").select("id, name, created_at, group_users(user_id, is_subadmin, users(id, email, role, created_at))").order("created_at", { ascending: false }),
      ]);

      const formattedGroups = (groups ?? []).map((g: any) => {
        const groupUsers = (g.group_users ?? []).map((gu: any) => ({ id: gu.users?.id, email: gu.users?.email, role: gu.users?.role, is_subadmin: gu.is_subadmin }));
        return { id: g.id, name: g.name, created_at: g.created_at, user_count: groupUsers.length, emails: groupUsers.map((u: any) => u.email).filter(Boolean), users: groupUsers };
      });

      return res.json({ all_emails: (users ?? []).map((u: any) => u.email).filter(Boolean), users: users ?? [], groups: formattedGroups });
    }

    return res.status(400).json({ error: "Invalid type" });
  } catch (err: any) {
    console.error("[GET /api/admin/export]", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
