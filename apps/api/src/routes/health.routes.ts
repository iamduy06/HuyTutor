import { Router } from 'express';
import type { Request, Response } from 'express';
import { APP_NAME } from '@huytutor/shared';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: `${APP_NAME} API`,
    version: '2.0.0',
  });
});

export default router;
