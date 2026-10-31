import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Verify a plain text password against a stored Bcrypt hash ($2a$ / $2b$).
 * 100% compatible with existing 658 Flashcard users.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Hash a password using Bcrypt for new registrations or password resets.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

