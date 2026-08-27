import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // @react-pdf/renderer is server-only and must not be bundled for the client
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
