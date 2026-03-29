// ─── Auth / Users ──────────────────────────────────────────────────────────

export type UserRole  = "USER" | "ADMIN";
export type UIMode    = "standard" | "kid";
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
  word_count?: number;   // tổng số từ trong tất cả tabs
}

// ─── JSONB Content Structure ───────────────────────────────────────────────
//
// Mỗi deck có 1 row trong bảng flashcards.
// content = { tabs: Tab[] }
//
// Tab tương đương với const tabs trong file Embed Flashcard:
//   { id, label, desc, vocabulary: VocabItem[] }
//
// Backward-compat: content có thể là:
//   A) { tabs: [...] }          ← chuẩn mới
//   B) { id, label, vocabulary } ← unit đơn (legacy)
//   C) [{ id, label, vocabulary }, ...] ← mảng unit (legacy)

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

/** Wrapper dạng chuẩn mới */
export interface DeckContent {
  tabs: Tab[];
}

/** Raw row từ DB */
export interface FlashcardRow {
  id: string;
  deck_id: string;
  content: DeckContent | Tab | Tab[];
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
  /** NULL = không hết hạn (có thể học mãi mãi) */
  expired_at: string | null;
  last_studied_at?: string | null;
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
