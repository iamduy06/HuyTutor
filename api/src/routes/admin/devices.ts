import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

/**
 * GET /api/admin/devices?user_id=xxx
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;
    const supabase = createAdminClient();

    if (userId) {
      const { data: devices } = await supabase
        .from("user_devices").select("*").eq("user_id", userId).order("last_seen", { ascending: false });
      return res.json({ devices: devices ?? [] });
    }

    const { data: setting } = await supabase
      .from("app_settings").select("value").eq("key", "global_max_devices").single();
    return res.json({ global_max_devices: parseInt(setting?.value ?? "3") });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PATCH /api/admin/devices
 */
router.patch("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const supabase = createAdminClient();

    if (body.global_max_devices !== undefined) {
      await supabase.from("app_settings").upsert({ key: "global_max_devices", value: String(body.global_max_devices) }, { onConflict: "key" });
      return res.json({ success: true });
    }

    if (body.user_id && body.max_devices !== undefined) {
      await supabase.from("users").update({ max_devices: body.max_devices === null ? null : Number(body.max_devices) }).eq("id", body.user_id);
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Invalid body" });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * DELETE /api/admin/devices
 */
router.delete("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const supabase = createAdminClient();

    if (body.device_id) {
      await supabase.from("user_devices").delete().eq("id", body.device_id);
    } else if (body.user_id) {
      await supabase.from("user_devices").delete().eq("user_id", body.user_id);
    } else {
      return res.status(400).json({ error: "device_id or user_id required" });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
