export interface AccessLevelConfig {
  public: boolean;
  auth: boolean;
  paid: boolean;
  preview: boolean;
  preview_word_limit: number;
}

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  level_min: string | null;
  level_max: string | null;
  access_level: AccessLevelConfig;
  group_id: string | null;
  created_at: string;
  word_count?: number;
}

export interface DeckGroup {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
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
  last_studied_at: string | null;
  deck?: Deck;
}
