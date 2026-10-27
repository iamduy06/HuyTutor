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

export type WordType = (typeof WORD_TYPES)[number];

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

export interface Flashcard {
  id: string;
  deck_id: string;
  content: VocabItem;
  order_index?: number;
}
