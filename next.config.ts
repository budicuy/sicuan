import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // @react-pdf/renderer is server-only and must not be bundled for the client
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
      allowedOrigins: [
        "*.devtunnels.ms",
        "*.asse.devtunnels.ms",
        "*.ngrok-free.app",
        "*.ngrok.io",
        "*.loca.lt",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
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
