import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

function getJwtSecret(): string {
  return process.env.JWT_SECRET!;
}

export const TOKEN_TTL_SECONDS = 3 * 24 * 60 * 60; // 3 days (259,200 seconds)

export interface JWTPayload {
  sub: string;
  email: string;
  role: 'USER' | 'SUBADMIN' | 'ADMIN';
  full_name?: string;
  device_id?: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}
