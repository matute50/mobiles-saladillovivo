// src/lib/data.ts
import { PageData, Video, Article, Ad } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getPageData(): Promise<PageData> {
  try {
    const fetchArticles = async () => {
      const url = `${supabaseUrl}/rest/v1/articles?select=id,title,description,image_url,images_urls,created_at,slug,audio_url,url_slide,animation_duration,featureStatus&order=created_at.desc&limit=50`;
      const res = await fetch(url, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }, next: { revalidate: 60 } });
      return res.json();
    };

    const fetchVideos = async () => {
      const url = `${supabaseUrl}/rest/v1/videos?select=id,nombre,url,imagen,categoria,createdAt,volumen_extra&order=createdAt.desc&limit=150`;
      const res = await fetch(url, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }, next: { revalidate: 60 } });
      return res.json();
    };

    const fetchAds = async () => {
      const url = `${supabaseUrl}/rest/v1/anuncios?select=id,name,imageUrl,linkUrl,isActive,createdAt&isActive=eq.true&order=createdAt.desc`;
      const res = await fetch(url, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }, next: { revalidate: 60 } });
      return res.json();
    };

    const [articlesData, videosData, adsData] = await Promise.all([
      fetchArticles(),
      fetchVideos(),
      fetchAds()
    ]);

    const mappedArticles: Article[] = (articlesData || []).map((item: any) => {
      const backupImage = Array.isArray(item.images_urls) && item.images_urls.length > 0 ? item.images_urls[0] : null;

      return {
        id: String(item.id),
        titulo: (item.title || 'Sin título').replaceAll('|', ' ').trim(),
        bajada: (item.description || '').trim(),
        imagen: item.image_url || backupImage || null,
        categoria: 'General',
        autor: 'Redacción',
        fecha: item.created_at || new Date().toISOString(),
        contenido: item.description || '',
        etiquetas: [],
        url_slide: item.url_slide || null,
        audio_url: item.audio_url || null,
        animation_duration: item.animation_duration || 45,
        featureStatus: item.featureStatus || 'none'
      };
    });

    const mappedVideos: Video[] = (videosData || []).map((item: any) => ({
      id: String(item.id),
      nombre: (item.nombre || 'Video sin nombre').replaceAll('|', ' ').trim(),
      url: item.url || '',
      imagen: item.imagen || null,
      categoria: item.categoria || 'Varios',
      fecha: item.createdAt || new Date().toISOString(),
      volumen_extra: item.volumen_extra ? Number(item.volumen_extra) : 1
    }));

    const mappedAds: Ad[] = (adsData || []).map((item: any) => ({
      id: String(item.id),
      cliente: item.name || 'Anónimo',
      imagen_url: item.imageUrl || '',
      url: item.linkUrl || '',
      tipo: 'banner',
      fecha_inicio: item.createdAt || new Date().toISOString(),
      fecha_fin: item.createdAt || new Date().toISOString(),
      activo: item.isActive !== undefined ? item.isActive : true
    }));

    return {
      articles: {
        featuredNews: mappedArticles.find(a => a.featureStatus === 'featured') || (mappedArticles.length > 0 ? mappedArticles[0] : null),
        secondaryNews: mappedArticles.filter(a => a.featureStatus === 'secondary'),
        otherNews: mappedArticles.filter(a => !['featured', 'secondary'].includes(a.featureStatus || ''))
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
  const url = `${supabaseUrl}/rest/v1/articles?select=id,title,description,image_url,images_urls,created_at,slug,audio_url,url_slide,animation_duration,featureStatus&id=eq.${id}&maybeSingle=true`;

  try {
    const res = await fetch(url, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }, next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText} for article ${id}`);
    const data = await res.json();
    if (!data) return null;

    const backupImage = Array.isArray(data.images_urls) && data.images_urls.length > 0 ? data.images_urls[0] : null;

    return {
      id: String(data.id),
      titulo: (data.title || 'Sin título').replaceAll('|', ' ').trim(),
      bajada: (data.description || '').trim(),
      imagen: data.image_url || backupImage || null,
      categoria: 'General',
      autor: 'Redacción',
      fecha: data.created_at || new Date().toISOString(),
      contenido: data.description || '',
      etiquetas: [],
      url_slide: data.url_slide || null,
      audio_url: data.audio_url || null,
      animation_duration: data.animation_duration || 45,
      featureStatus: data.featureStatus || 'none'
    };
  } catch (err: any) {
    console.error('Error in getArticleById:', err);
    throw new Error(`getArticleById(${id}): ${err.message}`);
  }
}

export async function getVideoById(id: string): Promise<Video | null> {
  const url = `${supabaseUrl}/rest/v1/videos?select=id,nombre,url,imagen,categoria,createdAt,volumen_extra&id=eq.${id}&maybeSingle=true`;

  try {
    const res = await fetch(url, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }, next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText} for video ${id}`);
    const data = await res.json();
    if (!data) return null;

    return {
      id: String(data.id),
      nombre: (data.nombre || 'Video sin nombre').replaceAll('|', ' ').trim(),
      url: data.url || '',
      imagen: data.imagen || null,
      categoria: data.categoria || 'Varios',
      fecha: data.createdAt || new Date().toISOString(),
      volumen_extra: data.volumen_extra ? Number(data.volumen_extra) : 1
    };
  } catch (err: any) {
    console.error('Error in getVideoById:', err);
    throw new Error(`getVideoById(${id}): ${err.message}`);
  }
}

export async function fetchVideosByCategory(category: string): Promise<Video[]> {
  const url = `${supabaseUrl}/rest/v1/videos?select=id,nombre,url,imagen,categoria,createdAt,volumen_extra&categoria=eq.${encodeURIComponent(category)}&order=createdAt.desc&limit=30`;

  try {
    const res = await fetch(url, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }, next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();

    return (data || []).map((item: any) => ({
      id: String(item.id),
      nombre: (item.nombre || 'Video sin nombre').replaceAll('|', ' ').trim(),
      url: item.url || '',
      imagen: item.imagen || null,
      categoria: item.categoria || 'Varios',
      fecha: item.createdAt || new Date().toISOString(),
      volumen_extra: item.volumen_extra ? Number(item.volumen_extra) : 1
    }));
  } catch (err) {
    console.error(`Error fetching videos for category ${category}:`, err);
    return [];
  }
}

export async function fetchAvailableCategories(): Promise<string[]> {
  const url = `${supabaseUrl}/rest/v1/videos?select=categoria`;

  try {
    const res = await fetch(url, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }, next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    const uniqueCategories = Array.from(new Set((data || []).map((v: any) => v.categoria))).filter(Boolean);
    return uniqueCategories as string[];
  } catch (err) {
    console.error("Error fetching available categories:", err);
    return [];
  }
}

export async function fetchVideosBySearch(query: string, signal?: AbortSignal): Promise<Video[]> {
  const url = `${supabaseUrl}/rest/v1/videos?select=id,nombre,url,imagen,categoria,createdAt,volumen_extra&nombre=ilike.*${encodeURIComponent(query)}*&limit=20`;

  try {
    const res = await fetch(url, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
      next: { revalidate: 60 },
      signal
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data || []).map((item: any) => ({
      id: String(item.id),
      nombre: (item.nombre || 'Video sin nombre').replaceAll('|', ' ').trim(),
      url: item.url || '',
      imagen: item.imagen || null,
      categoria: item.categoria || 'Varios',
      fecha: item.createdAt || new Date().toISOString(),
      volumen_extra: item.volumen_extra ? Number(item.volumen_extra) : 1
    }));
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    console.error('Error searching videos:', err);
    return [];
  }
}