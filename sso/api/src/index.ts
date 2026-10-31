import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { corsMiddleware } from './middlewares/cors.js';
import { requireAuth } from './middlewares/auth.js';
import {
  login,
  register,
  logout,
  getMe,
  verifyDevice,
  listDevices,
  revokeAllSessions
} from './controllers/authController.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT);

app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Health check cho Render Web Service & UptimeRobot
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Huy Tutor Centralized SSO API Server',
    version: '2.0.0',
    tokenTtl: '3 days (259,200s)',
    timestamp: new Date().toISOString()
  });
});

// 2. Authentication routes
const authRouter = express.Router();

authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, getMe);
authRouter.post('/verify-device', requireAuth, verifyDevice);
authRouter.get('/devices', requireAuth, listDevices);
authRouter.post('/devices/revoke-all', requireAuth, revokeAllSessions);

app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`[Huy Tutor SSO API] Listening on port ${PORT}`);
  console.log(`[Huy Tutor SSO API] Token & Session TTL: 3 Days (259,200 seconds)`);
});

export default app;
