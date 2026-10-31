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
  async rewrites() {
    const rawApiUrl = process.env.API_URL;
    if (!rawApiUrl) return [];
    const trimmed = rawApiUrl.replace(/\/+$/, "");
    const apiUrl = trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
