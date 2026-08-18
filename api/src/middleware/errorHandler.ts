import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // CORS errors
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ error: err.message });
  }
  console.error("[ERROR]", err?.message || err);
  // Never expose stack traces or internal details in production
  const message = process.env.NODE_ENV === "production"
    ? "Internal Server Error"
    : err?.message || "Internal Server Error";
  res.status(err?.status || 500).json({ error: message });
}
