export interface AuthUser {
  id: string;
  email: string;
  role: "USER" | "SUBADMIN" | "ADMIN";
  full_name?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  session?: AuthSession;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    contactUrl?: string;
    maxDevices?: number;
  };
}

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hut_auth_token");
}

export function setClientToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("hut_auth_token", token);
  }
}

export function clearClientToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("hut_auth_token");
    localStorage.removeItem("hut_user");
  }
}

export async function loginApi(body: {
  email: string;
  password: string;
  device_id: string;
  device_name?: string;
}): Promise<AuthResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function registerApi(body: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<AuthResponse> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function verifyOtpApi(body: {
  email: string;
  token: string;
  type?: "signup" | "recovery" | "email_change" | "invite";
}): Promise<AuthResponse> {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function forgotPasswordApi(body: {
  email: string;
}): Promise<{ success: boolean; message?: string; error?: any }> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function resetPasswordApi(body: {
  email?: string;
  token?: string;
  new_password?: string;
  password?: string;
}): Promise<{ success: boolean; message?: string; error?: any }> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* Ignore error */
  } finally {
    clearClientToken();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("hut_auth_token");
        localStorage.removeItem("hut_user");
        sessionStorage.clear();

        // Expire non-httpOnly client cookies across domain variations
        const past = "Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = `ht_sso_token=; path=/; expires=${past};`;
        document.cookie = `ht_sso_token=; path=/; domain=.huytutor.edu.vn; expires=${past};`;
        document.cookie = `hut_access_token=; path=/; expires=${past};`;
        document.cookie = `hut_access_token=; path=/; domain=.huytutor.edu.vn; expires=${past};`;

        window.dispatchEvent(new Event("hut_auth_changed"));
      } catch {}

      window.location.href = "/login?logout=true";
    }
  }
}
