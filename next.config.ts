import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Borramos la parte de eslint que daba error
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Para las fotos de Google
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/ws/sophia',
        destination: 'http://localhost:8000/ws/sophia', // Next.js lo transformará a WebSocket automáticamente
      },
    ];
  },
};

export default nextConfig;

// Acutalización forzada v2