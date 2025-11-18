import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "neslxchdtibzhxijxcbg.supabase.co",
      },
      {
        protocol: "https",
        hostname: "d3mww1g1pfq2pt.cloudfront.net",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
