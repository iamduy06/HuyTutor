import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Tab, FlashcardRow, VocabItem, DeckContent } from "@/types";

// ─── Tailwind ──────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Misc ──────────────────────────────────────────────────────────────────

export function generatePassword(length = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

/**
 * Hết hạn khi:
 *   - expired_at có giá trị VÀ thời điểm đó ≤ now()
 * KHÔNG hết hạn khi:
 *   - expired_at là NULL → học mãi mãi
 */
export function isExpired(expiredAt: string | null): boolean {
  if (!expiredAt) return false;           // ← NULL = không hết hạn
  return new Date(expiredAt) <= new Date();
}

/**
 * Có quyền học đầy đủ khi:
 *   - Có record trong user_decks VÀ chưa hết hạn
 */
export function hasFullAccess(expiredAt: string | null | undefined): boolean {
  if (expiredAt === undefined) return false;  // không có record user_decks
  return !isExpired(expiredAt);               // null → false → !false = true ✓
}

export interface DeckAccess {
  canView: boolean;
  canLearnFull: boolean;
  isPreview: boolean;
  previewLimit: number | null;
}

/**
 * Hàm kiểm tra quyền truy cập bộ đề trung tâm
 */
export function getDeckAccess(
  user: { role: string } | null,
  deck: { access_level: string; preview_word_limit?: number },
  userDeck: { expired_at: string | null } | null
): DeckAccess {
  // Admin có toàn quyền
  if (user?.role === "ADMIN") {
    return { canView: true, canLearnFull: true, isPreview: false, previewLimit: null };
  }

  const { access_level, preview_word_limit } = deck;
  const hasAssignment = userDeck !== null && !isExpired(userDeck.expired_at);

  // 3.1. PUBLIC
  if (access_level === "public") {
    return { canView: true, canLearnFull: true, isPreview: false, previewLimit: null };
  }

  // 3.2. AUTHENTICATED
  if (access_level === "authenticated") {
    const isLoggedIn = user !== null;
    return {
      canView: isLoggedIn,
      canLearnFull: isLoggedIn,
      isPreview: false,
      previewLimit: null
    };
  }

  // 3.3. AUTHORIZED
  if (access_level === "authorized") {
    return {
      canView: hasAssignment,
      canLearnFull: hasAssignment,
      isPreview: false,
      previewLimit: null
    };
  }

  // 3.4. PREVIEW
  if (access_level === "preview") {
    if (hasAssignment) {
      return { canView: true, canLearnFull: true, isPreview: false, previewLimit: null };
    }
    return {
      canView: true,
      canLearnFull: false,
      isPreview: true,
      previewLimit: preview_word_limit ?? 10
    };
  }

  // Mặc định: Từ chối
  return { canView: false, canLearnFull: false, isPreview: false, previewLimit: null };
}

export function getCefrColor(cefr: string): string {
  const map: Record<string, string> = {
    A1: "bg-green-100 text-green-800",
    A2: "bg-blue-100 text-blue-800",
    B1: "bg-yellow-100 text-yellow-800",
    B2: "bg-orange-100 text-orange-800",
    C1: "bg-purple-100 text-purple-800",
    C2: "bg-red-100 text-red-800",
  };
  return map[cefr] ?? "bg-gray-100 text-gray-700";
}

// ─── JSONB Normalisation ───────────────────────────────────────────────────
//
// 3 format có thể có trong DB:
//   Format A (mới): { tabs: [{ id, label, desc, vocabulary: [...] }, ...] }
//   Format B (cũ) : { id, label, vocabulary: [...] }   ← single unit object
//   Format C (cũ) : [{ id, label, vocabulary: [...] }] ← array of unit objects
//   Format D (cũ) : { word, phonetic, ... }             ← flat word object (row per word)
//
// extractTabs() luôn trả về Tab[] bất kể format nào.

export function extractTabs(raw: FlashcardRow["content"]): Tab[] {
  if (!raw) return [];

  // Format A: { tabs: [...] }
  if (!Array.isArray(raw) && "tabs" in raw && Array.isArray((raw as DeckContent).tabs)) {
    return (raw as DeckContent).tabs;
  }

  // Format C: [{ id, label, vocabulary }, ...]
  if (Array.isArray(raw)) {
    // Mảng unit
    if (raw.length > 0 && "vocabulary" in raw[0]) return raw as Tab[];
    // Mảng flat word (rất hiếm)
    return [{ vocabulary: raw as unknown as VocabItem[] }];
  }

  // Format B: { id, label, vocabulary }
  if ("vocabulary" in raw) return [raw as Tab];

  // Format D: { word, phonetic, meaning, ... } ← flat word row
  if ("word" in raw) return [{ vocabulary: [raw as unknown as VocabItem] }];

  return [];
}

/**
 * Lấy tất cả từ vựng flatten từ 1 row DB
 */
export function extractVocab(row: FlashcardRow): VocabItem[] {
  return extractTabs(row.content).flatMap(t => t.vocabulary ?? []);
}

/**
 * Đếm tổng số từ trong 1 row DB
 */
export function countWords(row: FlashcardRow): number {
  return extractVocab(row).length;
}

/**
 * Chuẩn hoá synonyms/antonyms:
 *   "word1, word2" → ["word1", "word2"]
 *   ["word1", "word2"] → ["word1", "word2"]
 */
export function toArray(val: string | string[] | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return val.split(",").map(s => s.trim()).filter(Boolean);
}
