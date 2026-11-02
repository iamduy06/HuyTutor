import { getSsoUrl } from "./sso";

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
  const ssoBase = getSsoUrl();

  // 1. Send direct browser request to SSO Portal to revoke session and delete SSO cookie
  if (ssoBase) {
    try {
      await fetch(`${ssoBase}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        mode: "cors",
      });
    } catch {
      /* Ignore cross-origin network error */
    }
  }

  // 2. Send request to Flashcard internal logout endpoint to clear all local cookies
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* Ignore error */
  }

  // 3. Purge all client-side storage & state
  clearClientToken();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("hut_auth_token");
      localStorage.removeItem("hut_user");
      sessionStorage.clear();

      // Expire non-httpOnly client cookies across domain variations
      const past = "Thu, 01 Jan 1970 00:00:00 GMT";
      const domains = [".huytutor.edu.vn", "huytutor.edu.vn", window.location.hostname, `.${window.location.hostname}`, ""];
      const cookieNames = ["ht_sso_token", "hut_access_token", "hut_refresh_token", "hut_device_id", "sb-access-token", "sb-refresh-token"];

      for (const name of cookieNames) {
        for (const dom of domains) {
          const domStr = dom ? `; domain=${dom}` : "";
          document.cookie = `${name}=; path=/${domStr}; expires=${past}; max-age=0`;
        }
      }

      window.dispatchEvent(new Event("hut_auth_changed"));
    } catch {}

    // Redirect to Flashcard main home page / instead of SSO login
    window.location.href = "/?logout=true";
  }
}
