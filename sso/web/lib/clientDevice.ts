export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const KEY = 'hut_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Trình duyệt Web';
  const ua = navigator.userAgent;
  let os = 'Thiết bị';
  if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'Mac';
  else if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = '';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return `${browser ? browser + ' ' : ''}${os}`.trim();
}

