/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  transpilePackages: ["@huytutor/shared"],
  async rewrites() {
    const raw = process.env.NEXT_PUBLIC_API_URL;
    const rawApiUrl = (!raw || raw.includes("flashcard-api.huytutor.edu.vn"))
      ? "https://flashcard-api-svav.onrender.com/api/v1"
      : raw;
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
