import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

/**
 * GET /api/admin/groups
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data: rawGroups, error } = await supabase
      .from("groups")
      .select("*, group_decks(expired_at)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const groups = rawGroups?.map((g: any) => {
      let maxExpiry = null;
      const upperName = g.name.trim().toUpperCase();
      if (upperName === "ĐĂNG KÝ 6 THÁNG") {
        const now = new Date(); now.setMonth(now.getMonth() + 6);
        maxExpiry = now.toISOString().split("T")[0];
      } else if (upperName === "ĐĂNG KÝ 1 NĂM") {
        const now = new Date(); now.setFullYear(now.getFullYear() + 1);
        maxExpiry = now.toISOString().split("T")[0];
      } else if (upperName === "ĐĂNG KÝ 2 NĂM") {
        const now = new Date(); now.setFullYear(now.getFullYear() + 2);
        maxExpiry = now.toISOString().split("T")[0];
      } else if (upperName === "ĐĂNG KÝ 3 NĂM") {
        const now = new Date(); now.setFullYear(now.getFullYear() + 3);
        maxExpiry = now.toISOString().split("T")[0];
      } else if (g.group_decks && g.group_decks.length > 0) {
        const expiries = g.group_decks
          .map((gd: any) => gd.expired_at)
          .filter(Boolean)
          .map((dateStr: string) => new Date(dateStr).getTime());
        if (expiries.length > 0) maxExpiry = new Date(Math.max(...expiries)).toISOString().split("T")[0];
      }
      const { group_decks, ...rest } = g;
      return { ...rest, max_expired_at: maxExpiry };
    }) || [];

    return res.json({ groups });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/admin/groups
 */
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const supabase = createAdminClient();
    const { data: newGroup, error } = await supabase
      .from("groups")
      .insert({ name, description })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ group: newGroup });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
