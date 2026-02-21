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


import { Header } from './Header';
import { VideoCarouselBlock } from './VideoCarouselBlock';
import { NewsSlider } from './NewsSlider';
import { InstallModal } from './InstallModal';
import { usePWA } from '@/context/PWAContext';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useOrientation } from '@/hooks/useOrientation';
import { useDeepLink } from '@/hooks/useDeepLink';
import { useNews } from '@/context/NewsContext';

export default function MobileLayout({ data, resumenId }: { data: PageData, resumenId?: string }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { setVideoPool, playManual, loadDailyShow } = useMediaPlayer();
  const { isInstallModalOpen, setIsInstallModalOpen } = usePWA();
  const { hasInteracted } = useVolume();
  const { handleSearch } = useNews();
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Custom Hooks (v24.2 - React Architecture)
  const isKeyboardOpen = useKeyboard(isSearchOpen);
  const isLandscape = useOrientation();

  // v24.5: Deep Linking - Auto-play shared content from WhatsApp/etc
  const deepLinkTarget = useDeepLink(data);

  useEffect(() => { setMounted(true); }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();

    const articles = [
      ...(data.articles?.featuredNews ? [data.articles.featuredNews] : []),
      ...(data.articles?.secondaryNews || []),
      ...(data.articles?.otherNews || [])
    ];

    const matchedArticles = articles.filter(a => (a as any).titulo.toLowerCase().includes(q));
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


  const hasLoadedResumen = React.useRef<string | null>(null);

  useEffect(() => {
    if (data && mounted) {
      if (resumenId) {
        if (hasLoadedResumen.current !== resumenId) {
          hasLoadedResumen.current = resumenId;
          loadDailyShow(resumenId);
        }
      } else {
        // v24.5.1: Pasar deep link target como initialTarget para prevenir sobrescritura
        setVideoPool(data.videos?.allVideos || [], deepLinkTarget || undefined);
      }
    }
  }, [data, mounted, setVideoPool, deepLinkTarget, resumenId, loadDailyShow]);

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
      if (enter) console.warn("Fullscreen toggle ignored (requires interaction or not supported).");
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    // v24.2: Solo intentar fullscreen automático si el usuario ya interactuó
    if (hasInteracted) {
      toggleFullscreen(isLandscape);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [isLandscape, hasInteracted]);

  // v22.7: Sync local search with NewsContext (Fetch-On-Demand)
  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  /* -------------------------------------------------------------
   * HANDLERS (v24.3 - Component Memoization)
   * ------------------------------------------------------------- */
  const handleVideoSelect = React.useCallback(() => {
    // v24.1: Safety Delay on Resets (Skill Rule)
    // Damos tiempo a la interacción de play antes de colapsar la búsqueda o borrar query
    setTimeout(() => {
      setSearchQuery("");
      setIsSearchOpen(false);
    }, 500);
  }, []);

  // v24.3: Memoize NewsSlider callbacks to prevent re-renders
  const handleNewsPrev = React.useCallback(() => {
    newsSwiper?.slidePrev();
  }, [newsSwiper]);

  const handleNewsNext = React.useCallback(() => {
    newsSwiper?.slideNext();
  }, [newsSwiper]);

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
          {/* Ocultar NewsSlider si hay teclado O si hay búsqueda activa (Prevent Layout Shift & "Resultados" flash) */}
          {!isKeyboardOpen && !isSearchOpen && (
            <NewsSlider
              newsSlides={newsSlides}
              isDark={isDark}
              searchQuery={searchQuery}
              onSwiper={setNewsSwiper}
              onPrev={handleNewsPrev}
              onNext={handleNewsNext}
            />
          )}

          <div className={cn("h-[160px] shrink-0", isKeyboardOpen ? "mt-2" : "-mt-[23px]")}>
            {/* Pasar searchQuery para activar 'TU BUSQUEDA' */}
            <VideoCarouselBlock
              isDark={isDark}
              searchQuery={searchQuery}
              onVideoSelect={handleVideoSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}
