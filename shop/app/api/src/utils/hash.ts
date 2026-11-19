import crypto from 'crypto';
import { isValidUiFormat, UiFormatCode } from '../constants/formatMapping';
import type { CompactCartItem } from '../services/dbService';

/**
 * Băm chuỗi một chiều bằng thuật toán SHA3-256 (64 ký tự hex).
 */
export function hashSha3_256(plainText: string): string {
  return crypto.createHash('sha3-256').update(plainText, 'utf8').digest('hex');
}

/**
 * Kiểm tra mật khẩu đầu vào có khớp với chuỗi băm SHA3-256 đã lưu hay không.
 * Sử dụng timingSafeEqual để chống tấn công timing attack.
 */
export function verifySha3_256(plainText: string, expectedHash: string): boolean {
  const actualHash = hashSha3_256(plainText);
  if (actualHash.length !== expectedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(actualHash, 'utf8'),
    Buffer.from(expectedHash, 'utf8')
  );
}

/**
 * Sinh chuỗi token ngẫu nhiên an toàn (dùng cho session_token và reset_password_token).
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Chuẩn hóa mảng CompactCartItem:
 * - Lọc bỏ item không hợp lệ (thiếu productId hoặc formatCode không thuộc danh mục hỗ trợ)
 * - Đảm bảo quantity >= 1
 * - Áp dụng quy chuẩn số lượng = 1 cho định dạng phi Flashcard
 * - Sắp xếp ổn định (deterministic canonical order) theo `${productId}:${formatCode}`
 */
export function canonicalizeCartItems(rawItems: any[]): CompactCartItem[] {
  if (!Array.isArray(rawItems)) return [];

  const validItems: CompactCartItem[] = [];
  for (const item of rawItems) {
    const productId = String(item?.productId || '').trim();
    const formatCode = String(item?.formatCode || '').trim();
    if (!productId || !isValidUiFormat(formatCode)) continue;

    const quantity = Math.max(1, Math.floor(Number(item?.quantity) || 1));
    const selected = item?.selected !== false;
    const comboPackageId = item?.comboPackageId ? String(item.comboPackageId).trim() : null;
    const isUpgrade = Boolean(item?.isUpgrade);

    validItems.push({
      productId,
      formatCode: formatCode as UiFormatCode,
      quantity: formatCode === 'Flashcard' ? quantity : 1,
      selected,
      comboPackageId,
      isUpgrade,
    });
  }

  return validItems.sort((a, b) => {
    const keyA = `${a.productId}:${a.formatCode}`;
    const keyB = `${b.productId}:${b.formatCode}`;
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
}

/**
 * Tính toán mã băm SHA-256 (64 ký tự hex) từ danh sách món chuẩn hóa.
 */
export function computeCartHash(items: any[]): string {
  const canonical = canonicalizeCartItems(items);
  const jsonStr = JSON.stringify(canonical);
  return crypto.createHash('sha256').update(jsonStr, 'utf8').digest('hex');
}
