import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MediaPlayerProvider } from "@/context/MediaPlayerContext";
import { VolumeProvider } from "@/context/VolumeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Saladillo Vivo",
  description: "Televisión en vivo desde Saladillo, Buenos Aires",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Vital para sensación de App nativa
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        {/* ORDEN DE JERARQUÍA DE CONTEXTOS */}
        <MediaPlayerProvider>
          <VolumeProvider>
             {/* Aquí va el contenido de tu app (MobileLayout, etc) */}
             {children}
          </VolumeProvider>
        </MediaPlayerProvider>
      </body>
    </html>
  );
}