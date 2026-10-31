import { getApiUrl } from './apiUrl';
import { getDeviceId } from './device';
import { getClientToken, logoutApi } from './auth';

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
  const token = getClientToken();

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
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
  const base = BASE_URL || (typeof window !== 'undefined' ? '/api' : '');
  const url = endpoint.startsWith('http') ? endpoint : `${base}${normalizedEndpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: options.credentials ?? 'include',
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

    // SEC-007: If device was revoked or quota exceeded, terminate local state and redirect to SSO
    if (
      (response.status === 401 && code === 'DEVICE_REVOKED') ||
      (response.status === 403 && code === 'DEVICE_LIMIT_EXCEEDED')
    ) {
      if (typeof window !== 'undefined') {
        logoutApi();
        document.cookie = 'ht_sso_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'hut_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        const targetSsoUrl = typeof errJson?.error === 'object' && errJson?.error?.ssoUrl ? errJson.error.ssoUrl : '';
        window.location.href = targetSsoUrl ? targetSsoUrl : '/login?error=device_limit_exceeded';
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
