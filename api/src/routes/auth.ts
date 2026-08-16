import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { createAdminClient } from "../lib/supabase";

const router = Router();

/**
 * POST /api/auth/register-device
 * Auth required — register/check device limit
 */
router.post("/register-device", requireAuth, async (req: Request, res: Response) => {
  try {
    const { device_id, device_name } = req.body;
    if (!device_id) return res.status(400).json({ error: "device_id required" });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("role, max_devices")
      .eq("id", req.user.id)
      .single();

    if (profile?.role === "ADMIN") {
      await upsertDevice(admin, req.user.id, device_id, device_name, req);
      return res.json({ allowed: true });
    }

    const { data: setting } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "global_max_devices")
      .single();
    const maxDevices = profile?.max_devices ?? parseInt(setting?.value ?? "3");

    const { data: existing } = await admin
      .from("user_devices")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("device_id", device_id)
      .maybeSingle();

    if (existing) {
      await upsertDevice(admin, req.user.id, device_id, device_name, req);
      return res.json({ allowed: true });
    }

    const { count } = await admin
      .from("user_devices")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.user.id);

    if ((count ?? 0) >= maxDevices) {
      console.warn(`[AUTH] Device blocked for user ${req.user.id}: max ${maxDevices} reached.`);
      return res.json({
        allowed: false,
        message: `Tài khoản đã đạt giới hạn ${maxDevices} thiết bị.`,
        contactUrl: "https://www.facebook.com/huytutor",
        currentCount: count,
        maxDevices,
      });
    }

    await upsertDevice(admin, req.user.id, device_id, device_name, req);
    return res.json({ allowed: true, currentCount: (count ?? 0) + 1, maxDevices });
  } catch (err: any) {
    console.error("[POST /api/auth/register-device]", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

async function upsertDevice(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  deviceId: string,
  deviceName: string | undefined,
  req: Request
) {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    (req.headers["x-real-ip"] as string) ??
    req.socket?.remoteAddress ??
    null;
  await admin.from("user_devices").upsert(
    {
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName ?? null,
      ip_address: ip,
      last_seen: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" }
  );
}

/**
 * POST /api/auth/update-password
 * Auth required — update own password using admin API
 */
router.post("/update-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient.auth.admin.updateUserById(req.user.id, {
      password,
    });

    if (updateError) return res.status(500).json({ error: updateError.message });
    return res.json({ success: true, message: "Mật khẩu đã được cập nhật nhanh chóng." });
  } catch (err: any) {
    console.error("[POST /api/auth/update-password]", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
