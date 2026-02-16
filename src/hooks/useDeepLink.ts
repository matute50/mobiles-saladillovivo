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
 * @param pageData - Datos de la página con videos y artículos
 */
export function useDeepLink(pageData: PageData | undefined) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { playManual } = useMediaPlayer();
    const hasTriggered = useRef(false);

    useEffect(() => {
        // Prevenir ejecución múltiple (React Strict Mode en dev)
        if (hasTriggered.current || !pageData) return;

        const videoId = searchParams.get('v');
        const articleId = searchParams.get('id');

        // Deep link para video (?v=123)
        if (videoId && pageData?.videos?.allVideos) {
            const targetVideo = pageData.videos.allVideos.find(
                (v: Video) => v.id === parseInt(videoId, 10)
            );

            if (targetVideo) {
                hasTriggered.current = true;

                // Safety Delay: esperar a que MobileLayout esté completamente montado
                setTimeout(() => {
                    playManual(targetVideo);
                    // Limpiar URL para evitar loops en próximas interacciones
                    router.replace('/', { scroll: false });
                }, 500);
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
                (a) => a?.id === parseInt(articleId, 10)
            );

            if (targetArticle) {
                hasTriggered.current = true;

                setTimeout(() => {
                    playManual(targetArticle);
                    router.replace('/', { scroll: false });
                }, 500);
            }
        }
    }, [searchParams, pageData, playManual, router]);
}
