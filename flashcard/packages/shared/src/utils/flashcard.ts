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
export function extractTabs(raw: unknown): Tab[] {
  if (!raw) return [];

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!parsed || typeof parsed !== "object") return [];

  // Format A: { tabs: [...] }
  if (!Array.isArray(parsed) && "tabs" in parsed && Array.isArray((parsed as any).tabs)) {
    return ((parsed as any).tabs as any[])
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        ...t,
        vocabulary: Array.isArray(t.vocabulary) ? t.vocabulary : [],
      }));
  }

  // Format C: [{ id, label, vocabulary }, ...]
  if (Array.isArray(parsed)) {
    // Mảng unit
    if (parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null && "vocabulary" in parsed[0]) {
      return parsed.map((t: any) => ({
        ...t,
        vocabulary: Array.isArray(t?.vocabulary) ? t.vocabulary : [],
      }));
    }
    // Mảng flat word
    return [{ vocabulary: parsed as unknown as VocabItem[] }];
  }

  // Format B: { id, label, vocabulary }
  if ("vocabulary" in parsed && Array.isArray((parsed as any).vocabulary)) {
    return [parsed as Tab];
  }

  // Format D: { word, phonetic, meaning, ... } ← flat word row
  if ("word" in parsed) {
    return [{ vocabulary: [parsed as unknown as VocabItem] }];
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
