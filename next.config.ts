import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Comodín: Permite cargar imágenes de CUALQUIER sitio
      },
    ],
  },
};

export default nextConfig;