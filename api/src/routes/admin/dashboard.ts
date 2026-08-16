import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

/**
 * GET /api/admin/dashboard
 * Auth: Admin required
 * Returns summary stats for the admin dashboard page.
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();

    const [
      { count: totalUsers },
      { count: totalDecks },
      { data: progressData },
      { count: totalAssignments },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("decks").select("*", { count: "exact", head: true }),
      supabase.from("user_decks").select("progress_percent"),
      supabase.from("user_decks").select("*", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const avgProgress = progressData?.length
      ? Math.round(
          progressData.reduce((s: number, r: any) => s + (r.progress_percent || 0), 0) /
            progressData.length
        )
      : 0;

    return res.json({
      totalUsers: totalUsers ?? 0,
      totalDecks: totalDecks ?? 0,
      avgProgress,
      totalAssignments: totalAssignments ?? 0,
      recentUsers: recentUsers ?? [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
