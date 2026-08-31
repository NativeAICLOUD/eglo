import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./next-intl.config.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-166082e4b3d54bb296c0e624eb1a1f50.r2.dev",
      },
    ],
  },
  async rewrites() {
    const internalApiUrl = process.env.INTERNAL_API_URL || "http://localhost:5181/api";
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
