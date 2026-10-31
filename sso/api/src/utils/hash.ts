import bcrypt from 'bcryptjs';

/**
 * So sánh mật khẩu người dùng nhập vào với mã hash bcrypt được lưu trong DB
 * Hỗ trợ các chuẩn hash $2a$, $2b$, $2y$ của Supabase GoTrue
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error('[Verify password error]', err);
    return false;
  }
}

/**
 * Mã hóa mật khẩu người dùng bằng bcrypt (salt rounds = 10)
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}
