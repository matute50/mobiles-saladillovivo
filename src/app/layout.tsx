import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MediaPlayerProvider } from "@/context/MediaPlayerContext";
import { VolumeProvider } from "@/context/VolumeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Saladillo Vivo",
  description: "Televisión en vivo desde Saladillo",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <VolumeProvider>
            {children}
          </VolumeProvider>
        </MediaPlayerProvider>
      </body>
    </html>
  );
}