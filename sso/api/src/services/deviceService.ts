import { supabaseRest } from '../config/db.js';

export interface DeviceCheckResult {
  allowed: boolean;
  code?: 'DEVICE_LIMIT_EXCEEDED' | 'DEVICE_REGISTERED' | 'DEVICE_EXISTS';
  message?: string;
  quota: number;
  currentCount: number;
  devices?: any[];
}

/**
 * Tính toán hạn mức thiết bị tối đa cho người dùng theo phân cấp:
 * users.max_devices > groups.max_device_per_user > app_settings.global_max_devices > 3
 */
export async function calculateUserDeviceQuota(userId: string): Promise<number> {
  try {
    // 1. Kiểm tra users.max_devices
    const userRes = await supabaseRest(`users?id=eq.${userId}&select=role,max_devices`);
    if (userRes.ok) {
      const users = (await userRes.json()) as any[];
      if (users && users.length > 0 && users[0].max_devices !== null && users[0].max_devices !== undefined) {
        return Number(users[0].max_devices);
      }
    }

    // 2. Kiểm tra groups.max_device_per_user qua group_users
    const groupUsersRes = await supabaseRest(
      `group_users?user_id=eq.${userId}&select=groups(max_device_per_user)`
    );
    if (groupUsersRes.ok) {
      const groupData = (await groupUsersRes.json()) as any[];
      if (Array.isArray(groupData)) {
        for (const item of groupData) {
          const groupQuota = item.groups?.max_device_per_user;
          if (groupQuota !== null && groupQuota !== undefined) {
            return Number(groupQuota);
          }
        }
      }
    }

    // 3. Kiểm tra app_settings.global_max_devices
    const settingsRes = await supabaseRest('app_settings?key=eq.global_max_devices&select=value');
    if (settingsRes.ok) {
      const settings = (await settingsRes.json()) as any[];
      if (settings && settings.length > 0 && settings[0].value) {
        const val = parseInt(settings[0].value, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    }
  } catch (err) {
    console.warn('[Quota calculation fallback to 3]', err);
  }

  // 4. Fallback mặc định là 3 máy
  return 3;
}

/**
 * Kiểm tra và ràng buộc thiết bị theo ngữ cảnh ứng dụng (Context-Aware Device Guard):
 * - Tại Shop: KHÔNG GIỚI HẠN THIẾT BỊ.
 * - Tại Flashcard: BẮT BUỘC KIỂM TRA QUOTA.
 */
export async function checkAndRegisterDevice(params: {
  userId: string;
  userRole: string;
  appName: string;
  deviceId: string;
  deviceName: string;
  userAgent: string;
  ipAddress: string;
}): Promise<DeviceCheckResult> {
  const { userId, userRole, appName, deviceId, deviceName, userAgent, ipAddress } = params;

  // 1. Nếu là Shop hoặc ứng dụng khác ngoài Flashcard: Không giới hạn thiết bị
  if (appName !== 'flashcard') {
    return {
      allowed: true,
      quota: -1,
      currentCount: 0,
      message: 'Không giới hạn thiết bị cho Shop.'
    };
  }

  // 2. Nếu là Admin: Không giới hạn thiết bị
  if (userRole === 'ADMIN') {
    return {
      allowed: true,
      quota: -1,
      currentCount: 0,
      message: 'Tài khoản Quản trị viên được miễn giới hạn thiết bị.'
    };
  }

  if (!deviceId) {
    return {
      allowed: false,
      code: 'DEVICE_LIMIT_EXCEEDED',
      message: 'Thiếu mã định danh phần cứng thiết bị (X-Device-Id).',
      quota: 3,
      currentCount: 0
    };
  }

  // 3. Truy vấn danh sách thiết bị đã đăng ký của user trong public.user_devices
  const devRes = await supabaseRest(
    `user_devices?user_id=eq.${userId}&order=created_at.asc`
  );
  const existingDevices: any[] = devRes.ok ? ((await devRes.json()) as any[]) : [];

  // Kiểm tra xem thiết bị này đã từng đăng ký chưa
  const currentDevice = existingDevices.find((d) => d.device_id === deviceId);

  if (currentDevice) {
    // Đã tồn tại: Cập nhật last_active_at và IP
    await supabaseRest(`user_devices?id=eq.${currentDevice.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        last_active_at: new Date().toISOString(),
        ip_address: ipAddress
      })
    });

    return {
      allowed: true,
      code: 'DEVICE_EXISTS',
      quota: await calculateUserDeviceQuota(userId),
      currentCount: existingDevices.length,
      devices: existingDevices
    };
  }

  // 4. Thiết bị mới chưa đăng ký: Tính toán hạn mức
  const quota = await calculateUserDeviceQuota(userId);

  if (existingDevices.length >= quota) {
    return {
      allowed: false,
      code: 'DEVICE_LIMIT_EXCEEDED',
      message: `Tài khoản của bạn đã đạt giới hạn tối đa ${quota} thiết bị học Flashcard. Thiết bị này chưa được liên kết.`,
      quota,
      currentCount: existingDevices.length,
      devices: existingDevices
    };
  }

  // 5. Chưa vượt hạn mức: Đăng ký thiết bị mới vào public.user_devices
  await supabaseRest('user_devices', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName,
      user_agent: userAgent,
      ip_address: ipAddress,
      is_active: true,
      last_active_at: new Date().toISOString()
    })
  });

  return {
    allowed: true,
    code: 'DEVICE_REGISTERED',
    quota,
    currentCount: existingDevices.length + 1,
    devices: [...existingDevices, { device_id: deviceId, device_name: deviceName }]
  };
}
