import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const method = req.method;
  const path = req.originalUrl || req.url;

  // CORS errors
  if (err.message?.startsWith("CORS:")) {
    console.warn(`⚠️ [CORS_ERROR] ${method} ${path} - ${err.message}`);
    return res.status(403).json({ error: err.message });
  }

  console.error(`💥 [UNHANDLED_ERROR] ${method} ${path}:`, err?.message || err);
  if (err?.stack) {
    console.error(err.stack);
  }

  const statusCode = typeof err?.status === "number" && err.status >= 400 && err.status < 600
    ? err.status
    : 500;

  const message = process.env.NODE_ENV === "production"
    ? (err?.publicMessage || "Internal Server Error")
    : (err?.message || "Internal Server Error");

  res.status(statusCode).json({ error: message });
}

