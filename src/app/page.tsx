// src/app/page.tsx
import { Metadata } from 'next';
import MobileLayout from '@/components/layout/MobileLayout';
import { getPageData } from '@/lib/data';
import { createClient } from '@supabase/supabase-js'; // DIRECTO

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE_URL = 'https://m.saladillovivo.com.ar';

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
    } else {
      // FALLBACK: Fetch directo para Artículos antiguos (Rich Preview Rescue)
      try {
        const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { data: missingArticle, error } = await sb.from('articles').select('titulo, imagen').eq('id', newsId).single();
        if (error) console.error("[METADATA_ART_ERROR]", error);

        if (missingArticle) {
          title = missingArticle.titulo;
          description = "Informate con Saladillo Vivo.";
          imageUrl = missingArticle.imagen || imageUrl;
          console.log(`[METADATA_ART_HIT] Rescued: ${title}`);
        }
      } catch (e) { console.error("[METADATA_ART_CRASH]", e); }
    }
  }
  else if (videoId) {
    const video = data?.videos?.allVideos?.find((v: any) => String(v.id) === videoId);
    if (video) {
      title = video.nombre;
      description = "Lo podes ver en Saladillo Vivo"; // Frase para videos
      // v24.3: YouTube Detection Sync with VideoCarouselBlock.tsx
      const ytMatch = video.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;

      if (video.imagen) {
        imageUrl = video.imagen;
      } else if (ytId) {
        // WhatsApp prefiere resoluciones estándar garantizadas
        imageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    } else {
      // FALLBACK: Fetch directo para Videos antiguos (Rich Preview Rescue)
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { data: missingVideo } = await supabase.from('videos').select('*').eq('id', videoId).single();
        if (missingVideo) {
          const v = missingVideo as any;
          const finalName = v.nombre || v.title || v.name || "Video sin nombre";
          title = finalName.replaceAll('|', ' ').trim();
          description = "Lo podes ver en Saladillo Vivo";
          const finalUrl = v.url || v.videoUrl || '';

          const ytMatch = finalUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
          const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;
          imageUrl = v.imagen || v.image || v.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : imageUrl);
        }
      } catch (e) { }
    }
  }

  // v24.3: Normalización Blindada para WhatsApp
  const normalizeImageUrl = (url: string) => {
    if (!url) return `${SITE_URL}/logo_social.png`;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${SITE_URL}${url}`;
    if (!url.startsWith('http')) return `${SITE_URL}/${url}`;
    return url;
  };

  imageUrl = normalizeImageUrl(imageUrl);

  // Lista de imágenes para fallback (v24.3)
  const images = [{
    url: imageUrl,
    secureUrl: imageUrl.replace('http:', 'https:'),
    width: 480, // hqdefault standard
    height: 360,
    alt: title
  }];

  // Si usamos hqdefault, añadir mq720 o mqdefault de respaldo inverso
  if (imageUrl.includes('hqdefault.jpg')) {
    const mqUrl = imageUrl.replace('hqdefault.jpg', 'mqdefault.jpg');
    images.push({
      url: mqUrl,
      secureUrl: mqUrl.replace('http:', 'https:'),
      width: 320,
      height: 180,
      alt: title
    });
  }

  // Determinar tipo OG
  const ogType = videoId ? 'video.other' : 'article';

  // URL Canónica
  const canonicalUrl = newsId
    ? `${SITE_URL}/articulo/${newsId}`
    : videoId
      ? `${SITE_URL}/video/${videoId}`
      : SITE_URL;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Saladillo ViVo',
      images: images,
      locale: 'es_AR',
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    }
  };
}

export default async function Home({ searchParams }: Props) {
  const data = await getPageData();
  const sParams = await searchParams;
  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} initialParams={sParams} />
    </main>
  );
}