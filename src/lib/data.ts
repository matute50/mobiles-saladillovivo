import { createClient } from '@/utils/supabase/client'; 
import { PageData, Video, Article, Ad } from '@/lib/types';

// Inicializamos cliente
const supabase = createClient();

export async function getPageData(): Promise<PageData> {
  console.log('Server 🔄 Iniciando carga de datos...');

  try {
    // ==========================================
    // 1. CARGA DE NOTICIAS (Tabla: articles)
    // ==========================================
    const { data: rawArticles, error: articlesError } = await supabase
      .from('articles') 
      .select('*') 
      .order('created_at', { ascending: false }) 
      .limit(20);

    if (articlesError) throw articlesError;

    // MAPEO DE NOTICIAS
    const mappedArticles: Article[] = (rawArticles || []).map((item: any) => ({
      id: item.id,
      titulo: item.title || item.titulo || 'Sin título',
      bajada: item.summary || item.bajada || item.description || '',
      imagen: item.image || item.imagen || item.imageUrl || item.image_url || null,
      categoria: item.category || item.categoria || 'General',
      autor: item.author || item.autor || 'Redacción',
      fecha: item.created_at || item.createdAt || item.fecha || new Date().toISOString(),
      contenido: item.content || item.body || item.contenido || '',
      etiquetas: item.tags || item.etiquetas || [],
      
      // CAMPOS DEL PLAYER
      url_slide: item.slideUrl || item.slide_url || item.url_slide || null,
      animation_duration: item.animationDuration || item.animation_duration || item.duration || 45
    }));


    // ==========================================
    // 2. CARGA DE VIDEOS (Tabla: videos)
    // ==========================================
    const { data: rawVideos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .order('createdAt', { ascending: false })
      // CORRECCIÓN: Aumentamos a 5000 para que aparezcan categorías más antiguas
      .limit(5000);

    if (videosError) throw videosError;

    // MAPEO DE VIDEOS
    const mappedVideos: Video[] = (rawVideos || []).map((item: any) => ({
      id: item.id,
      nombre: item.title || item.name || item.nombre || 'Video sin nombre',
      url: item.url || item.videoUrl || '',
      imagen: item.image || item.thumbnail || item.imagen || null,
      categoria: item.category || item.categoria || 'Varios',
      fecha: item.createdAt || item.created_at || item.fecha || new Date().toISOString()
    }));


    // ==========================================
    // 3. CARGA DE PUBLICIDAD (Tabla: anuncios)
    // ==========================================
    const { data: rawAds, error: adsError } = await supabase
      .from('anuncios') 
      .select('*');

    if (adsError) throw adsError;

    // MAPEO DE PUBLICIDAD
    const mappedAds: Ad[] = (rawAds || []).map((item: any) => ({
      id: item.id,
      cliente: item.client || item.cliente || 'Anónimo',
      imagen_url: item.imageUrl || item.image_url || item.imagen_url || '',
      url: item.url || item.link || '',
      tipo: item.type || item.tipo || 'banner',
      fecha_inicio: item.startDate || item.start_date || item.fecha_inicio || new Date().toISOString(),
      fecha_fin: item.endDate || item.end_date || item.fecha_fin || new Date().toISOString(),
      activo: item.active !== undefined ? item.active : (item.activo !== undefined ? item.activo : true)
    }));


    // ==========================================
    // PROCESAMIENTO FINAL
    // ==========================================
    const featuredNews = mappedArticles.length > 0 ? mappedArticles[0] : null;
    const secondaryNews = mappedArticles.slice(1, 5);
    const otherNews = mappedArticles.slice(5);

    console.log(`Server ✅ Datos cargados: ${mappedArticles.length} noticias, ${mappedVideos.length} videos, ${mappedAds.length} anuncios.`);

    return {
      articles: {
        featuredNews,
        secondaryNews,
        otherNews
      },
      videos: {
        allVideos: mappedVideos,
        liveStream: null 
      },
      ads: mappedAds
    };

  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    return {
      articles: { featuredNews: null, secondaryNews: [], otherNews: [] },
      videos: { allVideos: [], liveStream: null },
      ads: []
    };
  }
}