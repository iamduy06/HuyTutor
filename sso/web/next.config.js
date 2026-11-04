/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    FLASHCARD_URL: process.env.FLASHCARD_URL,
    SHOP_URL: process.env.SHOP_URL,
    ADMIN_API_SECRET: process.env.ADMIN_API_SECRET,
    ADMIN_API_KEY: process.env.ADMIN_API_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
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
