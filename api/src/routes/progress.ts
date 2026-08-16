import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { createAdminClient } from "../lib/supabase";

const router = Router();

/**
 * GET /api/progress?deck_id=xxx
 * Auth required
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const deckId = req.query.deck_id as string;
    if (!deckId) return res.status(400).json({ error: "deck_id required" });

    const admin = createAdminClient();
    const { data } = await admin
      .from("user_decks")
      .select("streak, learned_count, progress_percent, last_studied_at")
      .eq("user_id", req.user.id)
      .eq("deck_id", deckId)
      .maybeSingle();

    return res.json({ progress: data ?? null });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/progress
 * Auth required — upsert learning progress
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { deck_id, learned_count, progress_percent } = req.body;
    if (!deck_id) return res.status(400).json({ error: "deck_id required" });

    const admin = createAdminClient();
    const [{ data: deck }, { data: existing }] = await Promise.all([
      admin.from("decks").select("access_level").eq("id", deck_id).single(),
      admin
        .from("user_decks")
        .select("streak, last_studied_at")
        .eq("user_id", req.user.id)
        .eq("deck_id", deck_id)
        .maybeSingle(),
    ]);

    if (!deck) return res.status(404).json({ error: "Deck not found" });

    const levels = (deck.access_level ?? {}) as any;
    const isFreeAccess = levels.public === true || levels.auth === true;
    const isPaidOnly = levels.paid === true && !isFreeAccess;
    if (isPaidOnly && !existing) {
      return res.status(403).json({ error: "Forbidden: no access" });
    }

    const now = new Date();
    const lastStudied = existing?.last_studied_at ? new Date(existing.last_studied_at) : null;
    let streak = existing?.streak ?? 0;

    if (lastStudied) {
      const todayDay = new Date(now.toDateString()).getTime();
      const lastDay = new Date(lastStudied.toDateString()).getTime();
      const diffDays = (todayDay - lastDay) / (1000 * 60 * 60 * 24);
      if (diffDays === 0) { /* same day */ }
      else if (diffDays === 1) { streak += 1; }
      else { streak = 1; }
    } else {
      streak = 1;
    }

    const { error } = await admin.from("user_decks").upsert(
      {
        user_id: req.user.id,
        deck_id,
        learned_count: Math.max(learned_count ?? 0, 0),
        progress_percent: progress_percent ?? 0,
        streak,
        last_studied_at: now.toISOString(),
      },
      { onConflict: "user_id,deck_id" }
    );

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, streak });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
