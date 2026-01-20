'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext'; // <--- IMPORTACIÓN CRUCIAL
import VideoSection from './VideoSection';
import { PageData, Video, Article } from '@/lib/types'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Controller } from 'swiper/modules';
import { Play, ChevronLeft, ChevronRight, X, Sun, Moon, Share2, Search, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';

// --- HOOKS DE SOPORTE ---
function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const check = () => { if (typeof window !== 'undefined') setIsLandscape(window.innerWidth > window.innerHeight); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isLandscape;
}

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
  }, []);
  return { isDark: mounted ? isDark : true, toggleTheme: () => setIsDark(!isDark), mounted };
}

const getDisplayCategory = (dbCat: string) => {
  if (!dbCat) return 'VARIOS';
  return dbCat.toUpperCase(); 
};

const getYouTubeThumbnail = (url: string) => {
  if (!url) return '/placeholder.png';
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : '/placeholder.png';
};

// --- COMPONENTE PRINCIPAL ---
export default function MobileLayout({ data }: { data: PageData }) {
  const isLandscape = useOrientation(); 
  const { isDark, toggleTheme, mounted } = useTheme(); 
  const { state, setVideoPool, playManual } = useMediaPlayer(); 
  const { isMuted, toggleMute, unmute } = useVolume(); // <--- DEFINICIÓN CORRECTA
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      } else if (videoId) {
        target = allVideos.find(v => String(v.id) === videoId);
      }

      if (target) {
        // Obligatorio: Iniciar silenciado para que el navegador permita el autoplay
        if (!isMuted) toggleMute(); 
        const forceAudio = () => { unmute(); window.removeEventListener('touchstart', forceAudio); };
        window.addEventListener('touchstart', forceAudio);
      }
      (setVideoPool as any)(allVideos, target);
    }
  }, [data, mounted, searchParams, setVideoPool, isMuted, toggleMute, unmute]);

  const newsSlides = useMemo(() => {
    const slides = [];
    const articles = data?.articles;
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    return slides;
  }, [data]);

  if (!mounted) return null;

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden transition-colors", isDark ? "bg-black" : "bg-neutral-50")}>
      {!isLandscape && (
        <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-50", isDark ? "bg-neutral-900" : "bg-white border-b")}>
          <div className="relative w-36 h-full py-1">
            <Image src={isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png'} alt="Logo" fill sizes="150px" priority className="object-contain" />
          </div>
          <div className="flex items-center gap-3">
             <button onClick={toggleTheme}>{isDark ? <Sun size={20} className="text-white"/> : <Moon size={20}/>}</button>
          </div>
        </header>
      )}

      <div className={cn("transition-all duration-500", isLandscape ? "fixed inset-0 z-[500] w-[100vw] h-[100dvh]" : "relative z-40 w-full aspect-video bg-black")}>
        <VideoSection key={state.currentContent?.id || 'empty'} />
      </div>

      {!isLandscape && (
        <div className="flex-1 overflow-y-auto p-4">
           {/* Resto de tu UI de noticias y carruseles aquí */}
           <h2 className={cn("text-xl font-black uppercase mb-4", isDark ? "text-[#6699ff]" : "text-[#003399]")}>Últimas Noticias</h2>
           {/* ... mapping de newsSlides ... */}
        </div>
      )}
    </div>
  );
}