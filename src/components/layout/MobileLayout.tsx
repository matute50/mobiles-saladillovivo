'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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

// ... (STOP_WORDS, getDisplayCategory, getYouTubeThumbnail, useOrientation, useTheme, etc., se mantienen igual)

export default function MobileLayout({ data }: { data: PageData }) {
  const isLandscape = useOrientation(); 
  const { isDark, toggleTheme } = useTheme(); 
  const { setVideoPool, playManual, state } = useMediaPlayer(); 
  const { unmute } = useVolume();
  
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; view: 'decreto' | 'creador' }>({ isOpen: false, view: 'decreto' });

  // 1. Cargamos el pool apenas llegan los datos
  useEffect(() => {
    if (data?.videos?.allVideos) {
      setVideoPool(data.videos.allVideos);
    }
    setMounted(true);
  }, [data, setVideoPool]);

  // Filtro de búsqueda
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return (data?.videos?.allVideos || []).filter(v => 
      v.nombre.toLowerCase().includes(q) || v.categoria.toLowerCase().includes(q)
    );
  }, [searchQuery, data]);

  const activeVideos = data?.videos?.allVideos || [];
  if (!mounted) return null;

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden transition-colors", isDark ? "bg-black" : "bg-neutral-50")}>
      
      {/* ... Header (Mismo código de tu archivo) ... */}

      <div className={cn("transition-all duration-500", isLandscape ? "fixed inset-0 z-[500] w-[100vw] h-[100dvh]" : "relative z-40 w-full aspect-video bg-black")}>
        <VideoSection isMobile={true} />
      </div>

      {!isLandscape && (
        <div className="flex-1 flex flex-col gap-2 px-3 pt-1 pb-1 min-h-0 overflow-y-auto">
          {/* Secciones de Noticias, Carruseles y Ads (Mismo código de tu archivo) */}
          {/* ... */}
        </div>
      )}
    </div>
  );
}