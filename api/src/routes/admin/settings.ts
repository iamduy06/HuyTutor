import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

/**
 * GET /api/admin/app-settings
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data: settings, error } = await supabase
      .from("app_settings").select("key, value").eq("key", "global_max_devices").single();

    if (error && error.code !== "PGRST116") return res.status(500).json({ error: error.message });
    return res.json({ global_max_devices: settings?.value || "3" });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PATCH /api/admin/app-settings
 */
router.patch("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { global_max_devices } = req.body;
    if (!global_max_devices) return res.status(400).json({ error: "Missing value" });

    const supabase = createAdminClient();
    const { error } = await supabase.from("app_settings").upsert(
      { key: "global_max_devices", value: global_max_devices.toString() },
      { onConflict: "key" }
    );

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
