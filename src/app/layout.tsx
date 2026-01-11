import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MediaPlayerProvider } from '@/context/MediaPlayerContext';

const inter = Inter({ subsets: ["latin"] });

// CONFIGURACIÓN PWA Y METADATA
export const metadata: Metadata = {
  title: "Saladillo Vivo",
  description: "Medio digital de Saladillo",
  manifest: "/manifest.json", // Vincula el manifiesto
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Barra transparente en iPhone
    title: "Saladillo Vivo",
  },
  formatDetection: {
    telephone: false,
  },
};

// CONFIGURACIÓN DE VIEWPORT (Zoom y colores)
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita que el usuario haga zoom pellizcando (sensación nativa)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <MediaPlayerProvider>
          {children}
        </MediaPlayerProvider>
      </body>
    </html>
  );
}