import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

/**
 * GET /api/admin/references
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const [decksRes, groupsRes] = await Promise.all([
      supabase.from("decks").select("id, title").order("title"),
      supabase.from("groups").select("id, name").order("name"),
    ]);

    return res.json({
      decks: decksRes.data ?? [],
      groups: groupsRes.data ?? [],
      error: decksRes.error || groupsRes.error,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
