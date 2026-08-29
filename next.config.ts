import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    qualities: [75, 85],
    // Residential media is served directly with per-request access checks.
    // Do not allow the optimizer to cache /api/media/residential (including signed previews).
    remotePatterns: [
      { protocol: "https", hostname: "back.manora.tj", port: "", pathname: "/api/media/properties/**" },
      {
        protocol: "https",
        hostname: "back.manora.tj",
        port: "",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "backend.aura.tj",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
