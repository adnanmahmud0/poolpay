import path from "path";
import type { NextConfig } from "next";

import dotenv from "dotenv";

// Load environment variables from monorepo root .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  output: "standalone"
};

export default nextConfig;
