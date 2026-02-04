// src/app/page.tsx
import { Metadata } from 'next';
import MobileLayout from '@/components/layout/MobileLayout';
import { getPageData, getArticleById, getVideoById } from '@/lib/data';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://m.saladillovivo.com.ar';

type Props = {
  searchParams: Promise<{ id?: string; v?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id, v } = await searchParams; // Next.js 15: searchParams is a Promise

  let title = "Saladillo ViVo";
  let description = "Noticias y videos de Saladillo en tiempo real.";
  let imageUrl = `${SITE_URL}/brand_social.png?v=4`; // Default brand image (1200x630 optimized)

  try {
    if (id) {
      const article = await getArticleById(id);
      if (article) {
        title = article.titulo.substring(0, 60); // Optimize for WhatsApp title limit
        if (article.bajada) description = article.bajada.substring(0, 150);
        if (article.imagen) imageUrl = article.imagen;
      }
    } else if (v) {
      const video = await getVideoById(v);
      if (video) {
        title = video.nombre.substring(0, 60);
        description = "Mirá este video en Saladillo ViVo";

        // Prioridad 1: Imagen explícita del backend
        if (video.imagen) {
          imageUrl = video.imagen;
        } else if (video.url) {
          // Prioridad 2: Extracción robusta de YouTube
          const match = video.url.match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/);
          const id = (match && match[1]) ? match[1] : null;
          if (id && id.length === 11) {
            imageUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error generating metadata:", e);
  }

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${id ? `/?id=${id}` : (v ? `/?v=${v}` : '')}`,
      siteName: 'Saladillo ViVo',
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        type: 'image/jpeg', // Most common fallback, works for PNGs usually too in readers
      }],
      locale: 'es_AR',
      type: id ? 'article' : 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}${id ? `/?id=${id}` : (v ? `/?v=${v}` : '')}`,
    }
  };
}

export default async function Home() {
  const data = await getPageData();
  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} />
    </main>
  );
}