import type { VocabItem } from "@/types";
import { toArray } from "@/lib/utils";

// ─── Shuffle ──────────────────────────────────────────────────────────────────

/** Fisher-Yates in-place shuffle — trả về mảng mới */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Multiple Choice ──────────────────────────────────────────────────────────

export interface Choice {
  text: string;
  isCorrect: boolean;
}

/**
 * Tạo danh sách 4 đáp án (1 đúng + 3 sai).
 * Đáp án sai lấy từ pool (loại trừ correct), lấy meaning.
 */
export function buildChoices(correct: VocabItem, pool: VocabItem[], count = 4): Choice[] {
  const distractors = shuffle(pool.filter(v => v.word !== correct.word))
    .slice(0, count - 1)
    .map(v => ({ text: v.meaning, isCorrect: false }));

  const choices: Choice[] = [
    { text: correct.meaning, isCorrect: true },
    ...distractors,
  ];
  return shuffle(choices);
}

// ─── Listening ────────────────────────────────────────────────────────────────

/** So sánh câu trả lời listening — ignore case, trim, bỏ dấu câu đơn giản */
export function checkListeningAnswer(input: string, correct: string): boolean {
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/[^a-z0-9\s'-]/g, "");
  return normalize(input) === normalize(correct);
}

// ─── Matching / SynAnt ────────────────────────────────────────────────────────

/** Lấy N cặp ngẫu nhiên từ vocab list (dùng cho Matching & SynAnt) */
export function pickPairs(vocab: VocabItem[], n: number): VocabItem[] {
  return shuffle(vocab).slice(0, n);
}

// ─── SynAnt ───────────────────────────────────────────────────────────────────

export interface SynAntRightItem {
  id: string;              // unique key cho render
  text: string;            // từ đồng/trái nghĩa
  type: "synonym" | "antonym";
  belongsToWordIds: string[]; // word IDs (cột trái) mà item này là đúng
}

/**
 * Xây dựng dữ liệu cột phải cho game SynAnt.
 * Gộp tất cả synonyms + antonyms của các từ ở cột trái,
 * deduplicate theo text, shuffle kết quả.
 */
export function buildSynAntRightItems(words: VocabItem[]): SynAntRightItem[] {
  // Map: text → SynAntRightItem (deduplicate)
  const map = new Map<string, SynAntRightItem>();

  words.forEach(vocab => {
    const syns = toArray(vocab.synonyms);
    const ants = toArray(vocab.antonyms);

    syns.forEach(text => {
      const key = text.toLowerCase().trim();
      if (!key) return;
      if (map.has(key)) {
        map.get(key)!.belongsToWordIds.push(vocab.word);
      } else {
        map.set(key, {
          id: `syn-${key}`,
          text,
          type: "synonym",
          belongsToWordIds: [vocab.word],
        });
      }
    });

    ants.forEach(text => {
      const key = `ant-${text.toLowerCase().trim()}`;
      if (!key.slice(4)) return;
      if (map.has(key)) {
        map.get(key)!.belongsToWordIds.push(vocab.word);
      } else {
        map.set(key, {
          id: key,
          text,
          type: "antonym",
          belongsToWordIds: [vocab.word],
        });
      }
    });
  });

  return shuffle(Array.from(map.values()));
}

/**
 * Lọc vocab có ít nhất 1 synonym hoặc antonym — dùng cho SynAnt game
 */
export function filterVocabWithSynAnt(vocab: VocabItem[]): VocabItem[] {
  return vocab.filter(v => {
    const hasSyn = toArray(v.synonyms).length > 0;
    const hasAnt = toArray(v.antonyms).length > 0;
    return hasSyn || hasAnt;
  });
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/** Deduplicate vocab theo word (dùng khi gộp nhiều deck) */
export function deduplicateVocab(vocab: VocabItem[]): VocabItem[] {
  const seen = new Set<string>();
  return vocab.filter(v => {
    const key = v.word.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Normalize word for audio ─────────────────────────────────────────────────

/** Lấy từ cơ bản để fetch audio (bỏ /, () ) */
export function normalizeWordForAudio(word: string): string {
  return word.split("/")[0].replace(/[()]/g, "").trim();
}
