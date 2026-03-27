// ── Core Domain Types ──────────────────────────────────────────────────────

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
  flashcards?: Flashcard[];
  word_count?: number;
}

export interface FlashcardVocab {
  word: string;
  phonetic: string;
  meaning: string;
  type: string;
  example: string;
  translation: string;
  synonyms: string[];
  antonyms: string[];
  cefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | string;
}

export interface FlashcardContent {
  id: string;
  label: string;
  desc: string;
  vocabulary: FlashcardVocab[];
}

export interface Flashcard {
  id: string;
  deck_id: string;
  content: FlashcardContent;
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

// ── UI State Types ──────────────────────────────────────────────────────────

export type UIMode = "standard" | "kid";

export interface UIStore {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
}

// ── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface DemoCardsResponse {
  cards: FlashcardVocab[];
  deck: Pick<Deck, "id" | "title" | "description" | "level">;
}

export interface FullDeckResponse {
  deck: Deck;
  cards: FlashcardContent[];
  isLimited: boolean;
}

// ── Admin Types ─────────────────────────────────────────────────────────────

export interface AdminCreateUserPayload {
  email: string;
  role?: UserRole;
}

export interface AdminAssignDeckPayload {
  user_id: string;
  deck_id: string;
  expired_at: string;
}

export interface AdminAnalytics {
  total_users: number;
  total_decks: number;
  popular_decks: { deck_id: string; title: string; user_count: number }[];
  avg_progress: number;
}
