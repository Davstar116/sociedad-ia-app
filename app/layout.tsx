import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. CONFIGURACIÓN VISUAL MÓVIL (PWA)
// Esto hace que la barra del navegador del celular se ponga negra
// y evita que el usuario pueda hacer zoom "pellizcando", como una app real.
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
};

// 2. METADATOS Y MANIFIESTO
export const metadata: Metadata = {
  title: "SIAFI App",
  description: "Plataforma de Gestión e Inteligencia Artificial",
  manifest: "/manifest.json", // Conexión con el archivo que creamos
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png", // Icono para iPhone
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SIAFI App",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}