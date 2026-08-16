import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

/**
 * GET /api/admin/deck-groups
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("deck_groups")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ groups: data });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/admin/deck-groups
 */
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, order_index } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("deck_groups")
      .insert({ name, description, order_index: order_index ?? 0 })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ group: data });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
