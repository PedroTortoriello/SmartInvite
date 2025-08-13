/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  reactStrictMode: false,
  onDemandEntries: {
    overlay: false, // remove overlay
  },
  compress: true,
  swcMinify: true,
  // não gere sourcemaps no browser em produção (difícil do usuário ver stack/rotas)
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },

  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },

  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // ⚠️ estes 2 permitem iframes de qualquer origem. mantenha só se você REALMENTE precisa.
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },

          { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
