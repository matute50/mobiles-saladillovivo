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

    const mappedArticles: Article[] = (articlesRes.data || []).map((item: any) => {
      // Prioridad de imagen: imagen > image_url > imageUrl > image > image_url_alt > primera de images_urls
      const backupImage = Array.isArray(item.images_urls) && item.images_urls.length > 0 ? item.images_urls[0] : null;

      return {
        id: String(item.id),
        titulo: (item.titulo || item.title || 'Sin título').replaceAll('|', ' ').trim(),
        bajada: (item.bajada || item.summary || item.description || '').trim(),
        imagen: item.imagen || item.image_url || item.image || item.imageUrl || item.image_url_alt || backupImage || null,
        categoria: item.categoria || item.category || 'General',
        autor: item.autor || item.author || 'Redacción',
        fecha: item.created_at || item.createdAt || item.fecha || new Date().toISOString(),
        contenido: item.contenido || item.content || item.body || '',
        etiquetas: item.etiquetas || item.tags || [],
        url_slide: item.url_slide || item.slide_url || item.slideUrl || null,
        audio_url: item.audio_url || item.url_audio || item.audioUrl || null,
        animation_duration: item.animation_duration || item.animationDuration || 45
      };
    });

    const mappedVideos: Video[] = (videosRes.data || []).map((item: any) => ({
      id: String(item.id),
      nombre: (item.nombre || item.title || item.name || 'Video sin nombre').replaceAll('|', ' ').trim(),
      url: item.url || item.videoUrl || '',
      imagen: item.imagen || item.image || item.thumbnail || null,
      categoria: item.categoria || item.category || 'Varios',
      fecha: item.createdAt || item.created_at || item.fecha || new Date().toISOString(),
      volumen_extra: item.volumen_extra ? Number(item.volumen_extra) : 1
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

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const backupImage = Array.isArray(data.images_urls) && data.images_urls.length > 0 ? data.images_urls[0] : null;

  return {
    id: String(data.id),
    titulo: (data.titulo || data.title || 'Sin título').replaceAll('|', ' ').trim(),
    bajada: (data.bajada || data.summary || data.description || '').trim(),
    imagen: data.imagen || data.image_url || data.image || data.imageUrl || data.image_url_alt || backupImage || null,
    categoria: data.categoria || data.category || 'General',
    autor: data.autor || data.author || 'Redacción',
    fecha: data.created_at || data.createdAt || data.fecha || new Date().toISOString(),
    contenido: data.contenido || data.content || data.body || '',
    etiquetas: data.etiquetas || data.tags || [],
    url_slide: data.url_slide || data.slide_url || data.slideUrl || null,
    audio_url: data.audio_url || data.url_audio || data.audioUrl || null,
    animation_duration: data.animation_duration || data.animationDuration || 45
  };
}

export async function getVideoById(id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: String(data.id),
    nombre: (data.nombre || data.title || data.name || 'Video sin nombre').replaceAll('|', ' ').trim(),
    url: data.url || data.videoUrl || '',
    imagen: data.imagen || data.image || data.thumbnail || null,
    categoria: data.categoria || data.category || 'Varios',
    fecha: data.createdAt || data.created_at || data.fecha || new Date().toISOString(),
    volumen_extra: data.volumen_extra ? Number(data.volumen_extra) : 1
  };
}