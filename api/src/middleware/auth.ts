import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/supabase";
import { createAdminClient } from "../lib/supabase";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userProfile?: any;
    }
  }
}

/**
 * Middleware: Require valid Supabase JWT from Authorization header.
 * Attaches req.user on success.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: missing Bearer token" });
  }
  const token = authHeader.slice(7);
  const user = await verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
  req.user = user;
  next();
}

/**
 * Middleware: Require ADMIN role.
 * Must be used AFTER requireAuth.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", req.user.id).single();
  if (data?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: ADMIN role required" });
  }
  req.userProfile = data;
  next();
}

/**
 * Middleware: Require SUBADMIN or ADMIN role.
 * Must be used AFTER requireAuth.
 */
export async function requireSubAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("*").eq("id", req.user.id).single();
  if (!data || (data.role !== "SUBADMIN" && data.role !== "ADMIN")) {
    return res.status(403).json({ error: "Forbidden: SUBADMIN role required" });
  }
  req.userProfile = data;
  next();
}
