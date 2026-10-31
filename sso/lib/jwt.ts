import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface JWTPayload {
  sub: string;           // User ID (UUID)
  email: string;
  role: 'USER' | 'SUBADMIN' | 'ADMIN';
  full_name?: string;
  device_id?: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}
