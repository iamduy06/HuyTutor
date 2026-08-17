import { Request, Response, NextFunction } from "express";

/**
 * Enhanced Logger Middleware
 * Logs every incoming request and outgoing response with timing, status, and payload details.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.originalUrl || req.url;
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress;
  const origin = req.headers.origin || req.headers.referer || "direct";

  // Sanitize body (hide password)
  let safeBody: any = undefined;
  if (req.body && typeof req.body === "object") {
    safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = "******";
  }

  const queryStr = Object.keys(req.query).length > 0 ? ` Query: ${JSON.stringify(req.query)}` : "";
  const bodyStr = safeBody && Object.keys(safeBody).length > 0 ? ` Body: ${JSON.stringify(safeBody)}` : "";

  console.log(`📥 [REQ] ${timestamp} ${method} ${path} (Origin: ${origin}, IP: ${ip})${queryStr}${bodyStr}`);

  // Intercept response
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  let responseBody: any = null;

  res.json = (body: any): Response => {
    responseBody = body;
    return originalJson(body);
  };

  res.send = (body: any): Response => {
    if (!responseBody) {
      try {
        responseBody = typeof body === "string" ? JSON.parse(body) : body;
      } catch {
        responseBody = body;
      }
    }
    return originalSend(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusIcon = status < 300 ? "🟢" : status < 400 ? "🟡" : status < 500 ? "🟠" : "🔴";

    let payloadSummary = "";
    if (responseBody !== null && responseBody !== undefined) {
      if (typeof responseBody === "object") {
        if (Array.isArray(responseBody)) {
          payloadSummary = `Array(${responseBody.length})`;
        } else {
          const keys = Object.keys(responseBody);
          const previewParts = keys.map((k) => {
            const val = responseBody[k];
            if (Array.isArray(val)) return `${k}: Array(${val.length})`;
            if (typeof val === "object" && val !== null) return `${k}: {Object}`;
            return `${k}: ${String(val).slice(0, 30)}`;
          });
          payloadSummary = `{ ${previewParts.join(", ")} }`;
        }
      } else {
        payloadSummary = String(responseBody).slice(0, 100);
      }
    }

    const authUser = (req as any).user ? ` [User: ${(req as any).user.email || (req as any).user.id}]` : "";
    console.log(`📤 [RES] ${statusIcon} ${method} ${path} -> ${status} (${duration}ms)${authUser} | Data: ${payloadSummary}`);
  });

  next();
}
