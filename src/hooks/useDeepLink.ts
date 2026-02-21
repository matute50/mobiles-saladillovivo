'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { PageData, Video, Article } from '@/lib/types';

/**
 * v24.5 - Deep Linking Hook
 */
export function useDeepLink(pageData: PageData | undefined): Video | Article | null {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const hasProcessed = useRef(false);
    const targetRef = useRef<Video | Article | null>(null);

    // Solo procesar una vez para encontrar el target
    if (!hasProcessed.current && pageData) {
        // No procesar deep links si estamos en la ruta de resumen directamente
        if (pathname.includes('/resumen/')) {
            hasProcessed.current = true;
            return null;
        }
        const videoId = searchParams.get('v');
        const articleId = searchParams.get('id');

        // Deep link para video (?v=123)
        if (videoId && pageData.videos?.allVideos) {
            const targetVideo = pageData.videos.allVideos.find(
                (v: Video) => v.id === videoId
            );

            if (targetVideo) {
                hasProcessed.current = true;
                targetRef.current = targetVideo;

                // Limpiar URL después de 500ms (esperar mount)
                setTimeout(() => {
                    router.replace('/', { scroll: false });
                }, 500);
            }
        }

        // Deep link para artículo (?id=456)
        if (!targetRef.current && articleId && pageData.articles) {
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
                targetRef.current = targetArticle;

                setTimeout(() => {
                    router.replace('/', { scroll: false });
                }, 500);
            }
        }

        // Si hay parámetros pero no encontramos el contenido, marcamos como procesado
        // para evitar loops si el contenido no existe.
        if (!targetRef.current && (videoId || articleId)) {
            hasProcessed.current = true;
        }
    }

    return targetRef.current;
}
