import dotenv from 'dotenv';
dotenv.config();

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL!;
}

function getServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY!;
}

export async function supabaseRest(endpoint: string, options: RequestInit = {}) {
  const url = `${getSupabaseUrl()}/rest/v1/${endpoint.replace(/^\//, '')}`;
  const key = getServiceKey();
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  return res;
}

export async function supabaseAdminAuth(endpoint: string, options: RequestInit = {}) {
  const url = `${getSupabaseUrl()}/auth/v1/admin/${endpoint.replace(/^\//, '')}`;
  const key = getServiceKey();
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  return res;
}
