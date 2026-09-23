import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./next-intl.config.ts");

const nextConfig: NextConfig = {
  // sharp is a native addon — must stay external to the serverless bundle
  // rather than being bundled like plain JS, or its binary fails at runtime.
  serverExternalPackages: ["sharp"],
  // sharp loads its libvips binary via dlopen() at runtime, which static file
  // tracing can't see — without this, Vercel's deployed function is missing
  // libvips-cpp.so and every call fails with ERR_DLOPEN_FAILED.
  outputFileTracingIncludes: {
    "/api/image-trim": ["./node_modules/@img/**/*"],
  },
  images: {
    // Vercel's image optimization quota on this plan is exhausted (402
    // OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED), which breaks every uncached
    // <Image>. Serve images directly from their source instead.
    unoptimized: true,
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
