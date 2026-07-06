import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (.next/standalone).
  output: "standalone",
  // better-sqlite3 is a native addon — keep it external so Next doesn't try to bundle it.
  serverExternalPackages: ["better-sqlite3"],
  // The atproto loopback OAuth client requires accessing the app via 127.0.0.1,
  // but Next 16 blocks dev resources (HMR, client runtime) from non-localhost
  // origins by default — which breaks hydration. Trust the loopback host.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
