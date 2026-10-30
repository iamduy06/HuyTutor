import { getAdminClient } from '../config/supabase.js';
import { memoryCache } from './cacheService.js';
import { extractTabs } from '@huytutor/shared';
import type { FlashcardRow } from '@huytutor/shared';

const WORD_COUNT_CACHE_KEY = 'deck_word_count_map';
const CACHE_TTL_SECONDS = 900; // 15 minutes

export function computeLevelStr(min: string | null, max: string | null): string | null {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min} - ${max}`;
  return min ?? max;
}

/**
 * Returns a map of deckId -> wordCount, cached in RAM for 15 minutes.
 * SEC-011: Avoids heavy JSONB table scanning by reading pre-computed word_count
 * directly from the decks table. If not populated, falls back to calculating and caching.
 */
export async function getWordCountMap(): Promise<Record<string, number>> {
  const cached = memoryCache.get<Record<string, number>>(WORD_COUNT_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const supabase = getAdminClient();

  // 1. Try reading word_count column from decks first (minimal network & RAM footprint)
  const { data: decks, error: deckErr } = await supabase
    .from('decks')
    .select('id, word_count');

  if (!deckErr && decks && decks.length > 0) {
    const hasUncalculated = decks.some(d => d.word_count === null || d.word_count === undefined);
    if (!hasUncalculated) {
      const map: Record<string, number> = {};
      for (const d of decks) {
        map[d.id] = d.word_count ?? 0;
      }
      memoryCache.set(WORD_COUNT_CACHE_KEY, map, CACHE_TTL_SECONDS);
      return map;
    }
  }

  // 2. Fallback: If word_count is not yet migrated or populated, scan flashcards
  const { data: cards, error } = await supabase
    .from('flashcards')
    .select('deck_id, content');

  if (error) {
    console.error('[DECK_SERVICE] Failed to fetch flashcard counts:', error);
    return {};
  }

  const map: Record<string, number> = {};
  (cards ?? []).forEach((c: any) => {
    const tabs = extractTabs((c as unknown as FlashcardRow).content);
    const count = tabs.reduce((s: number, t: any) => s + (t.vocabulary?.length ?? 0), 0);
    map[c.deck_id] = (map[c.deck_id] ?? 0) + count;
  });

  memoryCache.set(WORD_COUNT_CACHE_KEY, map, CACHE_TTL_SECONDS);
  return map;
}

/**
 * Syncs the word_count for a single deck without scanning the entire flashcards table.
 */
export async function syncDeckWordCount(deckId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data: rows } = await supabase
    .from('flashcards')
    .select('content')
    .eq('deck_id', deckId);

  let totalWords = 0;
  for (const row of rows ?? []) {
    const tabs = extractTabs((row as unknown as FlashcardRow).content);
    totalWords += tabs.reduce((s: number, t: any) => s + (t.vocabulary?.length ?? 0), 0);
  }

  // Update decks row with new count
  await supabase.from('decks').update({ word_count: totalWords }).eq('id', deckId);

  // Invalidate cache
  invalidateWordCountCache();
  return totalWords;
}

/**
 * Invalidates the cached word count map when flashcards are created/updated/deleted.
 */
export function invalidateWordCountCache(): void {
  memoryCache.delete(WORD_COUNT_CACHE_KEY);
}
