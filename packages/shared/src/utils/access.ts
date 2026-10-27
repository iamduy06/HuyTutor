export interface DeckAccess {
  canView: boolean;
  canLearnFull: boolean;
  isPreview: boolean;
  previewLimit: number | null;
}

/**
 * Hết hạn khi:
 *   - expired_at có giá trị VÀ thời điểm đó ≤ now()
 * KHÔNG hết hạn khi:
 *   - expired_at là NULL → học mãi mãi
 */
export function isExpired(expiredAt: string | null): boolean {
  if (!expiredAt) return false;
  return new Date(expiredAt) <= new Date();
}

/**
 * Có quyền học đầy đủ khi:
 *   - Có record trong user_decks VÀ chưa hết hạn
 */
export function hasFullAccess(expiredAt: string | null | undefined): boolean {
  if (expiredAt === undefined) return false;
  return !isExpired(expiredAt);
}

/**
 * Hàm kiểm tra quyền truy cập bộ đề trung tâm
 */
export function getDeckAccess(
  user: { role: string } | null,
  deck: { access_level?: Record<string, any> | null },
  userDeck: { expired_at: string | null } | null
): DeckAccess {
  if (user?.role === "ADMIN") {
    return { canView: true, canLearnFull: true, isPreview: false, previewLimit: null };
  }

  const levels = deck?.access_level || {};
  const hasAssignment = userDeck !== null && !isExpired(userDeck.expired_at);
  const isLoggedIn = user !== null;

  let canView = false;
  let canLearnFull = false;

  // Rule 1: Public - Không cần đăng nhập
  if (levels.public === true) {
    canView = true;
    canLearnFull = true;
  }
  // Rule 2: Auth - Dành cho thành viên đăng nhập
  else if (levels.auth === true && isLoggedIn) {
    canView = true;
    canLearnFull = true;
  }
  // Rule 3: Paid - Dành cho người mua và CÒN HẠN
  else if (levels.paid === true && hasAssignment) {
    canView = true;
    canLearnFull = true;
  }
  // Rule 4: Preview - Cho phép xem thử một phần
  else if (levels.preview === true) {
    canView = true;
  }

  return {
    canView,
    canLearnFull,
    isPreview: levels.preview === true && !canLearnFull,
    previewLimit: levels.preview_word_limit ?? 10,
  };
}
