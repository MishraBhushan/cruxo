import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],
  transpilePackages: ["@chenglou/pretext"],
};

export default nextConfig;
