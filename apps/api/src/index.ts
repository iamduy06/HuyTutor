import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { APP_NAME } from '@huytutor/shared';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(helmet());
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,https://flashcard.huytutor.edu.vn')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Not Allowed'));
    }
  },
  credentials: true,
}));

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: APP_NAME + ' API',
    version: '2.0.0',
    nodeVersion: process.version,
  });
});

app.listen(port, () => {
  console.log(`[${APP_NAME} API] Server listening on port ${port} (Node ${process.version})`);
});

export default app;
