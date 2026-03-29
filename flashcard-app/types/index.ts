// ─── Auth / Users ──────────────────────────────────────────────────────────

export type UserRole = "USER" | "ADMIN";
export type UIMode  = "standard" | "kid";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

// ─── Decks ─────────────────────────────────────────────────────────────────

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  created_at: string;
  flashcard_count?: number;   // computed client-side
  word_count?: number;        // computed from JSONB
}

// ─── Flashcard JSONB ───────────────────────────────────────────────────────
// The DB stores one row per "unit". content can be:
//   CASE A  { id, label, desc, vocabulary: [...] }   ← single unit object
//   CASE B  [{ id, label, desc, vocabulary: [...] }] ← array of units (legacy)
//
// Use normaliseContent() / normaliseUnits() to get always-array form.

export interface VocabItem {
  word: string;
  phonetic?: string;
  meaning: string;
  type?: string;
  example?: string;
  translation?: string;
  /** comma-separated string OR array */
  synonyms?: string | string[];
  /** comma-separated string OR array */
  antonyms?: string | string[];
  cefr?: CefrLevel | string;
}

export interface FlashcardUnit {
  id?: string;
  label?: string;
  desc?: string;
  vocabulary: VocabItem[];
}

/** Raw row from DB */
export interface FlashcardRow {
  id: string;
  deck_id: string;
  content: FlashcardUnit | FlashcardUnit[];
  created_at: string;
}

// ─── User ↔ Deck ───────────────────────────────────────────────────────────

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

// ─── Admin ─────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  user_decks?: UserDeck[];
}
