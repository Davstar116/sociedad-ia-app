import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SophIA - Sistema Inteligente',
    short_name: 'SophIA', // <--- ESTE es el nombre que sale en el celular
    description: 'Plataforma de gestión para la Sociedad de Inteligencia Artificial - UNAM',
    start_url: '/',
    display: 'standalone', // Esto hace que se abra como App (sin barra de navegador)
    background_color: '#000000', // Color de fondo al abrir (Splash screen)
    theme_color: '#000000', // Color de la barra de estado
    icons: [
      {
        src: '/icon.png', // Busca en la carpeta public
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}