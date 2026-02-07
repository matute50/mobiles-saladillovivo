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

// Inicializamos el plugin PWA
const withPWA = withPWAInit({
  dest: "public", // Donde se creará el service worker
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false, // Habilitar PWA incluso en desarrollo para probar
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
  },
});

export default withPWA(nextConfig);