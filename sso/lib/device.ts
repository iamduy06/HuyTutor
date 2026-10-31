import { supabaseRest } from './db';

export interface DeviceLimitResult {
  allowed: boolean;
  effectiveMax: number;
  currentCount: number;
  message?: string;
}

/**
 * Calculates effective max devices for a user following Flashcard hierarchy:
 * 1. Admin: Unlimited (Infinity)
 * 2. User max_devices in public.users
 * 3. Group max_device_per_user from public.groups (via group_users)
 * 4. Global setting from public.app_settings (global_max_devices)
 * 5. Fallback: 3
 */
export async function calculateEffectiveMaxDevices(userId: string, role: string): Promise<number> {
  if (role === 'ADMIN') return Infinity;

  try {
    // 2. Check user personal max_devices
    const uRes = await supabaseRest(`users?id=eq.${userId}&select=max_devices`);
    if (uRes.ok) {
      const uData = await uRes.json();
      if (uData?.[0]?.max_devices !== null && uData?.[0]?.max_devices !== undefined) {
        return Number(uData[0].max_devices);
      }
    }

    // 3. Check group limit
    const gRes = await supabaseRest(`group_users?user_id=eq.${userId}&select=group_id,groups(max_device_per_user)`);
    if (gRes.ok) {
      const gData = await gRes.json();
      const groupMax = gData?.[0]?.groups?.max_device_per_user;
      if (groupMax !== null && groupMax !== undefined) {
        return Number(groupMax);
      }
    }

    // 4. Check global app_settings
    const sRes = await supabaseRest(`app_settings?key=eq.global_max_devices&select=value`);
    if (sRes.ok) {
      const sData = await sRes.json();
      if (sData?.[0]?.value) {
        return parseInt(sData[0].value, 10);
      }
    }
  } catch (err) {
    console.warn('[calculateEffectiveMaxDevices error]', err);
  }

  // 5. Fallback default
  return 3;
}

/**
 * Checks and binds a device for Flashcard according to atomic policy:
 * - If device already exists in user_devices: ALLOWED
 * - If new device and count < effectiveMax: REGISTER & ALLOWED
 * - If new device and count >= effectiveMax: BLOCKED
 */
export async function enforceFlashcardDevice(
  userId: string,
  role: string,
  deviceId: string,
  deviceName: string,
  ipAddress: string
): Promise<DeviceLimitResult> {
  if (!deviceId) {
    return { allowed: true, effectiveMax: 3, currentCount: 0 };
  }

  if (role === 'ADMIN') {
    await registerOrTouchDevice(userId, deviceId, deviceName, ipAddress);
    return { allowed: true, effectiveMax: Infinity, currentCount: 0 };
  }

  const effectiveMax = await calculateEffectiveMaxDevices(userId, role);

  // 1. Check if device is already registered
  const existRes = await supabaseRest(`user_devices?user_id=eq.${userId}&device_id=eq.${encodeURIComponent(deviceId)}&select=id`);
  if (existRes.ok) {
    const existData = await existRes.json();
    if (existData.length > 0) {
      // Already registered, update last seen
      await registerOrTouchDevice(userId, deviceId, deviceName, ipAddress);
      return { allowed: true, effectiveMax, currentCount: existData.length };
    }
  }

  // 2. Count current devices
  const countRes = await supabaseRest(`user_devices?user_id=eq.${userId}&select=id`, {
    headers: { 'Prefer': 'count=exact', 'Range': '0-0' }
  });
  const cr = countRes.headers.get('content-range');
  const count = cr ? parseInt(cr.split('/')[1] || '0', 10) : 0;

  if (count >= effectiveMax) {
    return {
      allowed: false,
      effectiveMax,
      currentCount: count,
      message: `Tài khoản Flashcard của bạn đã đạt giới hạn tối đa ${effectiveMax} thiết bị được phép học.`
    };
  }

  // 3. Register new device
  await registerOrTouchDevice(userId, deviceId, deviceName, ipAddress);
  return { allowed: true, effectiveMax, currentCount: count + 1 };
}

export async function registerOrTouchDevice(
  userId: string,
  deviceId: string,
  deviceName: string,
  ipAddress: string
) {
  try {
    await supabaseRest(`user_devices`, {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        user_id: userId,
        device_id: deviceId,
        device_name: deviceName || 'Trình duyệt Web',
        ip_address: ipAddress || '',
        last_seen: new Date().toISOString()
      })
    });
  } catch (err) {
    console.warn('[registerOrTouchDevice error]', err);
  }
}

