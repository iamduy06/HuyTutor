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
export function isExpired(expiredAt: string | null | undefined): boolean {
  if (!expiredAt) return false;           // ← NULL/undefined = không bao giờ hết hạn
  const expiryDate = new Date(expiredAt);
  if (isNaN(expiryDate.getTime())) return false; // Tránh lỗi ngày tháng không hợp lệ
  return expiryDate < new Date();
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
  deck: { access_level: any; preview_word_limit?: number },
  userDeck: { expired_at: string | null } | null
): DeckAccess {
  // Admin có toàn quyền
  if (user?.role === "ADMIN") {
    return { canView: true, canLearnFull: true, isPreview: false, previewLimit: null };
  }

  // Chấp nhận cả string (legacy) hoặc object (JSONB)
  const al = deck.access_level;
  const levels = typeof al === "string"
    ? { public: al === "public", authenticated: al === "authenticated", authorized: al === "authorized", preview: al === "preview" }
    : {
        public: !!al?.public,
        authenticated: !!al?.authenticated,
        authorized: !!al?.authorized,
        preview: !!al?.preview
      };

  const preview_word_limit = deck.preview_word_limit;
  const hasAssignment = userDeck !== null;
  const assignmentExpired = hasAssignment && isExpired(userDeck.expired_at);
  const isLoggedIn = user !== null;

  let canView = false;
  let canLearnFull = false;

  // Rule 1: Public - Open for everyone
  if (levels.public) {
    canView = true;
    canLearnFull = true;
  }

  // Rule 2: Authenticated - Open for logged in users
  if (levels.authenticated && isLoggedIn) {
    canView = true;
    canLearnFull = true;
  }

  // Rule 3: Authorized - Requires assignment and NOT EXPIRED
  if (levels.authorized && hasAssignment && !assignmentExpired) {
    canView = true;
    canLearnFull = true;
  }

  // CAUTION: Nếu có assignment nhưng HẾT HẠN, và deck KHÔNG phải public/auth, 
  // thì dù có preview:true cũng không được học full.
  
  // Rule 4: Preview - Show limited words if not already full access
  if (levels.preview && !canLearnFull) {
    canView = true;
    // logic isPreview sẽ được dùng ở page để quyết định render gì
  }

  return {
    canView,
    canLearnFull,
    isPreview: levels.preview && !canLearnFull,
    previewLimit: preview_word_limit ?? 10
  };
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
