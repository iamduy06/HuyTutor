import type { Tab, FlashcardRow, VocabItem, DeckContent } from "../types/index.js";

/**
 * 3 format có thể có trong DB:
 *   Format A (mới): { tabs: [{ id, label, desc, vocabulary: [...] }, ...] }
 *   Format B (cũ) : { id, label, vocabulary: [...] }   ← single unit object
 *   Format C (cũ) : [{ id, label, vocabulary: [...] }] ← array of unit objects
 *   Format D (cũ) : { word, phonetic, ... }             ← flat word object (row per word)
 *
 * extractTabs() luôn trả về Tab[] bất kể format nào.
 */
export function extractTabs(raw: FlashcardRow["content"]): Tab[] {
  if (!raw) return [];

  // Format A: { tabs: [...] }
  if (!Array.isArray(raw) && typeof raw === "object" && "tabs" in raw && Array.isArray((raw as DeckContent).tabs)) {
    return (raw as DeckContent).tabs;
  }

  // Format C: [{ id, label, vocabulary }, ...]
  if (Array.isArray(raw)) {
    // Mảng unit
    if (raw.length > 0 && "vocabulary" in raw[0]) return raw as Tab[];
    // Mảng flat word
    return [{ vocabulary: raw as unknown as VocabItem[] }];
  }

  // Format B: { id, label, vocabulary }
  if (typeof raw === "object" && "vocabulary" in raw) {
    return [raw as Tab];
  }

  // Format D: { word, phonetic, meaning, ... } ← flat word row
  if (typeof raw === "object" && "word" in raw) {
    return [{ vocabulary: [raw as unknown as VocabItem] }];
  }

  return [];
}

/**
 * Lấy tất cả từ vựng flatten từ 1 row DB
 */
export function extractVocab(row: FlashcardRow): VocabItem[] {
  return extractTabs(row.content).flatMap((t) => t.vocabulary ?? []);
}

/**
 * Đếm tổng số từ trong 1 row DB
 */
export function countWords(row: FlashcardRow): number {
  return extractVocab(row).length;
}

/**
 * Chuẩn hoá synonyms/antonyms:
 *   "word1, word2" → ["word1", "word2"]
 *   ["word1", "word2"] → ["word1", "word2"]
 */
export function toArray(val: string | string[] | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}
