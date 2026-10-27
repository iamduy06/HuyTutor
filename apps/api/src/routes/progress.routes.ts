import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updateProgressSchema } from '@huytutor/shared';
import { getAdminClient } from '../config/supabase.js';

const router = Router();

// GET /progress?deck_id=<uuid>
router.get('/progress', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const deckId = req.query.deck_id as string;
  if (!deckId) {
    return res.status(400).json({ error: 'deck_id required' });
  }

  const admin = getAdminClient();
  const { data } = await admin
    .from('user_decks')
    .select('streak, learned_count, progress_percent, last_studied_at')
    .eq('user_id', user.id)
    .eq('deck_id', deckId)
    .maybeSingle();

  return res.status(200).json({ progress: data ?? null });
});

// POST /progress
router.post(
  '/progress',
  requireAuth,
  validate({ body: updateProgressSchema }),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const { deck_id, learned_count, progress_percent } = req.body;
    const admin = getAdminClient();

    // Check deck permissions
    const [{ data: deck }, { data: existing }] = await Promise.all([
      admin.from('decks').select('access_level').eq('id', deck_id).single(),
      admin
        .from('user_decks')
        .select('streak, last_studied_at, learned_count')
        .eq('user_id', user.id)
        .eq('deck_id', deck_id)
        .maybeSingle(),
    ]);

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const levels = (deck.access_level ?? {}) as {
      public?: boolean;
      auth?: boolean;
      paid?: boolean;
    };
    const isFreeAccess = levels.public === true || levels.auth === true;
    const isPaidOnly = levels.paid === true && !isFreeAccess;

    if (isPaidOnly && !existing) {
      return res.status(403).json({ error: 'Forbidden: no access' });
    }

    const now = new Date();
    const lastStudied = existing?.last_studied_at ? new Date(existing.last_studied_at) : null;
    let streak = existing?.streak ?? 0;

    if (lastStudied) {
      const todayDay = new Date(now.toDateString()).getTime();
      const lastDay = new Date(lastStudied.toDateString()).getTime();
      const diffDays = (todayDay - lastDay) / (1000 * 60 * 60 * 24);

      if (diffDays === 0) {
        // Same day: keep streak
      } else if (diffDays === 1) {
        // Yesterday: increment streak
        streak += 1;
      } else {
        // Missed day: reset streak to 1
        streak = 1;
      }
    } else {
      streak = 1;
    }

    const { error } = await admin.from('user_decks').upsert(
      {
        user_id: user.id,
        deck_id,
        learned_count: Math.max(learned_count ?? 0, existing?.learned_count ?? 0),
        progress_percent: progress_percent ?? 0,
        streak,
        last_studied_at: now.toISOString(),
      },
      { onConflict: 'user_id,deck_id' }
    );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, streak });
  }
);

export default router;
