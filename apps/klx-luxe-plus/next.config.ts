import { resolve } from "node:path";
import type { NextConfig } from "next";

import { config } from "dotenv";

// Load local workspace credentials before Next starts; never trace env files into server output.
config({
  path: [resolve(".env.local"), process.env.KLX_ENV_FILE || resolve("../../.env"), resolve(".env")],
  quiet: true
});

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: { "*": ["**/.env", "**/.env.*", "**/.git/**", "**/.klx-media/**"] },
  // Native image libraries need their adjacent DLL/SO files in the standalone server.
  outputFileTracingIncludes: {
    "/api/admin/media": ["./node_modules/@img/**/*", "../../node_modules/@img/**/*"]
  },
  images: { unoptimized: true },
  transpilePackages: ["@repo/ui"],
  poweredByHeader: false,
  devIndicators: false
};

export default nextConfig;
