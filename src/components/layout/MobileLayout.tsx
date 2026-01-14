'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import VideoSection from './VideoSection';
import { PageData } from '@/lib/types'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Controller } from 'swiper/modules';
import { Play, Search, Sun, Moon, Share2, HelpCircle, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Swiper as SwiperClass } from 'swiper';

import 'swiper/css';

const MOCK_DATA = {
  articles: { featuredNews: null, secondaryNews: [], otherNews: [] },
  videos: { allVideos: [], liveStream: null },
  ads: []
};

export default function MobileLayout({ data, isMobile }: { data: PageData; isMobile: boolean }) {
  const safeData = data || MOCK_DATA;
  const { articles, ads } = safeData as PageData;

  const [isDark, setIsDark] = useState(true);
  const toggleTheme = () => setIsDark(!isDark);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const themeClasses = {
    bg: isDark ? "bg-black" : "bg-neutral-50",
    text: isDark ? "text-white" : "text-neutral-900",
    header: isDark ? "bg-gradient-to-b from-neutral-600 to-black" : "bg-gradient-to-b from-neutral-400 to-white",
  };

  const newsSlides = useMemo(() => {
    const slides = [];
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) {
      slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    }
    return slides;
  }, [articles]);

  return (
    <div className={cn("fixed inset-0 z-[100] flex flex-col w-full h-[100dvh] overflow-hidden", themeClasses.bg, themeClasses.text)}>
        {/* HEADER */}
        <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-20 sticky top-0 border-b border-gray-800", themeClasses.header)}>
            <div className="relative w-36 h-full py-1 flex items-center justify-start">
               <span className="font-black text-lg tracking-tighter">SALADILLO VIVO</span>
            </div>
            <div className="flex items-center gap-3 z-30 shrink-0">
               <button onClick={toggleTheme} className="active:scale-90 transition-transform">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
               {deferredPrompt && (<button onClick={handleInstallClick}><Download size={20} /></button>)}
            </div>
        </header>

        {/* VIDEO SECTION - MODO SEGURO */}
        <div className="shrink-0 sticky top-11 z-30 w-full aspect-video shadow-xl border-b border-gray-800 bg-black">
          <VideoSection isMobile={true} />
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 flex flex-col gap-2 px-3 pt-2 pb-1 overflow-y-auto">
          <div className="w-full text-center shrink-0">
              <h3 className="font-sans font-extrabold text-xl uppercase">Últimas Noticias</h3>
          </div>
          
          <div className="w-full aspect-[16/8] shrink-0 bg-gray-800/50 rounded-xl flex items-center justify-center">
             {newsSlides.length > 0 ? <span className="text-xs">Noticias cargadas</span> : <span className="text-xs">Cargando noticias...</span>}
          </div>
        </div>
    </div>
  );
}