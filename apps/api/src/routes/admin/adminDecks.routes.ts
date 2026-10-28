import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/roleGuard.js';
import { getAdminClient } from '../../config/supabase.js';
import { getWordCountMap, computeLevelStr, invalidateWordCountCache } from '../../services/deckService.js';
import { validate } from '../../middlewares/validate.js';
import { 
  extractTabs, 
  createDeckSchema, 
  updateDeckSchema, 
  saveFlashcardContentSchema,
  bulkTabsInputSchema,
  patchTabSchema,
  vocabItemSchema,
  bulkWordsInputSchema
} from '@huytutor/shared';
import { syncDeckWordCount } from '../../services/deckService.js';
import type { FlashcardRow, Tab, VocabItem } from '@huytutor/shared';

const router = Router();
router.use('/admin', requireAuth, requireRole('ADMIN'));

// Helper to load tabs from single or multiple flashcard rows
async function loadCurrentTabs(supabase: ReturnType<typeof getAdminClient>, deckId: string) {
  const { data: rows } = await supabase
    .from('flashcards')
    .select('id, content')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });

  const tabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );
  const rowId = (rows?.[0]?.id as string) ?? null;
  const extraIds = (rows ?? []).slice(1).map(r => r.id as string);
  return { rowId, tabs, extraIds };
}

// Helper to persist updated tabs into single flashcard row
async function persistTabs(
  supabase: ReturnType<typeof getAdminClient>,
  deckId: string,
  rowId: string | null,
  tabs: Tab[],
  extraIds: string[]
) {
  const content = { tabs };
  if (rowId) {
    await supabase.from('flashcards').update({ content }).eq('id', rowId);
  } else {
    await supabase.from('flashcards').insert({ deck_id: deckId, content });
  }
  if (extraIds.length) {
    await supabase.from('flashcards').delete().in('id', extraIds);
  }

  // SEC-011: Synchronize word_count to deck directly
  const totalWords = tabs.reduce((sum, tab) => sum + (tab.vocabulary?.length ?? 0), 0);
  await supabase.from('decks').update({ word_count: totalWords }).eq('id', deckId);

  invalidateWordCountCache();
}

// GET /admin/decks
router.get('/admin/decks', async (_req: Request, res: Response) => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('decks')
    .select('id, title, description, level, level_min, level_max, access_level, group_id, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const wordCountMap = await getWordCountMap();

  const decks = (data ?? []).map((d: any) => ({
    ...d,
    word_count: wordCountMap[d.id] ?? 0,
    level: computeLevelStr(d.level_min, d.level_max) ?? d.level,
  }));

  return res.status(200).json({ decks });
});

// POST /admin/decks
router.post('/admin/decks', validate({ body: createDeckSchema }), async (req: Request, res: Response) => {
  const body = req.body;
  const { title, description, level_min, level_max, access_level, group_id } = body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('decks')
    .insert({
      title,
      description: description ?? null,
      level_min: level_min ?? null,
      level_max: level_max ?? null,
      access_level: access_level ?? { public: false, auth: false, paid: false, preview: false },
      group_id: group_id ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  invalidateWordCountCache();
  return res.status(200).json({ deck: data });
});

// GET /admin/decks/:id
router.get('/admin/decks/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const supabase = getAdminClient();

  const { data: deck, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !deck) return res.status(404).json({ error: 'Deck not found' });
  return res.status(200).json({ deck });
});

// PATCH /admin/decks/:id
router.patch('/admin/decks/:id', validate({ body: updateDeckSchema }), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const body = req.body;
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('decks')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  invalidateWordCountCache();
  return res.status(200).json({ deck: data });
});

// DELETE /admin/decks/:id
router.delete('/admin/decks/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const supabase = getAdminClient();

  const { error } = await supabase.from('decks').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  invalidateWordCountCache();
  return res.status(200).json({ success: true });
});

// GET /admin/decks/:id/cards
router.get('/admin/decks/:id/cards', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const supabase = getAdminClient();

  const { data: cards, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('deck_id', id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ cards: cards ?? [] });
});

// POST /admin/decks/:id/cards
router.post('/admin/decks/:id/cards', validate({ body: saveFlashcardContentSchema }), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { content } = req.body;
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('flashcards')
    .insert({ deck_id: id, content })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  await syncDeckWordCount(id);
  return res.status(200).json({ card: data });
});

// PATCH /admin/decks/:id/cards/:cardId
router.patch('/admin/decks/:id/cards/:cardId', validate({ body: saveFlashcardContentSchema }), async (req: Request, res: Response) => {
  const cardId = req.params.cardId as string;
  const { content } = req.body;
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('flashcards')
    .update({ content })
    .eq('id', cardId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  invalidateWordCountCache();
  return res.status(200).json({ card: data });
});

// DELETE /admin/decks/:id/cards/:cardId
router.delete('/admin/decks/:id/cards/:cardId', async (req: Request, res: Response) => {
  const cardId = req.params.cardId as string;
  const supabase = getAdminClient();

  const { error } = await supabase.from('flashcards').delete().eq('id', cardId);
  if (error) return res.status(500).json({ error: error.message });
  const deckId = req.params.id as string;
  if (deckId) await syncDeckWordCount(deckId);
  return res.status(200).json({ success: true });
});

// POST /admin/decks/:id/tabs - Add single tab or bulk import tabs (SEC-010 validated)
router.post('/admin/decks/:id/tabs', validate({ body: bulkTabsInputSchema }), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const body = req.body;
  const supabase = getAdminClient();

  const { rowId, tabs: current, extraIds } = await loadCurrentTabs(supabase, id);

  // Bulk import
  if (Array.isArray(body) || Array.isArray(body.tabs)) {
    const incoming: Tab[] = Array.isArray(body) ? body : body.tabs;
    const merged: Tab[] = [...current];

    for (const tab of incoming) {
      if (!tab.id || !tab.label) continue;
      const existing = merged.find(t => t.id === tab.id);
      if (existing) {
        existing.label = tab.label;
        existing.desc = tab.desc;
        existing.vocabulary = tab.vocabulary || [];
      } else {
        merged.push({
          id: tab.id,
          label: tab.label,
          desc: tab.desc || '',
          vocabulary: tab.vocabulary || [],
        });
      }
    }

    await persistTabs(supabase, id, rowId, merged, extraIds);
    return res.status(200).json({ success: true, count: merged.length });
  }

  // Single tab
  const { id: tabId, label, desc } = body;
  if (!tabId || !label) {
    return res.status(400).json({ error: 'tabId and label are required' });
  }

  const newTab: Tab = {
    id: tabId,
    label,
    desc: desc || '',
    vocabulary: [],
  };

  const updatedTabs = [...current, newTab];
  await persistTabs(supabase, id, rowId, updatedTabs, extraIds);
  return res.status(200).json({ success: true, tab: newTab });
});

// PATCH /admin/decks/:id/tabs/:tabIndex (SEC-010 validated)
router.patch('/admin/decks/:id/tabs/:tabIndex', validate({ body: patchTabSchema }), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const tabIndex = parseInt(req.params.tabIndex as string, 10);
  const body = req.body;
  const supabase = getAdminClient();

  const { rowId, tabs, extraIds } = await loadCurrentTabs(supabase, id);

  if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= tabs.length) {
    return res.status(400).json({ error: 'Invalid tabIndex' });
  }

  if (body.action === 'rename') {
    tabs[tabIndex].label = body.label ?? tabs[tabIndex].label;
    tabs[tabIndex].desc = body.desc ?? tabs[tabIndex].desc;
  } else if (body.action === 'reorder') {
    const { newOrder } = body;
    if (Array.isArray(newOrder)) {
      tabs.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
    }
  } else {
    if (body.label !== undefined) tabs[tabIndex].label = body.label;
    if (body.desc !== undefined) tabs[tabIndex].desc = body.desc;
  }

  await persistTabs(supabase, id, rowId, tabs, extraIds);
  return res.status(200).json({ success: true, tab: tabs[tabIndex] });
});

// DELETE /admin/decks/:id/tabs/:tabIndex
router.delete('/admin/decks/:id/tabs/:tabIndex', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const tabIndex = parseInt(req.params.tabIndex as string, 10);
  const supabase = getAdminClient();

  const { rowId, tabs, extraIds } = await loadCurrentTabs(supabase, id);

  if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= tabs.length) {
    return res.status(400).json({ error: 'Invalid tabIndex' });
  }

  tabs.splice(tabIndex, 1);
  await persistTabs(supabase, id, rowId, tabs, extraIds);
  return res.status(200).json({ success: true });
});

// POST /admin/decks/:id/tabs/:tabIndex/words - Add word (SEC-010 validated)
router.post('/admin/decks/:id/tabs/:tabIndex/words', validate({ body: vocabItemSchema }), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const tabIndex = parseInt(req.params.tabIndex as string, 10);
  const word: VocabItem = req.body;
  const supabase = getAdminClient();

  const { rowId, tabs, extraIds } = await loadCurrentTabs(supabase, id);

  if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= tabs.length) {
    return res.status(400).json({ error: 'Invalid tabIndex' });
  }

  tabs[tabIndex].vocabulary = tabs[tabIndex].vocabulary || [];
  tabs[tabIndex].vocabulary.push(word);

  await persistTabs(supabase, id, rowId, tabs, extraIds);
  return res.status(200).json({ success: true, word });
});

// PATCH /admin/decks/:id/tabs/:tabIndex/words/:wordIndex - Update word (SEC-010 validated)
router.patch('/admin/decks/:id/tabs/:tabIndex/words/:wordIndex', validate({ body: vocabItemSchema.partial() }), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const tabIndex = parseInt(req.params.tabIndex as string, 10);
  const wordIndex = parseInt(req.params.wordIndex as string, 10);
  const updatedWord: VocabItem = req.body;
  const supabase = getAdminClient();

  const { rowId, tabs, extraIds } = await loadCurrentTabs(supabase, id);

  if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= tabs.length) {
    return res.status(400).json({ error: 'Invalid tabIndex' });
  }

  const vocab = tabs[tabIndex].vocabulary || [];
  if (isNaN(wordIndex) || wordIndex < 0 || wordIndex >= vocab.length) {
    return res.status(400).json({ error: 'Invalid wordIndex' });
  }

  vocab[wordIndex] = { ...vocab[wordIndex], ...updatedWord };
  tabs[tabIndex].vocabulary = vocab;

  await persistTabs(supabase, id, rowId, tabs, extraIds);
  return res.status(200).json({ success: true, word: vocab[wordIndex] });
});

// DELETE /admin/decks/:id/tabs/:tabIndex/words/:wordIndex - Delete word
router.delete('/admin/decks/:id/tabs/:tabIndex/words/:wordIndex', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const tabIndex = parseInt(req.params.tabIndex as string, 10);
  const wordIndex = parseInt(req.params.wordIndex as string, 10);
  const supabase = getAdminClient();

  const { rowId, tabs, extraIds } = await loadCurrentTabs(supabase, id);

  if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= tabs.length) {
    return res.status(400).json({ error: 'Invalid tabIndex' });
  }

  const vocab = tabs[tabIndex].vocabulary || [];
  if (isNaN(wordIndex) || wordIndex < 0 || wordIndex >= vocab.length) {
    return res.status(400).json({ error: 'Invalid wordIndex' });
  }

  vocab.splice(wordIndex, 1);
  tabs[tabIndex].vocabulary = vocab;

  await persistTabs(supabase, id, rowId, tabs, extraIds);
  return res.status(200).json({ success: true });
});

// POST /admin/decks/:id/tabs/:tabIndex/words/bulk - Bulk add words (SEC-010 validated)
router.post('/admin/decks/:id/tabs/:tabIndex/words/bulk', validate({ body: bulkWordsInputSchema }), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const tabIndex = parseInt(req.params.tabIndex as string, 10);
  const { words } = req.body;
  const supabase = getAdminClient();

  const { rowId, tabs, extraIds } = await loadCurrentTabs(supabase, id);

  if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= tabs.length) {
    return res.status(400).json({ error: 'Invalid tabIndex' });
  }

  if (!Array.isArray(words)) {
    return res.status(400).json({ error: 'words array required' });
  }

  tabs[tabIndex].vocabulary = [...(tabs[tabIndex].vocabulary || []), ...words];

  await persistTabs(supabase, id, rowId, tabs, extraIds);
  return res.status(200).json({ success: true, count: tabs[tabIndex].vocabulary.length });
});

export default router;
