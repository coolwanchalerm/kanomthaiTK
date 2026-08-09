import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.119"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "btbqalrzvnsuyrbwacob.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default nextConfig;
