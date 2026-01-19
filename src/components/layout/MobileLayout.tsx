'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import VideoSection from './VideoSection';
import { PageData, Video, Article } from '@/lib/types'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Controller } from 'swiper/modules';
import { Play, ChevronLeft, ChevronRight, X, Sun, Moon, Share2, Search, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';

// ... (se mantienen useOrientation y useTheme igual) ...

export default function MobileLayout({ data }: { data: PageData }) {
  const isLandscape = useOrientation(); 
  const { isDark, toggleTheme } = useTheme(); 
  const { state, setVideoPool, playManual } = useMediaPlayer(); 
  const { unmute } = useVolume(); 
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (data && mounted) {
      const newsId = searchParams.get('id');
      const videoId = searchParams.get('v');
      const allVideos = data.videos?.allVideos || [];
      
      let target: Video | Article | undefined;

      if (newsId) {
        const allArticles = [
          ...(data.articles?.featuredNews ? [data.articles.featuredNews] : []),
          ...(data.articles?.secondaryNews || []),
          ...(data.articles?.otherNews || [])
        ];
        target = allArticles.find(n => String(n.id) === newsId);
      } 
      else if (videoId) {
        // Buscamos el video compartido en la tabla videos
        target = allVideos.find(v => String(v.id) === videoId);
      }

      // 🔊 INTENTO AGRESIVO DE AUDIO:
      if (target) {
        unmute(); // Activamos el volumen en el estado global
        // Pequeño truco: intentamos activar el audio al primer toque en cualquier lado
        const forceAudio = () => {
            unmute();
            window.removeEventListener('touchstart', forceAudio);
        };
        window.addEventListener('touchstart', forceAudio);
      }

      setVideoPool(allVideos, target);
    }
    setMounted(true);
  }, [data, mounted, searchParams, setVideoPool, unmute]);

  // ... (el resto del renderizado se mantiene igual) ...

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden transition-colors", isDark ? "bg-black" : "bg-neutral-50")}>
      {/* ... header ... */}
      
      {/* AÑADIMOS UNA KEY AL VIDEOSECTION: 
          Esto obliga a React a reiniciar el reproductor cuando cambia el contenido,
          evitando que se quede "paralizado" en la intro.
      */}
      <div className={cn("transition-all duration-500", isLandscape ? "fixed inset-0 z-[500] w-[100vw] h-[100dvh]" : "relative z-40 w-full aspect-video bg-black")}>
        <VideoSection key={state.currentContent?.id || 'empty'} isMobile={true} />
      </div>

      {/* ... resto del layout ... */}
    </div>
  );
}