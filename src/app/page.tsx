// src/app/page.tsx
import { Metadata } from 'next';
import MobileLayout from '@/components/layout/MobileLayout';
import { getPageData } from '@/lib/data';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ id?: string; v?: string }>;
};

const SITE_URL = 'https://saladillovivo.vercel.app'; 

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams;
  const newsId = sParams.id;
  const videoId = sParams.v;
  const data = await getPageData();
  
  let title = "Saladillo ViVo";
  let description = "Noticias y videos de Saladillo en tiempo real.";
  let imageUrl = "/logo_social.png";

  if (newsId) {
    const allArticles = [
      ...(data?.articles?.featuredNews ? [data.articles.featuredNews] : []),
      ...(data?.articles?.secondaryNews || []),
      ...(data?.articles?.otherNews || [])
    ];
    const article = allArticles.find(n => String(n.id) === newsId);
    if (article) {
      title = article.titulo;
      // FRASE SOLICITADA PARA NOTICIAS
      description = "Informate con Saladillo Vivo."; 
      imageUrl = article.imagen || imageUrl;
    }
  } 
  else if (videoId) {
    const video = data?.videos?.allVideos?.find((v: any) => String(v.id) === videoId);
    if (video) {
      title = video.nombre;
      description = "Lo podes ver en Saladillo Vivo"; // Frase para videos
      const ytMatch = video.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      imageUrl = video.imagen || (ytMatch ? `https://img.youtube.com/vi/${ytMatch[2]}/mqdefault.jpg` : imageUrl);
    }
  }

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: './',
      siteName: 'Saladillo ViVo',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      locale: 'es_AR',
      type: 'article',
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
  const data = await getPageData();
  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} />
    </main>
  );
}