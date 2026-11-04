/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    FLASHCARD_URL: process.env.FLASHCARD_URL,
    SHOP_URL: process.env.SHOP_URL,
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
  },
  async rewrites() {
    const rawApiUrl = process.env.SSO_API_URL;
    if (!rawApiUrl) {
      return [];
    }
    const apiUrl = rawApiUrl.replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
