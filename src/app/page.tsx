import { Metadata } from 'next';
import MobileLayout from '@/components/layout/MobileLayout';
import { getPageData } from '@/lib/data';

// Forzamos la carga dinámica para tener siempre datos frescos
export const dynamic = 'force-dynamic';

// 1. Tipos para los parámetros de búsqueda de Next.js 15
type Props = {
  searchParams: Promise<{ id?: string; v?: string }>;
};

// 2. FUNCIÓN DE METADATA DINÁMICA
// Esta función la leen los bots de WhatsApp, Facebook y Google antes de cargar la página
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sParams = await searchParams;
  const newsId = sParams.id;
  const videoId = sParams.v;
  
  // Buscamos los datos en Supabase
  const data = await getPageData();
  
  // Valores por defecto para la Home
  let title = "Saladillo ViVo - El medio local de Saladillo";
  let description = "Noticias, videos y toda la actualidad de Saladillo en tiempo real.";
  let imageUrl = "https://saladillovivo.vercel.app/logo_social.png"; // Ajusta con tu dominio real

  // LÓGICA DE DETECCIÓN: Si el link tiene un ?id=... (Noticia)
  if (newsId) {
    const allArticles = [
      ...(data?.articles?.featuredNews ? [data.articles.featuredNews] : []),
      ...(data?.articles?.secondaryNews || []),
      ...(data?.articles?.otherNews || [])
    ];
    const article = allArticles.find(n => String(n.id) === newsId);
    
    if (article) {
      title = article.titulo; // Usamos el título real
      description = article.resumen || description;
      imageUrl = article.imagen || imageUrl;
    }
  } 
  // LÓGICA DE DETECCIÓN: Si el link tiene un ?v=... (Video del Carrusel)
  else if (videoId) {
    const video = data?.videos?.allVideos?.find((v: any) => String(v.id) === videoId);
    if (video) {
      title = video.nombre; // Usamos el nombre del video
      imageUrl = video.imagen || imageUrl;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: 'article',
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

// 3. COMPONENTE PRINCIPAL
export default async function Home() {
  let data = null;

  try {
    data = await getPageData();
    console.log("✅ Datos obtenidos de Supabase");
  } catch (error) {
    console.error("❌ Error buscando datos:", error);
  }

  return (
    <main className="min-h-screen bg-black">
      <MobileLayout data={data as any} isMobile={true} />
    </main>
  );
}