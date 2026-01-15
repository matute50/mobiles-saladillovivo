// src/app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saladillo Vivo',
  description: 'Portal de noticias y videos de Saladillo, Argentina.',
  metadataBase: new URL('https://tu-dominio.vercel.app'), // Reemplaza con tu URL real
  openGraph: {
    title: 'Saladillo Vivo',
    description: 'Portal de noticias de Saladillo',
    url: 'https://tu-dominio.vercel.app',
    siteName: 'Saladillo Vivo',
    images: [
      {
        url: '/opengraph-image.png', // Next.js buscará este archivo en src/app
        width: 1200,
        height: 630,
        alt: 'Saladillo Vivo Logo',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}