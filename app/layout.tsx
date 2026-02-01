import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. IMPORTAMOS EL NUEVO WRAPPER
import SessionWrapper from "./components/SessionWrapper"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SophIA | Sistema Inteligente",
  description: "Plataforma de gestión SIAFI",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  // ❌ AQUÍ YA NO VA themeColor
};

// ✅ AHORA VA AQUÍ EN UNA EXPORTACIÓN SEPARADA
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}>
        {/* 2. ENVOLVEMOS TODO EL CONTENIDO AQUÍ */}
        <SessionWrapper>
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}

// Actualización forzada v2