export type UserRole = "USER" | "ADMIN";

export interface UserProfile {
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
  flashcard_count?: number;
}

export interface FlashcardContent {
  word: string;
  phonetic: string;
  meaning: string;
  type: string;
  example: string;
  translation: string;
  synonyms: string[];
  antonyms: string[];
  cefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

export interface Flashcard {
  id: string;
  deck_id: string;
  content: FlashcardContent;
  order_index: number;
}

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

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  user_decks?: UserDeck[];
}

export type UIMode = "standard" | "kid";
