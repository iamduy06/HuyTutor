import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { registerDeviceSchema, updatePasswordSchema } from '@huytutor/shared';
import { getAdminClient } from '../config/supabase.js';

const router = Router();

// POST /auth/register-device
router.post(
  '/auth/register-device',
  requireAuth,
  validate({ body: registerDeviceSchema }),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const { device_id, device_name } = req.body;
    const admin = getAdminClient();

    // 1. ADMIN is never limited
    if (user.role === 'ADMIN') {
      await upsertDevice(admin, user.id, device_id, device_name, req);
      return res.status(200).json({ allowed: true });
    }

    // 2. Query profile for custom max_devices or fetch global setting
    const { data: profile } = await admin
      .from('users')
      .select('max_devices')
      .eq('id', user.id)
      .single();

    const { data: setting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'global_max_devices')
      .single();

    const maxDevices = profile?.max_devices ?? parseInt(setting?.value ?? '3', 10);

    // 3. Check if device already registered
    const { data: existing } = await admin
      .from('user_devices')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_id', device_id)
      .maybeSingle();

    if (existing) {
      await upsertDevice(admin, user.id, device_id, device_name, req);
      return res.status(200).json({ allowed: true });
    }

    // 4. Count existing devices
    const { count } = await admin
      .from('user_devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) >= maxDevices) {
      return res.status(200).json({
        allowed: false,
        message: `Tài khoản đã đạt giới hạn ${maxDevices} thiết bị.`,
        contactUrl: 'https://web.facebook.com/huytutor',
        currentCount: count,
        maxDevices,
      });
    }

    await upsertDevice(admin, user.id, device_id, device_name, req);
    return res.status(200).json({
      allowed: true,
      currentCount: (count ?? 0) + 1,
      maxDevices,
    });
  }
);

// POST /auth/update-password
router.post(
  '/auth/update-password',
  requireAuth,
  validate({ body: updatePasswordSchema }),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const { password } = req.body;
    const admin = getAdminClient();

    const { error } = await admin.auth.admin.updateUserById(user.id, { password });

    if (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'UPDATE_PASSWORD_FAILED', message: error.message },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được cập nhật thành công.',
    });
  }
);

async function upsertDevice(
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
  deviceId: string,
  deviceName: string | undefined,
  req: Request
) {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    null;

  await admin.from('user_devices').upsert(
    {
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName ?? null,
      ip_address: ip,
      last_seen: new Date().toISOString(),
    },
    { onConflict: 'user_id,device_id' }
  );
}

export default router;
