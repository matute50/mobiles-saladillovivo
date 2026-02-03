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
      // Regex robusto para YouTube ID
      const ytMatch = video.url.match(/(?:youtu\.be\/|youtube\.com\/[^\/]+\/|youtube.com\/watch\?v=|v\/)([^"&?\/\s]{11})/);
      const ytId = ytMatch ? ytMatch[1] : null;

      // v24.0: Dual-Res Strategy (WhatsApp preference)
      if (video.imagen) {
        imageUrl = video.imagen;
      } else if (ytId) {
        // Enviar un array de imágenes ayuda a que los scrapers elijan la mejor
        imageUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      }
    } else {
      // FALLBACK: Fetch directo para Videos antiguos (Rich Preview Rescue)
      try {
        const supabase = createClient();
        // Usamos select('*') y cast a 'any' para máxima flexibilidad con columnas legacy
        const { data: missingVideo } = await supabase.from('videos').select('*').eq('id', videoId).single();
        if (missingVideo) {
          const v = missingVideo as any;
          const finalName = v.nombre || v.title || v.name || "Video sin nombre";
          title = finalName.replaceAll('|', ' ').trim();
          description = "Lo podes ver en Saladillo Vivo";
          const finalUrl = v.url || v.videoUrl || '';

          const ytMatch = finalUrl.match(/(?:youtu\.be\/|youtube\.com\/[^\/]+\/|youtube.com\/watch\?v=|v\/)([^"&?\/\s]{11})/);
          const ytId = ytMatch ? ytMatch[1] : null;
          imageUrl = v.imagen || v.image || v.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : imageUrl);
        }
      } catch (e) { }
    }
  }

  // Asegurar URL absoluta para la imagen (v24.1: Mejorado para urls sin protocolo)
  if (imageUrl.startsWith('//')) {
    imageUrl = `https:${imageUrl}`;
  } else if (imageUrl.startsWith('/')) {
    imageUrl = `${SITE_URL}${imageUrl}`;
  } else if (!imageUrl.startsWith('http')) {
    // Si es un path relativo perdido (ej: "images/foo.jpg")
    imageUrl = `${SITE_URL}/${imageUrl}`;
  }

  // Lista de imágenes para fallback (v24.0)
  const images = [{ url: imageUrl, width: 1200, height: 630, alt: title }];

  // Si es YouTube y probamos maxres, añadir hqdefault de respaldo por si maxres no existe
  if (imageUrl.includes('maxresdefault.jpg')) {
    const hqUrl = imageUrl.replace('maxresdefault.jpg', 'hqdefault.jpg');
    images.push({ url: hqUrl, width: 480, height: 360, alt: title });
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