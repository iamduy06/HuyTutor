// ── Vocabulary & Flashcard ─────────────────────────────────────────────────

export interface VocabWord {
  word: string;
  phonetic: string;
  meaning: string;
  type: string;
  example: string;
  translation: string;
  synonyms: string[];
  antonyms: string[];
  cefr: string;
}

export interface FlashcardUnit {
  id: string;
  label: string;
  desc: string;
  vocabulary: VocabWord[];
}

// Raw JSONB from DB can be object (1 unit) or array (many units)
export type RawFlashcardContent = FlashcardUnit | FlashcardUnit[];

// Always normalized to array
export function normalizeUnits(raw: RawFlashcardContent): FlashcardUnit[] {
  if (Array.isArray(raw)) return raw;
  return [raw];
}

export function countWords(raw: RawFlashcardContent): number {
  return normalizeUnits(raw).reduce((acc, u) => acc + (u.vocabulary?.length ?? 0), 0);
}

// ── Database rows ──────────────────────────────────────────────────────────

export type UserRole = "USER" | "ADMIN";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  created_at: string;
  word_count?: number;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  content: RawFlashcardContent;
  created_at: string;
}

export interface UserDeck {
  id: string;
  user_id: string;
  deck_id: string;
  progress_percent: number;
  learned_count: number;
  streak: number;
  expired_at: string | null;
  deck?: Deck;
}

// ── UI ─────────────────────────────────────────────────────────────────────

export type UIMode = "standard" | "kid";
