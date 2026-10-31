import cors from 'cors';

const rawCors = process.env.CORS_ORIGINS;
const configuredOrigins = rawCors
  ? rawCors.split(',').map((o: string) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins: (string | RegExp)[] = configuredOrigins.map((o: string) => {
  if (o.includes('*')) {
    return new RegExp('^' + o.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
  }
  return o;
});

export const corsMiddleware = cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (
      isAllowed ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Id']
});
