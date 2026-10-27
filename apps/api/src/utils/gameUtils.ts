import type { VocabItem } from '@huytutor/shared';

/**
 * Fisher-Yates shuffle returning a new shuffled array
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deduplicate vocab items by word (case-insensitive)
 */
export function deduplicateVocab(vocab: VocabItem[]): VocabItem[] {
  const seen = new Set<string>();
  return vocab.filter(v => {
    const key = v.word.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
