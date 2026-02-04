'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import VideoSection from './VideoSection';
import { PageData, Video, Article } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import type { Swiper as SwiperClass } from 'swiper';
import { cn } from '@/lib/utils';
import 'swiper/css';

import { Maximize } from 'lucide-react';

// Sub-componentes
// Sub-componentes
import { Header } from './Header';
import { VideoCarouselBlock } from './VideoCarouselBlock';
import { NewsSlider } from './NewsSlider';
import { InstallModal } from './InstallModal';
import { usePWA } from '@/context/PWAContext';

export default function MobileLayout({ data }: { data: PageData }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { setVideoPool, playManual } = useMediaPlayer();
  const { isInstallModalOpen, setIsInstallModalOpen } = usePWA();
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  /* -------------------------------------------------------------
    * KEYBOARD DETECTION (v63.1) - MOVIDO AL INICIO PARA EVITAR ERROR #310
    * Detectamos si la altura visual es significativamente menor al alto de ventana
    * y si estamos en modo búsqueda (para mayor precisión).
    * ------------------------------------------------------------- */
  useEffect(() => {
    // Check if window is defined (SSR safety)
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.innerHeight;
      // Si el viewport es menor al 85% de la pantalla, asumimos teclado
      setIsKeyboardOpen(height < (screenHeight * 0.85) && isSearchOpen);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    // Initial check
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [isSearchOpen]);

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
      setVideoPool(data.videos?.allVideos || []);
    }
  }, [data, mounted, setVideoPool]);

  // (Removed unused sharing/deep link logic)

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
          isKeyboardOpen={isKeyboardOpen} // Prop para layout especial
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
          {/* Ocultar NewsSlider si hay teclado (User Request) */}
          {!isKeyboardOpen && (
            <NewsSlider
              newsSlides={newsSlides}
              isDark={isDark}
              searchQuery={searchQuery}
              onSwiper={setNewsSwiper}
              onPrev={() => newsSwiper?.slidePrev()}
              onNext={() => newsSwiper?.slideNext()}
            />
          )}

          <div className={cn("h-[160px] shrink-0", isKeyboardOpen ? "mt-2" : "-mt-[22px]")}>
            {/* Pasar searchQuery para activar 'TU BUSQUEDA' */}
            <VideoCarouselBlock
              videos={filteredData?.videos?.allVideos || []}
              isDark={isDark}
              searchQuery={searchQuery}
              onVideoSelect={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
