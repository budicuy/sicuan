import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // @react-pdf/renderer and @whiskeysockets/baileys are server-only and must not be bundled for the client
  serverExternalPackages: ["@react-pdf/renderer", "@whiskeysockets/baileys"],
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
