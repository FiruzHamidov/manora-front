import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "back.manora.tj",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "back.manora.tj",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
