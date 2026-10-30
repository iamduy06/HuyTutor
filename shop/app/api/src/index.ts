import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { isSupabaseConfigured } from './config/supabase';
import { isR2Configured } from './services/r2Service';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

const configuredOrigins = (
  process.env.CORS_ORIGINS ||
  'https://huytutor.edu.vn,https://www.huytutor.edu.vn,http://localhost:5173,http://localhost:3000'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins: (string | RegExp)[] = [
  ...configuredOrigins.filter((o) => !o.includes('*')),
  /\.vercel\.app$/,
];

app.use(
  cors({
    origin: allowedOrigins,
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
