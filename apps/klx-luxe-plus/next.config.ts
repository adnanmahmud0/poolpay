import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@repo/ui"],
  poweredByHeader: false,
  devIndicators: false
};

export default nextConfig;
