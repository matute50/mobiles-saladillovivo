import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Optimizes React lifecycle checks in dev
  compress: true, // Ensures Gzip compression
  poweredByHeader: false, // Removes 'x-powered-by' header (security/bytes)

  experimental: {
    // Optimiza la importación de librerías grandes (Tree Shaking mejorado)
    optimizePackageImports: ['lucide-react', 'swiper', 'date-fns', 'lodash'],
    // serverActions: true, // Default in Next 14+
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: '**',
      },
      {
        protocol: 'https' as const,
        hostname: 'media.saladillovivo.com.ar',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/articulo/:id',
        destination: '/?id=:id',
      },
      {
        source: '/video/:id',
        destination: '/?v=:id',
      },
    ];
  },
};

// Inicializamos el plugin PWA (v24.3 - Enhanced with Runtime Caching)
const withPWA = withPWAInit({
  dest: "public", // Donde se creará el service worker
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development', // Solo en producción
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        // Cache YouTube thumbnails (CacheFirst - 7 days)
        urlPattern: /^https:\/\/i\.ytimg\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'youtube-thumbnails',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        // Cache static images (CacheFirst - 30 days)
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        // Cache Google Fonts (CacheFirst - 1 year)
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
    ],
  },
});

export default withPWA(nextConfig);