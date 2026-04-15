import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // 🔥 IMPORTANT
  },
};

export default nextConfig;