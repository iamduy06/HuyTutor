// ─── Types ─────────────────────────────────────────────────────────────────

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

// ─── Password ──────────────────────────────────────────────────────────────

export function generatePassword(length = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ─── JSONB Normalisation ───────────────────────────────────────────────────

export function extractTabs(raw: FlashcardRow["content"]): Tab[] {
  if (!raw) return [];
  if (!Array.isArray(raw) && "tabs" in raw && Array.isArray((raw as DeckContent).tabs)) {
    return (raw as DeckContent).tabs;
  }
  if (Array.isArray(raw)) {
    if (raw.length > 0 && "vocabulary" in raw[0]) return raw as Tab[];
    return [{ vocabulary: raw as unknown as VocabItem[] }];
  }
  if ("vocabulary" in raw) return [raw as Tab];
  if ("word" in raw) return [{ vocabulary: [raw as unknown as VocabItem] }];
  return [];
}

// ─── Access control ────────────────────────────────────────────────────────

export function isExpired(expiredAt: string | null): boolean {
  if (!expiredAt) return false;
  return new Date(expiredAt) <= new Date();
}

export function hasFullAccess(expiredAt: string | null | undefined): boolean {
  if (expiredAt === undefined) return false;
  return !isExpired(expiredAt);
}

export interface DeckAccess {
  canView: boolean;
  canLearnFull: boolean;
  isPreview: boolean;
  previewLimit: number | null;
}

export function getDeckAccess(
  user: { role: string } | null,
  deck: { access_level: any },
  userDeck: { expired_at: string | null } | null
): DeckAccess {
  if (user?.role === "ADMIN") {
    return { canView: true, canLearnFull: true, isPreview: false, previewLimit: null };
  }
  const levels = deck.access_level || {};
  const hasAssignment = userDeck !== null && !isExpired(userDeck.expired_at);
  const isLoggedIn = user !== null;
  let canView = false;
  let canLearnFull = false;
  if (levels.public === true) { canView = true; canLearnFull = true; }
  else if (levels.auth === true && isLoggedIn) { canView = true; canLearnFull = true; }
  else if (levels.paid === true && hasAssignment) { canView = true; canLearnFull = true; }
  else if (levels.preview === true) { canView = true; }
  return {
    canView, canLearnFull,
    isPreview: levels.preview === true && !canLearnFull,
    previewLimit: levels.preview_word_limit ?? 10
  };
}

// ─── Misc ──────────────────────────────────────────────────────────────────

export function toArray(val: string | string[] | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Shuffle (Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deduplicate vocab by word */
export function deduplicateVocab(vocab: VocabItem[]): VocabItem[] {
  const seen = new Set<string>();
  return vocab.filter((v) => {
    const key = v.word.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function computeLevelStr(min: string | null, max: string | null): string | null {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min} - ${max}`;
  return min ?? max;
}

/** JSON array → CSV string */
export function jsonToCsv(items: any[], columns: string[]): string {
  const header = columns.join(",");
  const rows = items.map((item) =>
    columns.map((col) => {
      let val = item[col];
      if (val === null || val === undefined) val = "";
      if (typeof val === "object") val = JSON.stringify(val);
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );
  return [header, ...rows].join("\n");
}
