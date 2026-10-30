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
  const data = await res.json();
  if (data.success && data.session?.access_token) {
    setClientToken(data.session.access_token);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("hut_auth_changed"));
    }
  }
  return data;
}

export async function registerApi(body: {
  email: string;
  password: string;
  full_name: string;
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
  type: string;
}): Promise<AuthResponse> {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.success && data.session?.access_token) {
    setClientToken(data.session.access_token);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("hut_auth_changed"));
    }
  }
  return data;
}

export async function forgotPasswordApi(body: {
  email: string;
}): Promise<AuthResponse> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function resetPasswordApi(body: {
  email: string;
  token: string;
  new_password: string;
}): Promise<AuthResponse> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* Ignore error */
  } finally {
    clearClientToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}
