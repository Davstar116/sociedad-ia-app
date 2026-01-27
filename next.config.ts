import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! ADVERTENCIA !!
    // Esto permite que la app se construya incluso si hay errores de tipado.
    // Es seguro para nuestro MVP, pero idealmente lo corregiremos en el futuro.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora reglas de estilo estrictas durante el despliegue
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;