/**
 * SSO and Application URL Utilities (Server Secret-driven)
 * Strictly reads from environment variables without hardcoded URLs.
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
    return cookieDomain.trim();
  }
  return "";
}

export function getCookieDomainList(host?: string | null): string[] {
  const domains = new Set<string>();

  const envDomain = process.env.COOKIE_DOMAIN?.trim();
  if (envDomain) {
    domains.add(envDomain.startsWith(".") ? envDomain : `.${envDomain}`);
    domains.add(envDomain.replace(/^\./, ""));
  }


  if (host) {
    const cleanHost = host.split(":")[0].trim();
    if (cleanHost && cleanHost.includes(".") && !/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanHost)) {
      domains.add(`.${cleanHost}`);
      domains.add(cleanHost);

      const parts = cleanHost.split(".");
      if (parts.length >= 2) {
        const root = parts.slice(-2).join(".");
        domains.add(`.${root}`);
        domains.add(root);
      }
    }
  }

  return Array.from(domains);
}
