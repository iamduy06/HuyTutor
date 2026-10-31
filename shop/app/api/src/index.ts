import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { isSupabaseConfigured } from './config/supabase';
import { isR2Configured } from './services/r2Service';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT);

const configuredOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins: (string | RegExp)[] = [
  ...configuredOrigins.filter((o) => !o.includes('*')),
  /\.vercel\.app$/,
  /\.vercel$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed instanceof RegExp) return allowed.test(origin);
        return allowed === origin;
      });
      if (isAllowed || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check cho Render & UptimeRobot
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'huytutor-api',
    domain: 'api.huytutor.edu.vn',
    databaseMode: isSupabaseConfigured ? 'supabase-postgres-service-role' : 'backend-managed-json-db',
    r2StorageMode: isR2Configured ? 'cloudflare-r2-live' : 'cloudflare-r2-ready',
    timestamp: new Date().toISOString(),
  });
});

// Mount toàn bộ API dưới prefix /api
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`[HuyTutor Backend API] Listening on http://localhost:${PORT}`);
  console.log(
    `[HuyTutor Backend API] 100% Database flows routed through Backend (${
      isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Local Persistent DB + Seed'
    })`
  );
});

export default app;
