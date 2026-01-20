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
  
  let title = "Saladillo ViVo";
  let description = "Noticias y videos de Saladillo en tiempo real.";
  let imageUrl = "https://saladillovivo.vercel.app/logo_social.png"; 

  if (newsId) {
    const allArticles = [...(data?.articles?.secondaryNews || []), ...(data?.articles?.otherNews || [])];
    if (data?.articles?.featuredNews) allArticles.push(data.articles.featuredNews);
    const article = allArticles.find(n => String(n.id) === newsId);
    if (article) { title = article.titulo; imageUrl = article.imagen || imageUrl; }
  } else if (videoId) {
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
    openGraph: { title, description, images: [{ url: imageUrl, width: 1200, height: 630 }], type: 'article' },
    twitter: { card: 'summary_large_image', title, images: [imageUrl] },
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