import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { getAdminClient } from '../config/supabase.js';
import { extractTabs, getGameVocabQuerySchema } from '@huytutor/shared';
import type { FlashcardRow, VocabItem } from '@huytutor/shared';
import { shuffle, deduplicateVocab } from '../utils/gameUtils.js';

const router = Router();

// GET /game/vocab
router.get(
  '/game/vocab',
  requireAuth,
  validate({ query: getGameVocabQuerySchema }),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const deckId = (req.query.deckId as string) ?? 'all';
    const limitParam = req.query.limit as string;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const tabIdsParam = req.query.tabIds as string;
  const selectedTabIds = tabIdsParam ? tabIdsParam.split(',') : [];

  const admin = getAdminClient();

  // 1. Fetch user_decks
  const { data: userDecks, error: udErr } = await admin
    .from('user_decks')
    .select('deck_id, expired_at, deck:decks(id, title, access_level)')
    .eq('user_id', user.id);

  if (udErr) {
    return res.status(500).json({ error: udErr.message });
  }

  // 2. Filter accessible decks
  const accessibleDecks = (userDecks ?? []).filter((ud: any) => {
    const levels = ud.deck?.access_level ?? {};
    if (levels.public || levels.auth) return true;
    if (levels.paid) {
      if (!ud.expired_at) return true;
      return new Date(ud.expired_at) > new Date();
    }
    return false;
  });

  if (accessibleDecks.length === 0) {
    return res.status(200).json({ vocab: [], deckTitle: 'Tất cả', totalCount: 0 });
  }

  // 3. Determine target deck IDs
  let targetDeckIds: string[];
  let deckTitle = 'Tất cả deck';

  if (deckId === 'all') {
    targetDeckIds = accessibleDecks.map((ud: any) => ud.deck_id as string);
  } else {
    const found = accessibleDecks.find((ud: any) => ud.deck_id === deckId);
    if (!found) {
      return res.status(403).json({ error: 'Forbidden: deck not accessible' });
    }
    targetDeckIds = [deckId];
    deckTitle = (found as any).deck?.title ?? deckId;
  }

  // 4. Fetch flashcards
  const { data: flashcards, error: fcErr } = await admin
    .from('flashcards')
    .select('deck_id, content')
    .in('deck_id', targetDeckIds);

  if (fcErr) {
    return res.status(500).json({ error: fcErr.message });
  }

  // 5. Extract & filter vocab
  const allVocab: VocabItem[] = (flashcards ?? []).flatMap((row: any) => {
    let tabs = extractTabs((row as unknown as FlashcardRow).content);
    if (selectedTabIds.length > 0) {
      tabs = tabs.filter(t => t.id && selectedTabIds.includes(t.id));
    }
    return tabs.flatMap(t => t.vocabulary ?? []);
  });

  // 6. Deduplicate & shuffle
  const deduped = deduplicateVocab(allVocab);
  const totalCount = deduped.length;
  const shuffled = shuffle(deduped);
  const vocab = limit ? shuffled.slice(0, limit) : shuffled;

  return res.status(200).json({ vocab, deckTitle, totalCount });
});

// GET /game/decks - List decks accessible for user's game
router.get('/game/decks', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const admin = getAdminClient();

  const { data: userDecks, error: udErr } = await admin
    .from('user_decks')
    .select('deck_id, expired_at, deck:decks(id, title, access_level)')
    .eq('user_id', user.id);

  if (udErr) {
    return res.status(500).json({ error: udErr.message });
  }

  const accessible = (userDecks ?? []).filter((ud: any) => {
    const levels = ud.deck?.access_level ?? {};
    if (levels.public || levels.auth) return true;
    if (levels.paid) {
      if (!ud.expired_at) return true;
      return new Date(ud.expired_at) > new Date();
    }
    return false;
  });

  if (accessible.length === 0) {
    return res.status(200).json({ decks: [] });
  }

  const deckIds = accessible.map((ud: any) => ud.deck_id as string);

  const { data: flashcards, error: fcErr } = await admin
    .from('flashcards')
    .select('deck_id, content')
    .in('deck_id', deckIds);

  if (fcErr) {
    return res.status(500).json({ error: fcErr.message });
  }

  const wordCountMap: Record<string, number> = {};
  const tabsMap: Record<string, { id: string; label: string; wordCount: number }[]> = {};

  (flashcards ?? []).forEach((r: any) => {
    const tabs = extractTabs((r as unknown as FlashcardRow).content);
    const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
    wordCountMap[r.deck_id] = (wordCountMap[r.deck_id] ?? 0) + count;

    if (!tabsMap[r.deck_id]) tabsMap[r.deck_id] = [];
    tabs.forEach(t => {
      const vCount = t.vocabulary?.length ?? 0;
      if (vCount > 0) {
        tabsMap[r.deck_id].push({
          id: t.id || 'default',
          label: t.label || t.id || 'Tab',
          wordCount: vCount,
        });
      }
    });
  });

  const deckOptions = accessible.map((ud: any) => ({
    deck_id: ud.deck_id as string,
    title: (ud.deck as any)?.title ?? ud.deck_id,
    wordCount: wordCountMap[ud.deck_id as string] ?? 0,
    tabs: tabsMap[ud.deck_id as string] ?? [],
  }));

  return res.status(200).json({ decks: deckOptions });
});

export default router;
