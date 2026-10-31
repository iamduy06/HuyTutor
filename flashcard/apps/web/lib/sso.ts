/**
 * SSO and Application URL Utilities (Server Secret-driven)
 * Strictly reads from environment variables without using `||` fallbacks.
 */

export function getSsoUrl(): string {
  const ssoUrl = process.env.SSO_URL;
  if (ssoUrl) {
    return ssoUrl.replace(/\/+$/, "");
  }
  return "";
}

export function getAppUrl(): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    return appUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

export function getCookieDomain(): string {
  const cookieDomain = process.env.COOKIE_DOMAIN;
  if (cookieDomain) {
    return cookieDomain;
  }
  return "";
}
