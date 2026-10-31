import crypto from 'crypto';

export interface SsoJwtPayload {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN' | string;
  device_id?: string;
  iat?: number;
  exp?: number;
}

/**
 * Verifies a Centralized SSO JWT token using HMAC SHA-256.
 * Zero external dependencies (uses native Node.js crypto).
 */
export function verifySsoJwt(token: string, secret: string): SsoJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const data = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64url');

    if (signatureB64 !== expectedSig) return null;

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson) as SsoJwtPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generates an SSO JWT token for test simulation and cross-module compatibility.
 */
export function signSsoJwt(
  payload: Omit<SsoJwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds: number = 259200
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SsoJwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}
