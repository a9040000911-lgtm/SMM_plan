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
    webpackMemoryOptimizations: true,
    webpackBuildWorker: false,
  },
};

module.exports = nextConfig;
