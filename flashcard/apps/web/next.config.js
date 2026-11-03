/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flashcard.huytutor.edu.vn" },
      { protocol: "https", hostname: "flashcard2.huytutor.edu.vn" },
      { protocol: "https", hostname: "supabase-proxy.huynhthanhduy06.workers.dev" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  transpilePackages: ["@huytutor/shared"],
  env: {
    SSO_URL: process.env.SSO_URL,
    APP_URL: process.env.APP_URL,
  },
  async rewrites() {
    const rawApiUrl = process.env.API_URL;
    if (!rawApiUrl) return [];
    const trimmed = rawApiUrl.replace(/\/+$/, "");
    const baseApi = trimmed.replace(/\/api(\/v1)?$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${baseApi}/api/v1/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${baseApi}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
