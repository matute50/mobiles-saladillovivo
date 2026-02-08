// src/lib/types.ts
export interface Article {
  id: string;
  titulo: string;
  bajada: string;
  imagen: string | null;
  categoria: string;
  autor: string;
  fecha: string;
  contenido: string;
  etiquetas: string[];
  url_slide?: string | null;
  audio_url?: string | null;
  animation_duration?: number;
  slug?: string;
  featureStatus?: 'featured' | 'secondary' | 'tertiary' | 'none';
}

export interface Video {
  id: string;
  nombre: string;
  url: string;
  imagen: string | null;
  categoria: string;
  fecha: string;
  volumen_extra?: number;
}

export interface Ad {
  id: string;
  cliente: string;
  imagen_url: string;
  url: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

export interface PageData {
  articles: {
    featuredNews: Article | null;
    secondaryNews: Article[];
    otherNews: Article[];
  };
  videos: {
    allVideos: Video[];
    liveStream: Video | null;
  };
  ads: Ad[];
}