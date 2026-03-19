/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 */
const { withSentryConfig } = require("@sentry/nextjs");
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
  env: {
    PRISMA_CLIENT_ENGINE_TYPE: "library",
  },
  eslint: {
    // We disable linting during build to save memory and time on the production server.
    // Quality checks should be done locally or in a dedicated CI stage.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Same for typechecking.
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackMemoryOptimizations: true,
    webpackBuildWorker: false, // Disabling to reduce memory pressure
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 800,
        aggregateTimeout: 300,
      };
    }
    // Suppress BullMQ critical dependency warning
    config.ignoreWarnings = [
      { module: /node_modules\/bullmq\/dist\/esm\/classes\/child-processor\.js/ },
    ];
    return config;
  },
};

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-javascript/blob/master/nextjs/README.md#finer-control-over-the-source-maps-uploaded-to-sentry
    silent: true,
    org: "smmplan",
    project: "javascript-nextjs",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);
