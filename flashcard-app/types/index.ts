// ─── Auth / Users ──────────────────────────────────────────────────────────

export type UserRole  = "USER" | "ADMIN";
export type UIMode    = "standard" | "kid";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const WORD_TYPES = [
  "Noun",
  "Verb",
  "Adjective",
  "Adverb",
  "Phrase",
  "Phrasal verb",
  "Idiom",
  "Pronoun",
  "Preposition",
  "Conjunction",
  "Interjection",
  "Determiners",
] as const;

export type WordType = typeof WORD_TYPES[number];

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  max_devices?: number | null;
}

// ─── Decks ─────────────────────────────────────────────────────────────────

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  /** Cefr range: "B1-C2", "A1-A2", "B2" etc — computed from level_min+level_max */
  level: string | null;
  /** Min CEFR level (e.g. "B1") */
  level_min?: string | null;
  /** Max CEFR level (e.g. "C2") */
  level_max?: string | null;
  access_level: "public" | "authenticated" | "authorized" | "preview";
  preview_word_limit?: number;
  created_at: string;
  word_count?: number;
}

// ─── JSONB Content ─────────────────────────────────────────────────────────

export interface VocabItem {
  word: string;
  phonetic?: string;
  meaning: string;
  type?: string;
  example?: string;
  translation?: string;
  synonyms?: string | string[];
  antonyms?: string | string[];
  cefr?: string;
}

export interface Tab {
  id?: string;
  label?: string;
  desc?: string;
  vocabulary: VocabItem[];
}

export interface DeckContent {
  tabs: Tab[];
}

export interface FlashcardRow {
  id: string;
  deck_id: string;
  content: DeckContent | Tab | Tab[];
  created_at: string;
}

// ─── User-Deck progress ────────────────────────────────────────────────────

export interface UserDeck {
  id: string;
  user_id: string;
  deck_id: string;
  progress_percent: number;
  learned_count: number;
  streak: number;
  expired_at: string | null;
  last_studied_at: string | null;
  deck?: Deck;
}

// ─── Devices ───────────────────────────────────────────────────────────────

export interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  ip_address: string | null;
  last_seen: string;
  created_at: string;
}

export interface AppSettings {
  global_max_devices: number;
}

// ─── Flashcard learning state ──────────────────────────────────────────────

export interface Flashcard {
  id: string;
  deck_id: string;
  content: VocabItem;
  order_index?: number;
}
