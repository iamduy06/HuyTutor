import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

/**
 * GET /api/admin/analytics
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = createAdminClient();
    const [
      { count: totalUsers },
      { count: totalDecks },
      { data: deckStats },
      { data: progressStats },
      { data: streakData },
    ] = await Promise.all([
      admin.from("users").select("*", { count: "exact", head: true }),
      admin.from("decks").select("*", { count: "exact", head: true }),
      admin.from("user_decks").select("deck_id, deck:decks(title), progress_percent, learned_count").order("deck_id"),
      admin.from("user_decks").select("progress_percent"),
      admin.from("user_decks").select("streak").order("streak", { ascending: false }).limit(1),
    ]);

    const avgProgress = progressStats?.length
      ? Math.round(progressStats.reduce((s: number, r: any) => s + (r.progress_percent || 0), 0) / progressStats.length)
      : 0;

    const maxStreak = (streakData?.[0] as any)?.streak ?? 0;

    const deckMap: Record<string, { title: string; userCount: number; totalLearned: number; avgProgress: number; totalProgress: number }> = {};
    (deckStats ?? []).forEach((r: any) => {
      const id = r.deck_id;
      if (!deckMap[id]) deckMap[id] = { title: r.deck?.title ?? id, userCount: 0, totalLearned: 0, avgProgress: 0, totalProgress: 0 };
      deckMap[id].userCount++;
      deckMap[id].totalProgress += r.progress_percent || 0;
      deckMap[id].totalLearned += r.learned_count || 0;
    });
    const popularDecks = Object.values(deckMap)
      .map((d) => ({ ...d, avgProgress: d.userCount ? Math.round(d.totalProgress / d.userCount) : 0, totalProgress: undefined }))
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 5);

    return res.json({ totalUsers, totalDecks, avgProgress, maxStreak, popularDecks });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
