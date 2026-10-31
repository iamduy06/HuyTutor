/**
 * Tạo device fingerprint từ browser properties.
 * Không cần thư viện — dùng các thuộc tính ổn định.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";

  // Lấy từ localStorage nếu đã có
  const stored = localStorage.getItem("hut_device_id");
  if (stored) {
    if (typeof document !== "undefined" && !document.cookie.includes("hut_device_id=")) {
      document.cookie = `hut_device_id=${stored}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return stored;
  }

  // Tạo mới từ browser fingerprint
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? 0,
  ].join("|");

  // Simple hash
  let hash = 0;
  for (let i = 0; i < parts.length; i++) {
    hash = ((hash << 5) - hash) + parts.charCodeAt(i);
    hash |= 0;
  }
  const id = Math.abs(hash).toString(36) + "-" + Date.now().toString(36);
  localStorage.setItem("hut_device_id", id);
  if (typeof document !== "undefined") {
    document.cookie = `hut_device_id=${id}; path=/; max-age=31536000; SameSite=Lax`;
  }
  return id;
}

export function getDeviceName(): string {
  if (typeof window === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  let browser = "Browser";
  let os = "Unknown OS";

  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "Mac";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  return `${browser} on ${os}`;
}
