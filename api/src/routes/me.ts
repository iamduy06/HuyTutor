import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { createAdminClient } from "../lib/supabase";

const router = Router();

/**
 * GET /api/me/branding
 * Auth required — get branding for user's group
 */
router.get("/branding", requireAuth, async (req: Request, res: Response) => {
  try {
    const admin = createAdminClient();

    const { data: groupUsers } = await admin
      .from("group_users")
      .select("group_id")
      .eq("user_id", req.user.id);

    if (!groupUsers || groupUsers.length === 0) {
      return res.json({ branding: null });
    }

    const groupIds = groupUsers.map((g: any) => g.group_id);
    const { data: groups } = await admin.from("groups").select("branding").in("id", groupIds);

    if (!groups) return res.json({ branding: null });

    const activeBranding = groups
      .map((g: any) => g.branding)
      .find((b: any) => b && b.allow_custom_branding === true);

    return res.json({ branding: activeBranding ?? null });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
