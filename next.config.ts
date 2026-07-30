import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sql.js loads its WASM binary from node_modules at runtime; @react-pdf/renderer ships
  // native/font assets — keep both unbundled so they run in the Node server runtime.
  serverExternalPackages: ["sql.js", "@react-pdf/renderer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.us-east-005.backblazeb2.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
