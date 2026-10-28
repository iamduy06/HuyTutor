import type { CorsOptions } from 'cors';
import { env } from '../config/env.js';

const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/+$/, ''));

export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, curl or server-to-server)
    if (!origin) return callback(null, true);
    const normalized = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(normalized) || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Id'],
};
