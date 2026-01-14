'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import VideoSection from './VideoSection';
import { PageData, Video } from '@/lib/types'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Controller } from 'swiper/modules';
import { Play, ChevronLeft, ChevronRight, X, Sun, Moon, Share2, Search, HelpCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';

// ... (STOP_WORDS, MOCK_DATA, CATEGORY_MAP, getDisplayCategory, getYouTubeThumbnail se mantienen) ...

function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isLandscape;
}

export default function MobileLayout({ data }: { data: PageData }) {
  const { videos, articles, ads } = data || {};
  const isLandscape = useOrientation();
  const { isDark, toggleTheme } = useTheme(); 
  const { playManual, setVideoPool } = useMediaPlayer();
  const { unmute } = useVolume();

  useEffect(() => {
    if (videos?.allVideos) setVideoPool(videos.allVideos);
  }, [videos, setVideoPool]);

  // Solicitud de Wake Lock para evitar que se apague la pantalla
  useEffect(() => {
    let wakeLock: any = null;
    const requestLock = async () => {
      if ('wakeLock' in navigator) {
        try { wakeLock = await (navigator as any).wakeLock.request('screen'); } catch (e) {}
      }
    };
    requestLock();
    return () => wakeLock?.release();
  }, []);

  const logoSrc = isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png';

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden transition-colors", isDark ? "bg-black" : "bg-neutral-50")}>
      
      {/* HEADER: Se oculta en horizontal */}
      {!isLandscape && (
        <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-50", isDark ? "bg-black" : "bg-white")}>
          <div className="relative w-36 h-full py-1">
            <Image src={logoSrc} alt="Logo" fill className="object-contain" priority />
          </div>
          <div className="flex gap-4">
             <button onClick={toggleTheme}>{isDark ? <Sun size={20} className="text-white"/> : <Moon size={20}/>}</button>
          </div>
        </header>
      )}

      {/* CONTENEDOR DE VIDEO: TRANSFORMAR A FULLSCREEN SI ES HORIZONTAL */}
      <div className={cn(
        "transition-all duration-500 ease-in-out",
        isLandscape 
          ? "fixed inset-0 z-[500] w-[100vw] h-[100dvh] bg-black" 
          : "shrink-0 sticky top-0 z-40 w-full aspect-video shadow-2xl"
      )}>
        <VideoSection isMobile={true} />
      </div>

      {/* CONTENIDO SCROLLABLE: Se oculta en horizontal */}
      {!isLandscape && (
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
           {/* ... Aquí van tus Swipers de Noticias, Carrusel de Videos y Ads ... */}
           <h3 className={cn("font-bold text-xl uppercase", isDark ? "text-white" : "text-black")}>Últimas Noticias</h3>
           {/* (Implementación de Swiper idéntica a la anterior) */}
        </div>
      )}
    </div>
  );
}