import cors from "cors";

const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || "";
const explicitAllowedOrigins = allowedOriginsEnv
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Always allow localhost for development
const devOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

const allAllowedOrigins = [...new Set([...explicitAllowedOrigins, ...devOrigins])];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, server-to-server, SSR)
    if (!origin) return callback(null, true);

    // Exact match in configured list
    if (allAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Wildcard match for huytutor.edu.vn and vercel.app domains
    try {
      const url = new URL(origin);
      if (
        url.hostname === "huytutor.edu.vn" ||
        url.hostname.endsWith(".huytutor.edu.vn") ||
        url.hostname.endsWith(".vercel.app") ||
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1"
      ) {
        return callback(null, true);
      }
    } catch {
      // Invalid origin URL format
    }

    console.warn(`⚠️ [CORS] Blocked origin: ${origin}`);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400,
});

