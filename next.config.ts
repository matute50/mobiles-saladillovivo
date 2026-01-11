import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

// Inicializamos el plugin PWA
const withPWA = withPWAInit({
  dest: "public", // Donde se creará el service worker
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: false, // Habilitar PWA incluso en desarrollo para probar
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);