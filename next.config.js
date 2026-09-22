const nextConfig = {
  output: 'standalone',
  // Turbopack: much faster dev compilation (Next.js 15 stable)
  turbopack: {},
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
    ],
  },
  webpack(config, { dev }) {
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 1000,          // faster change detection
        aggregateTimeout: 200,
        ignored: ['**/node_modules', '**/.next'],
      };
    }
    return config;
  },
  // Keep more compiled pages in memory — avoids recompiling warm routes
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,  // 60s
    pagesBufferLength: 5,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
