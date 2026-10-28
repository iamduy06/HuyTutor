import type { CorsOptions } from 'cors';
import { env } from '../config/env.js';

const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/+$/, ''));

export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // SEC-015: Origin Validation & Safe Handling of Non-Browser Requests
    if (!origin) {
      // In development/test, permit requests without Origin for tooling (curl, Postman, test runner)
      if (env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      // In production, server-to-server calls (e.g. Next.js SSR) are permitted,
      // but without reflecting or exposing permissive CORS headers to browsers
      return callback(null, true);
    }

    const normalized = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(normalized) || (env.NODE_ENV === 'development' && origin.startsWith('http://localhost'))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Id'],
};
