import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAdminClient } from '../config/supabase.js';
import { optionalAuth } from '../middlewares/auth.js';
import { getWordCountMap, computeLevelStr } from '../services/deckService.js';
import { extractTabs, getDeckAccess, DEMO_LIMIT } from '@huytutor/shared';
import type { FlashcardRow, Tab } from '@huytutor/shared';

const router = Router();

// GET /decks - Public list of decks
router.get('/decks', async (_req: Request, res: Response) => {
  const admin = getAdminClient();

  const { data: decks, error } = await admin
    .from('decks')
    .select('id, title, description, level, level_min, level_max, access_level, created_at')
    .in('access_level', ['public', 'preview'])
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const wordCountMap = await getWordCountMap();

  const result = (decks ?? []).map((d: any) => ({
    ...d,
    word_count: wordCountMap[d.id] ?? 0,
    level: computeLevelStr(d.level_min, d.level_max) ?? d.level,
  }));

  return res.status(200).json({ decks: result });
});

// GET /decks/demo - Free demo words
router.get('/decks/demo', async (req: Request, res: Response) => {
  const deckId = req.query.deckId as string;
  if (!deckId) {
    return res.status(400).json({ error: 'deckId required' });
  }

  const admin = getAdminClient();

  const { data: deck } = await admin
    .from('decks')
    .select('id, title, description, level')
    .eq('id', deckId)
    .single();

  if (!deck) {
    return res.status(404).json({ error: 'Not found' });
  }

  const { data: rows } = await admin
    .from('flashcards')
    .select('id, deck_id, content, created_at')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  let seen = 0;
  const demoTabs = allTabs
    .map(tab => {
      const remaining = DEMO_LIMIT - seen;
      if (remaining <= 0) return null;
      const vocab = (tab.vocabulary ?? []).slice(0, remaining);
      seen += vocab.length;
      return { ...tab, vocabulary: vocab };
    })
    .filter((t): t is Tab => t !== null && t.vocabulary.length > 0);

  return res.status(200).json({ deck, tabs: demoTabs, isDemo: true });
});

// GET /decks/:id/content - Content by user permissions
router.get('/decks/:id/content', optionalAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const admin = getAdminClient();

  const { data: deck } = await admin
    .from('decks')
    .select('id, title, description, access_level')
    .eq('id', id)
    .single();

  if (!deck) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Check user permission
  const user = req.user;
  let userDeck: { expired_at: string | null } | null = null;

  if (user) {
    const { data: ud } = await admin
      .from('user_decks')
      .select('expired_at')
      .eq('user_id', user.id)
      .eq('deck_id', id)
      .maybeSingle();
    userDeck = ud;
  }

  const access = getDeckAccess(user ?? null, deck as any, userDeck);

  if (!access.canLearnFull && !access.isPreview) {
    return res.status(403).json({ error: 'Forbidden: Access required' });
  }

  const { data: rows } = await admin
    .from('flashcards')
    .select('content, created_at')
    .eq('deck_id', id)
    .order('created_at', { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  let finalTabs = allTabs;
  let isDemo = false;

  if (!access.canLearnFull && access.isPreview) {
    const limit = access.previewLimit || 10;
    let seen = 0;
    finalTabs = allTabs
      .map(tab => {
        const remaining = limit - seen;
        if (remaining <= 0) return null;
        const vocab = (tab.vocabulary ?? []).slice(0, remaining);
        seen += vocab.length;
        return { ...tab, vocabulary: vocab };
      })
      .filter((t): t is Tab => t !== null && t.vocabulary.length > 0);
    isDemo = true;
  }

  return res.status(200).json({
    deck: {
      id: deck.id,
      title: deck.title,
      description: deck.description,
    },
    tabs: finalTabs,
    isDemo,
    previewLimit: access.previewLimit,
    totalWords: allTabs.reduce((s, t) => s + t.vocabulary.length, 0),
  });
});

// GET /decks/:id/preview - Public preview slice
router.get('/decks/:id/preview', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const admin = getAdminClient();

  const { data: deck } = await admin
    .from('decks')
    .select('id, access_level')
    .eq('id', id)
    .single();

  if (!deck) {
    return res.status(404).json({ error: 'Not found' });
  }

  const levels = (deck.access_level as any) || {};
  const limit = levels.preview_word_limit || 10;

  const { data: rows } = await admin
    .from('flashcards')
    .select('content, created_at')
    .eq('deck_id', id)
    .order('created_at', { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  let count = 0;
  const slicedTabs: Tab[] = [];

  for (const tab of allTabs) {
    if (count >= limit) break;
    const remaining = limit - count;
    const items = tab.vocabulary.slice(0, remaining);
    slicedTabs.push({ ...tab, vocabulary: items });
    count += items.length;
  }

  return res.status(200).json({
    tabs: slicedTabs,
    isFull: false,
    previewLimit: limit,
    totalActualWords: allTabs.reduce((s, t) => s + t.vocabulary.length, 0),
  });
});

// GET /decks/:id - Single deck detail
router.get('/decks/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const admin = getAdminClient();

  const { data: deck, error } = await admin
    .from('decks')
    .select('id, title, description, level, level_min, level_max, access_level, created_at')
    .eq('id', id)
    .single();

  if (error || !deck) {
    return res.status(404).json({ error: 'Deck not found' });
  }

  const wordCountMap = await getWordCountMap();

  return res.status(200).json({
    deck: {
      ...deck,
      word_count: wordCountMap[deck.id] ?? 0,
      level: computeLevelStr(deck.level_min, deck.level_max) ?? deck.level,
    },
  });
});

export default router;
