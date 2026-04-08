import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { device_id, device_name } = await request.json();
  if (!device_id) return NextResponse.json({ error: "device_id required" }, { status: 400 });

  const admin = createAdminClient();

  // ADMIN không bị giới hạn
  const { data: profile } = await admin
    .from("users").select("role, max_devices").eq("id", user.id).single();
  if (profile?.role === "ADMIN") {
    await upsertDevice(admin, user.id, device_id, device_name, request);
    return NextResponse.json({ allowed: true });
  }

  // Global setting
  const { data: setting } = await admin
    .from("app_settings").select("value").eq("key", "global_max_devices").single();
  const maxDevices = profile?.max_devices ?? parseInt(setting?.value ?? "3");

  // Thiết bị này đã đăng ký chưa?
  const { data: existing } = await admin
    .from("user_devices").select("id")
    .eq("user_id", user.id).eq("device_id", device_id).maybeSingle();

  if (existing) {
    await upsertDevice(admin, user.id, device_id, device_name, request);
    return NextResponse.json({ allowed: true });
  }

  // Đếm thiết bị
  const { count } = await admin
    .from("user_devices").select("*", { count: "exact", head: true }).eq("user_id", user.id);

  if ((count ?? 0) >= maxDevices) {
    return NextResponse.json({
      allowed: false,
      message: `Tài khoản đã đạt giới hạn ${maxDevices} thiết bị.`,
      contactUrl: "https://www.facebook.com/huytutor",
      currentCount: count, maxDevices,
    });
  }

  await upsertDevice(admin, user.id, device_id, device_name, request);
  return NextResponse.json({ allowed: true, currentCount: (count ?? 0) + 1, maxDevices });
}

async function upsertDevice(
  admin: ReturnType<typeof createAdminClient>,
  userId: string, deviceId: string, deviceName: string | undefined, req: NextRequest
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip") ?? null;
  await admin.from("user_devices").upsert({
    user_id: userId, device_id: deviceId,
    device_name: deviceName ?? null, ip_address: ip,
    last_seen: new Date().toISOString(),
  }, { onConflict: "user_id,device_id" });
}
