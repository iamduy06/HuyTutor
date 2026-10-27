import { getAdminClient } from '../config/supabase.js';
import { memoryCache } from './cacheService.js';
import { extractTabs } from '@huytutor/shared';
import type { FlashcardRow } from '@huytutor/shared';

const WORD_COUNT_CACHE_KEY = 'deck_word_count_map';
const CACHE_TTL_SECONDS = 600; // 10 minutes

export function computeLevelStr(min: string | null, max: string | null): string | null {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min} - ${max}`;
  return min ?? max;
}

/**
 * Returns a map of deckId -> wordCount, cached in RAM for 10 minutes.
 */
export async function getWordCountMap(): Promise<Record<string, number>> {
  const cached = memoryCache.get<Record<string, number>>(WORD_COUNT_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const supabase = getAdminClient();
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
    const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
    map[c.deck_id] = (map[c.deck_id] ?? 0) + count;
  });

  memoryCache.set(WORD_COUNT_CACHE_KEY, map, CACHE_TTL_SECONDS);
  return map;
}

/**
 * Invalidates the cached word count map when flashcards are created/updated/deleted.
 */
export function invalidateWordCountCache(): void {
  memoryCache.delete(WORD_COUNT_CACHE_KEY);
}
