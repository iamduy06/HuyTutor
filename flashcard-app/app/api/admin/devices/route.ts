import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

// GET: list devices for a user, or get global settings
export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = request.nextUrl.searchParams.get("user_id");
  const supabase = createAdminClient();

  if (userId) {
    const { data: devices } = await supabase
      .from("user_devices").select("*").eq("user_id", userId).order("last_seen", { ascending: false });
    return NextResponse.json({ devices: devices ?? [] });
  }

  // Global settings
  const { data: setting } = await supabase
    .from("app_settings").select("value").eq("key", "global_max_devices").single();
  return NextResponse.json({ global_max_devices: parseInt(setting?.value ?? "3") });
}

// PATCH: update global_max_devices or per-user max_devices
export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const supabase = createAdminClient();

  // Set global limit
  if (body.global_max_devices !== undefined) {
    await supabase.from("app_settings")
      .upsert({ key: "global_max_devices", value: String(body.global_max_devices) }, { onConflict: "key" });
    return NextResponse.json({ success: true });
  }

  // Set per-user limit
  if (body.user_id && body.max_devices !== undefined) {
    await supabase.from("users")
      .update({ max_devices: body.max_devices === null ? null : Number(body.max_devices) })
      .eq("id", body.user_id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid body" }, { status: 400 });
}

// DELETE: remove a specific device or all devices of a user
export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const supabase = createAdminClient();

  if (body.device_id) {
    await supabase.from("user_devices").delete().eq("id", body.device_id);
  } else if (body.user_id) {
    await supabase.from("user_devices").delete().eq("user_id", body.user_id);
  } else {
    return NextResponse.json({ error: "device_id or user_id required" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
