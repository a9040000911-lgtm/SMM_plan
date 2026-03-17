const securityHeaders = require('./src/configs/security-headers.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  output: 'standalone',
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ]
  },
  env: {
    PRISMA_CLIENT_ENGINE_TYPE: 'library',
  },
  turbopack: {},
  experimental: {
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  productionBrowserSourceMaps: false,
  webpack: (config, { dev, isServer }) => {
    // Включаем polling только в режиме разработки
    if (dev) {
      config.watchOptions = {
        poll: 800, // проверять файлы каждые 800мс
        aggregateTimeout: 300, // задержка перед пересборкой
      };
    }

    // Подавляем предупреждение BullMQ о критической зависимости (из-за динамических require)
    config.ignoreWarnings = [
      { module: /node_modules\/bullmq\/dist\/esm\/classes\/child-processor\.js/ },
    ];

    return config;
  },
};

module.exports = nextConfig;
