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
      {
        protocol: "https",
        hostname: "i1.sndcdn.com",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'www.hybridized.online',
          },
        ],
        destination: 'https://hybridized.online',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
