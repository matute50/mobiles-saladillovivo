// src/lib/data.ts
import { createClient } from '@/utils/supabase/client';
import { PageData, Video, Article, Ad } from '@/lib/types';

const supabase = createClient();

export async function getPageData(): Promise<PageData> {
  try {
    const [articlesRes, videosRes, adsRes] = await Promise.all([
      supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('videos')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(5000), // v62.0: REVERT - Back to 5000 (User Request: Missing content)
      supabase
        .from('anuncios')
        .select('*')
    ]);

    if (articlesRes.error) throw articlesRes.error;
    if (videosRes.error) throw videosRes.error;
    if (adsRes.error) throw adsRes.error;

    const mappedArticles: Article[] = (articlesRes.data || []).map((item: any) => ({
      id: String(item.id),
      titulo: (item.titulo || item.title || 'Sin título').replaceAll('|', ' ').trim(),
      bajada: (item.bajada || item.summary || item.description || '').trim(),
      imagen: item.imagen || item.image || item.imageUrl || item.image_url || null,
      categoria: item.categoria || item.category || 'General',
      autor: item.autor || item.author || 'Redacción',
      fecha: item.created_at || item.createdAt || item.fecha || new Date().toISOString(),
      contenido: item.contenido || item.content || item.body || '',
      etiquetas: item.etiquetas || item.tags || [],
      url_slide: item.url_slide || item.slide_url || item.slideUrl || null,
      audio_url: item.audio_url || item.url_audio || item.audioUrl || null,
      animation_duration: item.animation_duration || item.animationDuration || 45
    }));

    const mappedVideos: Video[] = (videosRes.data || []).map((item: any) => ({
      id: String(item.id),
      nombre: (item.nombre || item.title || item.name || 'Video sin nombre').replaceAll('|', ' ').trim(),
      url: item.url || item.videoUrl || '',
      imagen: item.imagen || item.image || item.thumbnail || null,
      categoria: item.categoria || item.category || 'Varios',
      fecha: item.createdAt || item.created_at || item.fecha || new Date().toISOString()
    }));

    const mappedAds: Ad[] = (adsRes.data || []).map((item: any) => ({
      id: String(item.id),
      cliente: item.cliente || item.client || 'Anónimo',
      imagen_url: item.imagen_url || item.imageUrl || item.image_url || '',
      url: item.url || item.link || '',
      tipo: item.tipo || item.type || 'banner',
      fecha_inicio: item.fecha_inicio || item.startDate || new Date().toISOString(),
      fecha_fin: item.fecha_fin || item.endDate || new Date().toISOString(),
      activo: item.activo !== undefined ? item.activo : (item.active !== undefined ? item.active : true)
    }));

    return {
      articles: {
        featuredNews: mappedArticles.length > 0 ? mappedArticles[0] : null,
        secondaryNews: mappedArticles.slice(1, 5),
        otherNews: mappedArticles.slice(5)
      },
      videos: { allVideos: mappedVideos, liveStream: null },
      ads: mappedAds
    };
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    return { articles: { featuredNews: null, secondaryNews: [], otherNews: [] }, videos: { allVideos: [], liveStream: null }, ads: [] };
  }
}