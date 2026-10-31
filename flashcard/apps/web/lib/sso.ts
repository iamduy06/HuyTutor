/**
 * SSO and Application URL Utilities
 * Strictly reads from environment variables without using `||` fallbacks.
 */

export function getSsoUrl(): string {
  const nextPublicSso = process.env.NEXT_PUBLIC_SSO_URL;
  if (nextPublicSso) {
    return nextPublicSso.replace(/\/+$/, "");
  }
  const ssoUrl = process.env.SSO_URL;
  if (ssoUrl) {
    return ssoUrl.replace(/\/+$/, "");
  }
  return "";
}

export function getAppUrl(): string {
  const nextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (nextPublicAppUrl) {
    return nextPublicAppUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

export function getCookieDomain(): string {
  const nextPublicCookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  if (nextPublicCookieDomain) {
    return nextPublicCookieDomain;
  }
  const cookieDomain = process.env.COOKIE_DOMAIN;
  if (cookieDomain) {
    return cookieDomain;
  }
  return "";
}

