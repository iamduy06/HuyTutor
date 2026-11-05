import 'dotenv/config';
import express from 'express';
import apiRouter from './routes';
import { corsGuardMiddleware } from './middlewares/corsGuard';
import { isSupabaseConfigured } from './config/supabase';
import { isR2Configured } from './services/r2Service';

const app = express();
const PORT = Number(process.env.PORT);

// Áp dụng bảo vệ Strict Origin & Chặn CLI (curl, python, scripts)
app.use(corsGuardMiddleware);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check cho Render & UptimeRobot
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'huytutor-api',
    domain: process.env.APP_URL || _req.headers.host || 'huytutor-api',
    databaseMode: isSupabaseConfigured ? 'supabase-postgres-service-role' : 'backend-managed-json-db',
    r2StorageMode: isR2Configured ? 'cloudflare-r2-live' : 'cloudflare-r2-ready',
    timestamp: new Date().toISOString(),
  });
});

// Gắn toàn bộ router nghiệp vụ (/api/auth, /api/user, /api/catalog, /api/orders, /api/admin, /api/webhook)
app.use('/api', apiRouter);

// Global Error Handler Sanitization Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[UNHANDLED_ERROR]', err);
  res.status(err?.status || 500).json({
    ok: false,
    error: 'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.'
  });
});

app.listen(PORT, () => {
  console.log(`[Huy Tutor Shop API] Server listening on port ${PORT}`);
});

export default app;
