// src/app/page.tsx
import { Metadata } from 'next';
import MobileLayout from '@/components/layout/MobileLayout';
import { getPageData } from '@/lib/data';

// Forzamos la carga dinámica para asegurar datos actualizados en cada petición
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ id?: string; v?: string }>;
};

/**
 * Es fundamental que SITE_URL coincida exactamente con tu dominio actual.
 * Esto permite que metadataBase genere URLs absolutas para las imágenes,
 * requisito indispensable para que WhatsApp muestre la miniatura.
 */
const SITE_URL = 'https://saladillovivo.vercel.app'; 

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams;
  const newsId = sParams.id;
  const videoId = sParams.v;
  
  // Recuperamos los datos de Supabase desde el servidor
  const data = await getPageData();
  
  // Valores por defecto (Home)
  let title = "Saladillo ViVo - El medio local de Saladillo";
  let description = "Noticias, videos y toda la actualidad de Saladillo en tiempo real.";
  let imageUrl = "/logo_social.png"; // Se volverá absoluta automáticamente

  // Lógica para NOTICIAS (?id=...)
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
  // Lógica para VIDEOS del carrusel (?v=...)
  else if (videoId) {
    const video = data?.videos?.allVideos?.find((v: any) => String(v.id) === videoId);
    if (video) {
      title = video.nombre;
      const ytMatch = video.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      /**
       * CAMBIO CRUCIAL: Usamos 'mqdefault.jpg' en lugar de 'maxresdefault.jpg'.
       * WhatsApp descarta la miniatura si la imagen de alta resolución no existe o es muy pesada.
       * 'mqdefault' garantiza que la imagen esté disponible y cargue rápido.
       */
      imageUrl = video.imagen || (ytMatch ? `https://img.youtube.com/vi/${ytMatch[2]}/mqdefault.jpg` : imageUrl);
    }
  }

  return {
    metadataBase: new URL(SITE_URL), // Base para todas las rutas relativas
    title,
    description,
    openGraph: {
      title,
      description,
      url: './',
      siteName: 'Saladillo ViVo',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
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
  // Carga de datos en el servidor para pasar al componente de cliente
  const data = await getPageData();
  
  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} />
    </main>
  );
}