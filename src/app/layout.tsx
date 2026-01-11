import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Saladillo Vivo Mobile",
  description: "Noticias y TV en vivo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-black text-white antialiased">
        {/* Script oficial de Google Cast para habilitar Chromecast */}
        <Script 
          src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1" 
          strategy="beforeInteractive" 
        />
        
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}