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

import { Maximize } from 'lucide-react';

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
      // v56.0: DEEP LINK BLOCKER
      // "Loop de Reseteo": Si un user entra con link (?v=XYZ), pero el video no está en la lista inicial (rescue pending),
      // NO debemos activar el pool todavía. Si lo hacemos, el context arranca un video random "mientras tanto".
      // Esperamos a que el fetch termine.
      const isRescuePending = (newsId || videoId) && !target;

      if (!isRescuePending) {
        setVideoPool(allVideos, target);
      }

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

          // v60.0: TIMEOUT HANDLING FIX
          // Guardamos el ID del timeout para cancelarlo si el fetch tiene éxito.
          // Si no lo cancelamos, a los 3s sobreescribirá el video rescatado con el random pool user report.
          let safetyTimeoutId: NodeJS.Timeout;

          const fetchMissingVideo = async () => {
            try {
              const supabase = createClient();
              const { data: missingVideo, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .single();

              if (missingVideo && !error) {
                // EXITO: Cancelamos la bomba de tiempo
                clearTimeout(safetyTimeoutId);

                const mappedVideo: Video = {
                  id: String(missingVideo.id),
                  nombre: (missingVideo.nombre || missingVideo.title || 'Video sin nombre').replaceAll('|', ' ').trim(),
                  url: missingVideo.url || missingVideo.videoUrl || '',
                  imagen: missingVideo.imagen || missingVideo.image || missingVideo.thumbnail || null,
                  categoria: missingVideo.categoria || missingVideo.category || 'Varios',
                  fecha: missingVideo.createdAt || missingVideo.created_at || new Date().toISOString()
                };

                console.log('Link Rescue: Playing', mappedVideo.nombre);

                // v59.0 (Recovered): Remove loading spinner
                setHasFallbackTriggered(true); // Ocultar spinner (ya tenemos video)

                // v56.0: FIX: setVideoPool ya activa la transición automáticamente si pasamos 'mappedVideo'.
                setVideoPool([mappedVideo, ...allVideos], mappedVideo);
              }
            } catch (err) {
              console.error('Link Rescue Error:', err);
              // Fallback en error
              setHasFallbackTriggered(true);
              setVideoPool(allVideos);
            }
          };

          // v58.0: TIMEOUT DE SEGURIDAD
          // Si Supabase tarda > 3s, abortamos el rescate.
          safetyTimeoutId = setTimeout(() => {
            console.warn("Rescue Timeout: Force Fallback");
            if (!processedDeepLink.current) return;
            setHasFallbackTriggered(true);
            setVideoPool(allVideos);
          }, 3000);

          fetchMissingVideo();
        }
      }
    }
  }, [data, mounted, searchParams, setVideoPool, playManual, initialParams]);

  // v58.0: LOADING SPINNER
  // Si estamos esperando un rescate, la pantalla está negra (VideoSection vacío).
  // Mostramos un spinner para calmar la ansiedad.
  const newsId = initialParams?.id || searchParams.get('id');
  const videoId = initialParams?.v || searchParams.get('v');
  // Re-calculamos target localmente para saber si estamos en "Limbo"
  let targetFound = false;
  if (data) {
    const allVideos = data.videos?.allVideos || [];
    if (newsId) {
      const articles = [...(data.articles?.featuredNews ? [data.articles.featuredNews] : []), ...(data.articles?.secondaryNews || []), ...(data.articles?.otherNews || [])];
      if (articles.find(n => String(n.id) === String(newsId))) targetFound = true;
    } else if (videoId) {
      if (allVideos.find(v => String(v.id) === String(videoId))) targetFound = true;
    } else {
      targetFound = true; // No hay link, no hay rescue needed
    }
  }

  // v59.0: FIX ETERNAL SPINNER
  // Necesitamos un estado local para saber si ya nos rendimos (fallback triggered).
  // Si el fallback se activa, debemos ocultar el spinner aunque el video no esté en 'data'.
  const [hasFallbackTriggered, setHasFallbackTriggered] = useState(false);
  const showLoading = (newsId || videoId) && !targetFound && mounted && !hasFallbackTriggered;

  const videoContainerRef = React.useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper para Fullscreen Cross-Browser
  const toggleFullscreen = async (enter: boolean) => {
    try {
      if (enter) {
        const el = videoContainerRef.current as any;
        if (!el) return;

        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen(); // Safari/Chrome legacy
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen(); // Firefox
        else if (el.msRequestFullscreen) await el.msRequestFullscreen(); // IE/Edge legacy
      } else {
        const doc = document as any;
        if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
          if (doc.exitFullscreen) await doc.exitFullscreen();
          else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
          else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
          else if (doc.msExitFullscreen) await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen API blocked:", err);
    }
  };

  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    const handleOrientationChange = () => {
      const isLand = window.matchMedia("(orientation: landscape)").matches;
      // Pequeño workaround para teclados virtuales: verificar que el alto sea menor que el ancho
      const isKeyboardOpen = (window.visualViewport?.height || window.innerHeight) < 300 && !isLand;

      if (!isKeyboardOpen) {
        setIsLandscape(isLand);
        toggleFullscreen(isLand);
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
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);

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

      <div
        ref={videoContainerRef}
        className={cn(
          isLandscape
            ? "fixed inset-0 z-[100] w-screen h-screen bg-black touch-none"
            : "relative z-40 w-full aspect-video bg-black"
        )}>
        <VideoSection isMobile={true} isDark={isDark} />

        {/* LOADING SPINNER (v58.0) */}
        {showLoading && (
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black gap-3">
            <div className="w-10 h-10 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" />
            <span className="text-white/60 text-xs font-medium animate-pulse">Cargando video...</span>
          </div>
        )}

        {/* Botón de Rescate para Fullscreen si falló el automático */}
        {isLandscape && !isFullscreen && (
          <button
            onClick={() => toggleFullscreen(true)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] bg-black/60 text-white p-4 rounded-full backdrop-blur-sm border border-white/20 animate-pulse"
          >
            <Maximize size={48} />
          </button>
        )}
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
