'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { PageData, Video, Article } from '@/lib/types';

/**
 * v24.5 - Deep Linking Hook
 * 
 * Detecta parámetros ?v= o ?id= en la URL y reproduce automáticamente
 * el contenido compartido cuando el usuario llega desde WhatsApp u otra app.
 * 
 * **IMPORTANTE**: Este hook debe ejecutarse ANTES de que MobileLayout llame a setVideoPool,
 * para que el initialTarget sea respetado y no se sobrescriba con un video aleatorio.
 * 
 * @param pageData - Datos de la página con videos y artículos
 * @returns targetContent - El contenido objetivo del deep link (para pasarlo a setVideoPool)
 */
export function useDeepLink(pageData: PageData | undefined): Video | Article | null {
    const searchParams = useSearchParams();
    const router = useRouter();
    const hasProcessed = useRef(false);

    // Solo procesar una vez
    if (hasProcessed.current || !pageData) return null;

    const videoId = searchParams.get('v');
    const articleId = searchParams.get('id');

    // Deep link para video (?v=123)
    if (videoId && pageData?.videos?.allVideos) {
        const targetVideo = pageData.videos.allVideos.find(
            (v: Video) => v.id === videoId
        );

        if (targetVideo) {
            hasProcessed.current = true;

            // Limpiar URL después de 500ms (esperar mount)
            setTimeout(() => {
                router.replace('/', { scroll: false });
            }, 500);

            return targetVideo;
        }
    }

    // Deep link para artículo (?id=456)
    if (articleId && pageData?.articles) {
        const allArticles: (Article | null)[] = [
            pageData.articles.featuredNews,
            ...(pageData.articles.secondaryNews || []),
            ...(pageData.articles.otherNews || [])
        ].filter(Boolean);

        const targetArticle = allArticles.find(
            (a) => a?.id === articleId
        );

        if (targetArticle) {
            hasProcessed.current = true;

            setTimeout(() => {
                router.replace('/', { scroll: false });
            }, 500);

            return targetArticle;
        }
    }

    return null;
}
