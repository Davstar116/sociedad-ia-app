import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // AGREGA ESTO PARA LAS FOTOS DE PERFIL DE GOOGLE
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Servidor de fotos de Google
      },
    ],
  },
};

export default nextConfig;