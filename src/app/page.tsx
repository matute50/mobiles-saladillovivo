// src/app/page.tsx
import { Metadata } from 'next';
import MobileLayout from '@/components/layout/MobileLayout';
import { getPageData } from '@/lib/data';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ id?: string; v?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams;
  const newsId = sParams.id;
  const videoId = sParams.v;
  const data = await getPageData();
  
  let title = "Saladillo ViVo - El medio local de Saladillo";
  let description = "Noticias, videos y toda la actualidad de Saladillo en tiempo real.";
  // URL absoluta obligatoria para redes sociales
  let imageUrl = "https://saladillovivo.vercel.app/logo_social.png"; 

  if (newsId) {
    const allArticles = [
      ...(data?.articles?.featuredNews ? [data.articles.featuredNews] : []),
      ...(data?.articles?.secondaryNews || []),
      ...(data?.articles?.otherNews || [])
    ];
    const article = allArticles.find(n => String(n.id) === newsId);
    if (article) {
      title = article.titulo;
      description = article.bajada || description;
      imageUrl = article.imagen || imageUrl;
    }
  } 
  else if (videoId) {
    const video = data?.videos?.allVideos?.find((v: any) => String(v.id) === videoId);
    if (video) {
      title = video.nombre;
      const ytMatch = video.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      imageUrl = video.imagen || (ytMatch ? `https://img.youtube.com/vi/${ytMatch[2]}/maxresdefault.jpg` : imageUrl);
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ 
        url: imageUrl, 
        width: 1200, 
        height: 630,
        alt: title 
      }],
      type: 'video.other',
      siteName: 'Saladillo ViVo',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Home() {
  let data = null;
  try {
    data = await getPageData();
  } catch (error) {
    console.error("❌ Error buscando datos:", error);
  }

  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} />
    </main>
  );
}