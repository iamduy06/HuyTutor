import { createClient } from './supabase/client.js';
import { getApiUrl } from './apiUrl';
import { getDeviceId } from './device';

const BASE_URL = getApiUrl();

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  } | string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  // SEC-007: Attach device ID header to bind request to registered device
  if (typeof window !== 'undefined') {
    try {
      const devId = getDeviceId();
      if (devId) {
        headers.set('X-Device-Id', devId);
      }
    } catch {
      /* Browser storage access blocked or server environment */
    }
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${normalizedEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    signal: options.signal ?? AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    const code = errJson?.error?.code;
    const message =
      typeof errJson?.error === 'string'
        ? errJson.error
        : errJson?.error?.message || `HTTP ${response.status}: Yêu cầu thất bại`;

    // SEC-007: If device was revoked by admin, terminate session and force redirect to login
    if (response.status === 401 && code === 'DEVICE_REVOKED') {
      if (typeof window !== 'undefined') {
        try {
          await supabase.auth.signOut();
        } catch {
          /* Ignore signOut errors */
        }
        window.location.href = '/login?error=device_revoked';
      }
    }

    throw new Error(message);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const json = (await response.json()) as ApiResponse<T>;
    return json.data !== undefined ? json.data : (json as unknown as T);
  }

  return (await response.blob()) as unknown as T;
}
