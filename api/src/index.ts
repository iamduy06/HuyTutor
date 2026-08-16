import "dotenv/config";
import express from "express";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";

// Routes
import decksRouter from "./routes/decks";
import progressRouter from "./routes/progress";
import authRouter from "./routes/auth";
import gameRouter from "./routes/game";
import meRouter from "./routes/me";

// Admin routes
import adminAnalyticsRouter from "./routes/admin/analytics";
import adminDashboardRouter from "./routes/admin/dashboard";
import adminDecksRouter from "./routes/admin/decks";
import adminUsersRouter from "./routes/admin/users";
import adminGroupsRouter from "./routes/admin/groups";
import adminExportRouter from "./routes/admin/export";
import adminImportRouter from "./routes/admin/import";
import adminDevicesRouter from "./routes/admin/devices";
import adminSettingsRouter from "./routes/admin/settings";
import adminReferencesRouter from "./routes/admin/references";
import adminSubadminsRouter from "./routes/admin/subadmins";
import adminDeckGroupsRouter from "./routes/admin/deck-groups";

// Subadmin routes
import subadminUsersRouter from "./routes/subadmin/users";
import subadminDecksRouter from "./routes/subadmin/decks";
import subadminBrandingRouter from "./routes/subadmin/branding";
import subadminDashboardRouter from "./routes/subadmin/dashboard";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "flashcard-backend",
  });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/decks", decksRouter);
app.use("/api/progress", progressRouter);
app.use("/api/auth", authRouter);
app.use("/api/game", gameRouter);
app.use("/api/me", meRouter);

// Admin
app.use("/api/admin/analytics", adminAnalyticsRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/decks", adminDecksRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/groups", adminGroupsRouter);
app.use("/api/admin/export", adminExportRouter);
app.use("/api/admin/import", adminImportRouter);
app.use("/api/admin/devices", adminDevicesRouter);
app.use("/api/admin/app-settings", adminSettingsRouter);
app.use("/api/admin/references", adminReferencesRouter);
app.use("/api/admin/subadmins", adminSubadminsRouter);
app.use("/api/admin/deck-groups", adminDeckGroupsRouter);

// Subadmin
app.use("/api/subadmin/dashboard", subadminDashboardRouter);
app.use("/api/subadmin/users", subadminUsersRouter);
app.use("/api/subadmin/decks", subadminDecksRouter);
app.use("/api/subadmin/branding", subadminBrandingRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SERVER] Flashcard Backend running on port ${PORT}`);
  console.log(`[SERVER] Health: http://localhost:${PORT}/health`);
  console.log(`[SERVER] ENV: ${process.env.NODE_ENV || "development"}`);
});

export default app;
