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
  // v40.0 PERFORMANCE FIX: REMOVED getPageData() call which fetched 5000+ items
  // const data = await getPageData(); 

  let title = "Saladillo ViVo";
  let description = "Noticias y videos de Saladillo en tiempo real.";
  let imageUrl = "/logo_social.png";
  let debugStatus = "INIT"; // Debug flag

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  if (newsId) {
    try {
      debugStatus = `NEWS_ID_${newsId}`;
      // Direct Fetch for Single Article
      const { data: article, error } = await supabase.from('articles').select('titulo, imagen').eq('id', newsId).single();

      if (article) {
        title = (article.titulo || "Noticia").replaceAll('|', ' ').trim();
        description = "Informate con Saladillo Vivo.";
        imageUrl = article.imagen || imageUrl;
        debugStatus += "_FOUND";
      } else {
        debugStatus += `_ERR_${error?.code}`;
      }
    } catch (e) { console.error("[METADATA_ART_FAIL]", e); debugStatus += "_CATCH"; }
  }
  else if (videoId) {
    try {
      debugStatus = `VID_ID_${videoId}`;
      // Direct Fetch for Single Video
      const { data: video, error } = await supabase.from('videos').select('*').eq('id', videoId).single();

      if (video) {
        const v = video as any;
        const finalName = v.nombre || v.title || v.name || "Video sin nombre";
        title = finalName.replaceAll('|', ' ').trim();
        description = "Lo podes ver en Saladillo Vivo";
        const finalUrl = v.url || v.videoUrl || '';
        debugStatus += "_FOUND";

        // v24.3: YouTube Detection Sync
        const ytMatch = finalUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;

        if (v.imagen || v.image) {
          imageUrl = v.imagen || v.image;
        } else if (ytId) {
          // v51.0: UPGRADE to hqdefault (480x360) for better WhatsApp compatibility
          // mqdefault was 320x180 (sometimes too small height)
          imageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }
      } else {
        debugStatus += `_ERR_${error?.code}`;
      }
    } catch (e) { console.error("[METADATA_VID_FAIL]", e); debugStatus += "_CATCH"; }
  }

  // Normalización Blindada para WhatsApp
  const normalizeImageUrl = (url: string) => {
    if (!url) return `${SITE_URL}/logo_social.png`;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${SITE_URL}${url}`;
    if (!url.startsWith('http')) return `${SITE_URL}/${url}`;
    return url;
  };

  imageUrl = normalizeImageUrl(imageUrl);

  // v52.0: Prioridad ABSOLUTA a MaxResDefault (HD)
  // Si tenemos YOUTUBE HQ, intentamos "upgradear" a MAXRES.
  // WhatsApp prefiere imágenes grandes (>300px) y claras.
  let finalImage = imageUrl;
  if (imageUrl.includes('hqdefault.jpg')) {
    finalImage = imageUrl.replace('hqdefault.jpg', 'maxresdefault.jpg');
  }

  // Debug injection removed for production cleanliness

  // Estrategia de Imagen Única y Robusta
  // En lugar de pasar un array complejo que a veces WhatsApp ignora,
  // pasamos la mejor imagen disponible como única opción principal.
  const images = [{
    url: finalImage,
    secureUrl: finalImage.replace('http:', 'https:'),
    width: 1280,
    height: 720,
    type: 'image/jpeg',
    alt: title,
  }];

  // Determinar tipo OG
  // v52.0: Forzamos 'website' o 'article' incluso para videos.
  // 'video.other' a veces causa que WhatsApp intente parsear un player y falle, mostrando nada.
  // 'website' es lo más seguro para garantizar la "Large Image Card".
  const ogType = 'website';

  // URL Canónica
  const canonicalUrl = newsId
    ? `${SITE_URL}/?id=${newsId}`
    : videoId
      ? `${SITE_URL}/?v=${videoId}`
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
      images: [finalImage],
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