import crypto from 'crypto';

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
