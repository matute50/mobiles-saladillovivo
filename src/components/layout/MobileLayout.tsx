'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import VideoSection from './VideoSection';
import { PageData, Video, Article } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import type { Swiper as SwiperClass } from 'swiper';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import 'swiper/css';

// Sub-componentes
// Sub-componentes
import { Header } from './Header';
import { VideoCarouselBlock } from './VideoCarouselBlock';
import { NewsSlider } from './NewsSlider';
import { InstallModal } from './InstallModal';
import { usePWA } from '@/context/PWAContext';

export default function MobileLayout({ data, initialParams }: { data: PageData; initialParams?: { id?: string; v?: string } }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { setVideoPool, playManual } = useMediaPlayer();
  const { isInstallModalOpen, setIsInstallModalOpen } = usePWA();
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const processedDeepLink = React.useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();

    const articles = [
      ...(data.articles?.featuredNews ? [data.articles.featuredNews] : []),
      ...(data.articles?.secondaryNews || []),
      ...(data.articles?.otherNews || [])
    ];

    const matchedArticles = articles.filter(a => a.titulo.toLowerCase().includes(q));
    const matchedVideos = (data.videos?.allVideos || []).filter(v => v.nombre.toLowerCase().includes(q));

    return {
      ...data,
      articles: {
        featuredNews: matchedArticles[0] || null,
        secondaryNews: matchedArticles.slice(1, 5),
        otherNews: matchedArticles.slice(5)
      },
      videos: {
        ...data.videos,
        allVideos: matchedVideos
      }
    };
  }, [searchQuery, data]);

  const newsSlides = useMemo(() => {
    const slides = [];
    const articles = filteredData?.articles;
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    return slides;
  }, [filteredData]);


  useEffect(() => {
    if (data && mounted) {
      const allVideos = data.videos?.allVideos || [];
      const newsId = initialParams?.id || searchParams.get('id');
      const videoId = initialParams?.v || searchParams.get('v');
      let target: Video | Article | undefined;

      if (newsId) {
        const articlesArr = [
          ...(data.articles?.featuredNews ? [data.articles.featuredNews] : []),
          ...(data.articles?.secondaryNews || []),
          ...(data.articles?.otherNews || [])
        ];
        target = articlesArr.find(n => String(n.id).trim() === String(newsId).trim());
      } else if (videoId) {
        target = allVideos.find(v => String(v.id).trim() === String(videoId).trim());
      }

      // Inicializar pool
      setVideoPool(allVideos, target);

      // REFUERZO DE DEEP LINKING (v22.7 - Loop Fix):
      const currentId = newsId || videoId;

      // Solo ejecutamos lógica de refuerzo/fetch si tenemos un ID y NO lo hemos procesado aún en esta sesión.
      if (currentId && processedDeepLink.current !== currentId) {

        if (target) {
          // Caso A: Video encontrado y setVideoPool ya lo inició.
          // Marcamos como procesado para evitar futuros triggers.
          processedDeepLink.current = currentId;
        } else if (videoId) {
          // Caso B: Fetch On Demand
          // Marcamos INMEDIATAMENTE como procesado para evitar que re-renders durante el await disparen otro fetch
          processedDeepLink.current = videoId;

          const fetchMissingVideo = async () => {
            try {
              const supabase = createClient();
              const { data: missingVideo, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .single();

              if (missingVideo && !error) {
                const mappedVideo: Video = {
                  id: String(missingVideo.id),
                  nombre: (missingVideo.nombre || missingVideo.title || 'Video sin nombre').replaceAll('|', ' ').trim(),
                  url: missingVideo.url || missingVideo.videoUrl || '',
                  imagen: missingVideo.imagen || missingVideo.image || missingVideo.thumbnail || null,
                  categoria: missingVideo.categoria || missingVideo.category || 'Varios',
                  fecha: missingVideo.createdAt || missingVideo.created_at || new Date().toISOString()
                };

                console.log('Link Rescue: Playing', mappedVideo.nombre);
                // Importante: Al actualizar el pool aquí, provocamos un re-render.
                // Pero gracias a processedDeepLink.current, el próximo efecto ignorará este bloque.
                setVideoPool([mappedVideo, ...allVideos], mappedVideo);
                playManual(mappedVideo);
              }
            } catch (err) {
              console.error('Link Rescue Error:', err);
            }
          };
          fetchMissingVideo();
        }
      }
    }
  }, [data, mounted, searchParams, setVideoPool, playManual, initialParams]);

  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleOrientationChange = () => {
      const isLand = window.matchMedia("(orientation: landscape)").matches;
      // Pequeño workaround para teclados virtuales: verificar que el alto sea menor que el ancho
      const isKeyboardOpen = (window.visualViewport?.height || window.innerHeight) < 300 && !isLand;

      if (!isKeyboardOpen) {
        setIsLandscape(isLand);
      }
    };

    // Check inicial
    handleOrientationChange();

    // Listeners
    const mediaQuery = window.matchMedia("(orientation: landscape)");

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleOrientationChange);
    } else {
      // Deprecated API fallback
      mediaQuery.addListener(handleOrientationChange);
    }

    // Backup 'resize' para mayor compatibilidad
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleOrientationChange);
      } else {
        mediaQuery.removeListener(handleOrientationChange);
      }
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden", isDark ? "bg-black" : "bg-neutral-50")}>
      {!isLandscape && (
        <Header
          isDark={isDark}
          setIsDark={setIsDark}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <div className={cn(
        isLandscape
          ? "fixed inset-0 z-[100] w-screen h-screen bg-black touch-none"
          : "relative z-40 w-full aspect-video bg-black"
      )}>
        <VideoSection isMobile={true} isDark={isDark} />
      </div>

      {!isLandscape && (
        <div className="flex-1 flex flex-col gap-2 px-3 pt-1 pb-4 overflow-y-auto">
          <NewsSlider
            newsSlides={newsSlides}
            isDark={isDark}
            searchQuery={searchQuery}
            onSwiper={setNewsSwiper}
            onPrev={() => newsSwiper?.slidePrev()}
            onNext={() => newsSwiper?.slideNext()}
          />

          <div className="h-[160px] shrink-0 -mt-[22px]">
            <VideoCarouselBlock videos={filteredData?.videos?.allVideos || []} isDark={isDark} />
          </div>
        </div>
      )}
    </div>
  );
}
