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
  let description = ""; // Sin description genérica en OG para no contaminar el compartir
  let imageUrl = `${SITE_URL}/brand_social.png?v=4`; // Default brand image (1200x630 optimized)

  try {
    if (id) {
      const article = await getArticleById(id);
      if (article) {
        title = article.titulo.substring(0, 60);
        if (article.bajada && article.bajada.trim() !== '') {
          description = article.bajada.substring(0, 150);
        }
        if (article.imagen) imageUrl = article.imagen;
      } else {
        title = `Not Found: Article ${id}`;
      }
    } else if (v) {
      const video = await getVideoById(v);
      if (video) {
        title = video.nombre.substring(0, 60);
        description = video.nombre.substring(0, 150);
        if (video.imagen) {
          imageUrl = video.imagen;
        } else if (video.url) {
          const match = video.url.match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/);
          const ytId = (match && match[1]) ? match[1] : null;
          if (ytId && ytId.length === 11) {
            imageUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
          }
        }
      } else {
        title = `Not Found: Video ${v}`;
      }
    }
  } catch (e: any) {
    console.error("DEBUG - Metadata Error:", e);
    // v24.7: Exponemos el error CRÍTICO en el título para el debugger de FB/WhatsApp
    title = `DEBUG ERROR: ${e.message || 'Unknown'}`;
  }

  const opengraphUrl = id ? `${SITE_URL}/articulo/${id}` : (v ? `${SITE_URL}/video/${v}` : SITE_URL);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description: description || title,
      url: opengraphUrl,
      siteName: 'Saladillo ViVo',
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        type: 'image/jpeg',
      }],
      locale: 'es_AR',
      type: id ? 'article' : 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || title,
      images: [imageUrl],
    },
    alternates: {
      canonical: opengraphUrl,
    }
  };
}

export default async function Home({ searchParams }: Props) {
  const { id, v } = await searchParams;
  const data = await getPageData();

  // v24.6: Inyección de Deep Link Content
  // Si venimos de un link, nos aseguramos que ese contenido esté en el pool
  // incluso si no está en el TOP 20/5000 inicial.
  if (id) {
    const allArticles = [
      ...(data.articles.featuredNews ? [data.articles.featuredNews] : []),
      ...data.articles.secondaryNews,
      ...data.articles.otherNews
    ];

    if (!allArticles.find(a => a.id === id)) {
      const specificArticle = await getArticleById(id);
      if (specificArticle) {
        data.articles.otherNews.push(specificArticle);
      }
    }
  }

  if (v) {
    if (!data.videos.allVideos.find(vid => vid.id === v)) {
      const specificVideo = await getVideoById(v);
      if (specificVideo) {
        data.videos.allVideos.push(specificVideo);
      }
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} />
    </main>
  );
}