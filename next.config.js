/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 */
const securityHeaders = require("./src/configs/security-headers.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: ".next",
  async redirects() {
    return [
      { source: "/orders", destination: "/dashboard/orders", permanent: true },
      { source: "/orders/:id", destination: "/dashboard/orders/:id", permanent: true },
      { source: "/profile", destination: "/dashboard", permanent: true },
      { source: "/settings", destination: "/dashboard/settings", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  output: "standalone",
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  env: {
    PRISMA_CLIENT_ENGINE_TYPE: "library",
  },
  experimental: {
    webpackMemoryOptimizations: false,
    webpackBuildWorker: false,
  },
};

module.exports = nextConfig;
