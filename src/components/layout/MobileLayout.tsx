'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// Componente Interno: Pantalla de Carga
function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
      <div className="relative w-48 h-24 animate-pulse">
        <Image src="/FONDO_OSCURO.png" alt="Saladillo Vivo" fill className="object-contain" />
      </div>
      <div className="mt-8 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#003399]/30 border-t-[#003399] rounded-full animate-spin" />
        <p className="mt-4 text-neutral-500 text-[10px] uppercase tracking-[0.3em] font-bold">Iniciando experiencia...</p>
      </div>
    </div>
  );
}

// ... (Las funciones auxiliares STOP_WORDS, getDisplayCategory, etc., se mantienen igual)

export default function MobileLayout({ data }: { data: PageData }) {
  const isLandscape = useOrientation(); 
  const { isDark, toggleTheme } = useTheme(); 
  const { setVideoPool } = useMediaPlayer(); 
  const [mounted, setMounted] = useState(false);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; view: 'decreto' | 'creador' }>({ isOpen: false, view: 'decreto' });

  // Sincronización inicial
  useEffect(() => {
    if (data?.videos?.allVideos) setVideoPool(data.videos.allVideos);
    
    // Simulamos un breve tiempo de carga para que la transición no sea brusca
    const timer = setTimeout(() => setMounted(true), 1500);
    return () => clearTimeout(timer);
  }, [data, setVideoPool]);

  // Si no está montado, mostramos la pantalla de carga elegante
  if (!mounted) return <LoadingScreen />;

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden transition-colors", isDark ? "bg-black" : "bg-neutral-50")}>
      {/* Todo el contenido del Layout que ya teníamos... */}
      {/* ... (Header, VideoSection, Swipers, etc.) ... */}
    </div>
  );
}