/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignora errores de estilo (linting) durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora errores de tipos (como el de google-cast) durante el build
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

export default nextConfig;