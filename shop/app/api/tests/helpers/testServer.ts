import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { Server } from 'http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..', '..');
const distRouterPath = path.resolve(apiRoot, 'dist', 'routes', 'index.js');
const srcRouterPath = path.resolve(apiRoot, 'src', 'routes', 'index.ts');

// Ensure dist is built and fresh
if (
  !fs.existsSync(distRouterPath) ||
  (fs.existsSync(srcRouterPath) && fs.statSync(srcRouterPath).mtimeMs > fs.statSync(distRouterPath).mtimeMs)
) {
  execSync('npm run build', { cwd: apiRoot, stdio: 'ignore' });
}

const req = createRequire(import.meta.url);
const r2Service = req(path.resolve(apiRoot, 'dist', 'services', 'r2Service.js'));
const adminCtrl = req(path.resolve(apiRoot, 'dist', 'controllers', 'adminController.js'));
const apiRouterModule = req(distRouterPath);
const apiRouter = apiRouterModule.default || apiRouterModule;

export const __setSimulatedR2Objects = r2Service.__setSimulatedR2ObjectsForTesting;
export const __clearSimulatedR2Objects = r2Service.__clearSimulatedR2ObjectsForTesting;
export const __getSimulatedR2Objects = r2Service.__getSimulatedR2ObjectsForTesting;
export const __setMockUsages = adminCtrl.__setMockUsagesForTesting;
export const __clearMockUsages = adminCtrl.__clearMockUsagesForTesting;

export type { MediaItem } from '../../src/services/r2Service.ts';
export type { MediaUsage } from '../../src/controllers/adminController.ts';

export interface TestServerContext {
  baseUrl: string;
  server: Server;
  fetch: (path: string, init?: RequestInit) => Promise<globalThis.Response>;
  close: () => Promise<void>;
}

export async function createTestServer(): Promise<TestServerContext> {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  if (!process.env.ADMIN_API_SECRET) {
    process.env.ADMIN_API_SECRET = 'test-admin-secret';
  }

  // Mount real application router
  app.use('/api', apiRouter);

  // Global 404 handler returning JSON error per GEMINI.md §4
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      ok: false,
      error: 'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
    });
  });

  // Global error sanitization middleware per GEMINI.md §4
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.code === 'LIMIT_FILE_SIZE' ? 413 : (err?.status || err?.statusCode || 500);
    res.status(status).json({
      ok: false,
      error:
        status === 413
          ? 'Dung lượng file vượt quá giới hạn 50MB.'
          : 'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
    });
  });

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    server,
    async fetch(urlPath: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers || {});
      if (!headers.has('x-admin-key') && !headers.has('Authorization')) {
        headers.set('x-admin-key', process.env.ADMIN_API_SECRET || 'test-admin-secret');
      }
      if (!headers.has('origin')) {
        headers.set('origin', baseUrl);
      }
      return fetch(`${baseUrl}${urlPath}`, { ...init, headers });
    },
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
