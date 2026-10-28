import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { corsOptions } from './middlewares/cors.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import apiRouter from './routes/index.js';
import { APP_NAME } from '@huytutor/shared';

const app = express();
const port = env.PORT;

// Trust reverse proxy (Render / Cloudflare) to ensure accurate client IP for rate limiting
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint for Render monitoring
const healthHandler = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: `${APP_NAME} API`,
    version: '2.0.0',
  });
};
app.get('/api/v1/health', healthHandler);
app.get('/health', healthHandler);

// Apply global rate limiter to all API endpoints
app.use('/api/v1', globalLimiter);

// Main API Router under /api/v1 and root fallback
app.use('/api/v1', apiRouter);
app.use('/', apiRouter);

// Global Error Handler for Express 5 native async error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[${APP_NAME} API] Server listening on port ${port} (Node ${process.version})`);
});

export default app;
