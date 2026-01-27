'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext'; 
import VideoSection from './VideoSection';
import { PageData, Video, Article } from '@/lib/types'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Controller } from 'swiper/modules';
import { Play, ChevronLeft, ChevronRight, X, Sun, Moon, Share2, Search, HelpCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';

// --- UTILIDADES ---
const getYouTubeThumbnail = (url: string) => {
  if (!url) return '/placeholder.png';
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : '/placeholder.png';
};

const getDisplayCategory = (dbCat: string) => {
  if (!dbCat) return 'VARIOS';
  const upper = dbCat.trim().toUpperCase();
  if (upper.includes('HCD') && upper.includes('SALADILLO')) return 'HCD SALADILLO';
  if (upper.includes('ITEC') && upper.includes('CICAR')) return 'ITEC ¨A. Cicaré¨'; 

  const CATEGORY_MAP: Record<string, string> = {
    'EXPORT': 'Gente de Acá',
    'SEMBRANDO FUTURO': 'Sembrando Futuro',
    'ARCHIVO SALADILLO VIVO': 'De Otros Tiempos',
    'HISTORIA': 'De Otros Tiempos',
    'NOTICIAS': 'Últimas Noticias',
    'CLIPS': 'Saladillo Canta',
    'CORTOS': 'Hacelo Corto',
    'FIERROS': 'Fierros Saladillo',
    'TU BUSQUEDA': 'Tu Busqueda'
  };
  return CATEGORY_MAP[upper] || upper; 
};

// --- COMPONENTES INTERNOS ---

function MobileNewsCard({ news, isFeatured, onClick, isDark }: any) {
  if (!news) return null;
  const handleShare = (e: any) => { e.stopPropagation(); navigator.share?.({ url: `${window.location.origin}/?id=${news.id}` }); };

  return (
    <div onClick={onClick} className={cn("relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform", isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200", isFeatured ? "w-full h-full" : "w-[49%] h-full")}>
      <div className="relative w-full h-full">
        <button onClick={handleShare} className="absolute top-2 right-2 z-30 p-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white"><Share2 size={isFeatured ? 20 : 16} /></button>
        <Image src={news.imagen || '/placeholder.png'} alt={news.titulo} fill sizes={isFeatured ? "100vw" : "50vw"} priority={isFeatured} className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-3 text-center text-white">
            <div className={cn("flex items-center justify-center rounded-full backdrop-blur-sm border border-white/20 mb-2 p-3", isDark ? "bg-[#6699ff]/50" : "bg-[#003399]/50")}>
                <Play size={isFeatured ? 32 : 24} fill="white" className="ml-1"/>
            </div>
            {/* CORRECCIÓN: Título de miniatura de noticia limitado a 3 líneas */}
            <h3 className={cn("font-black uppercase tracking-tight leading-[1.1] text-balance line-clamp-3", isFeatured ? "text-xl" : "text-[13px]")}>{news.titulo.replaceAll('|', ' ')}</h3>
        </div>
      </div>
    </div>
  );
}

function VideoCarouselBlock({ videos, isDark }: any) {
  const { playManual } = useMediaPlayer();
  const { unmute } = useVolume();
  const [activeCatIndex, setActiveCatIndex] = useState(0);

  const categories = useMemo(() => Array.from(new Set(videos.map((v: Video) => getDisplayCategory(v.categoria)))).sort(), [videos]);
  const currentCat = categories[activeCatIndex] || 'VARIOS';
  const filtered = videos.filter((v: Video) => getDisplayCategory(v.categoria) === currentCat);
  const themeColorClass = isDark ? "text-[#6699ff]" : "text-[#003399]";

  const handleShareVideo = (e: any, v: Video) => { e.stopPropagation(); navigator.share?.({ url: `${window.location.origin}/?v=${v.id}` }); };

  return (
    <div className="flex flex-col h-full w-full pt-[5px]">
      <div className="flex items-center justify-between px-2 py-0.5 shrink-0">
        <button onClick={() => setActiveCatIndex(p => p === 0 ? categories.length - 1 : p - 1)} className={themeColorClass}><ChevronLeft size={28} /></button>
        <h2 className={cn("font-extrabold italic text-xl uppercase tracking-wider text-center flex-1 truncate px-2", themeColorClass)}>{currentCat}</h2>
        <button onClick={() => setActiveCatIndex(p => p === categories.length - 1 ? 0 : p + 1)} className={themeColorClass}><ChevronRight size={28} /></button>
      </div>
      <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1 px-1 mt-[5px]">
        {filtered.map((v: Video) => (
          <SwiperSlide key={v.id}>
            <div onClick={() => { unmute(); playManual(v); }} className={cn("relative h-full rounded-lg overflow-hidden border", isDark ? "bg-neutral-800 border-neutral-700/50" : "bg-white border-neutral-200")}>
              <button onClick={(e) => handleShareVideo(e, v)} className="absolute top-1 right-1 z-30 p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white"><Share2 size={14} /></button>
              <Image src={v.imagen || getYouTubeThumbnail(v.url)} alt={v.nombre} fill sizes="33vw" className="object-cover opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="bg-[#003399]/50 p-1.5 rounded-full border border-white/10 -mt-10"><Play size={21} fill="white" /></div>
              </div>
              <div className="absolute bottom-0 w-full p-1.5 bg-gradient-to-t from-black via-black/60 to-transparent">
                {/* CORRECCIÓN: Título de miniatura de video aumentado a 3 líneas */}
                <p className="text-[14px] text-white font-bold line-clamp-3 uppercase text-center leading-tight">{v.nombre.replaceAll('|', ' ')}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default function MobileLayout({ data }: { data: PageData }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { state, setVideoPool, playManual } = useMediaPlayer(); 
  const { isMuted, unmute, toggleMute } = useVolume(); 
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBtn(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (data && mounted) {
      const newsId = searchParams.get('id');
      const videoId = searchParams.get('v');
      const allVideos = data.videos?.allVideos || [];
      let target: Video | Article | undefined;

      if (newsId) {
        const allArticles = [...(data.articles?.featuredNews ? [data.articles.featuredNews] : []), ...(data.articles?.secondaryNews || []), ...(data.articles?.otherNews || [])];
        target = allArticles.find(n => String(n.id) === newsId);
      } else if (videoId) {
        target = allVideos.find(v => String(v.id) === videoId);
      }

      if (target) {
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
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden", isDark ? "bg-black" : "bg-neutral-50")}>
      <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-50", isDark ? "bg-neutral-900" : "bg-white border-b")}>
          {!isSearchOpen ? (
            <div className="relative w-36 h-full py-1"><Image src={isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png'} alt="Logo" fill className="object-contain" /></div>
          ) : (
            <div className="flex-1 h-full flex items-center pr-2">
              <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..." className={cn("w-full bg-transparent border-b outline-none py-1 text-sm", isDark ? "border-white/20 text-white" : "border-black/10 text-black")} />
            </div>
          )}

          <div className="flex items-center gap-3">
             <button onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(""); }} className={isDark ? "text-neutral-300" : "text-neutral-700"}>
               {isSearchOpen ? <X size={24}/> : <Search size={20}/>}
             </button>

             {!isSearchOpen && (
               <>
                 <button onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={20} className="text-white"/> : <Moon size={20}/>}</button>
                 <button onClick={() => navigator.share?.({ url: window.location.href })} className={isDark ? "text-white" : "text-black"}><Share2 size={20}/></button>
                 <button onClick={() => {}} className={isDark ? "text-white" : "text-black"}><HelpCircle size={20}/></button>
                 {showInstallBtn && <button onClick={() => deferredPrompt.prompt()} className={cn("animate-bounce", isDark ? "text-white" : "text-black")}><Download size={20}/></button>}
               </>
             )}
          </div>
      </header>
      <div className="relative z-40 w-full aspect-video bg-black"><VideoSection isMobile={true} /></div>
      <div className="flex-1 flex flex-col gap-2 px-3 pt-1 pb-1 overflow-y-auto">
          <div className="flex items-center justify-between px-2 shrink-0">
            <button onClick={() => newsSwiper?.slidePrev()} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}><ChevronLeft size={28} /></button>
            <h3 className={cn("font-extrabold italic text-xl uppercase text-center flex-1 truncate px-2 mt-1", isDark ? "text-[#6699ff]" : "text-[#003399]")}>Últimas Noticias</h3>
            <button onClick={() => newsSwiper?.slideNext()} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}><ChevronRight size={28} /></button>
          </div>
          <div className="w-full aspect-[16/6.4] shrink-0">
            <Swiper onSwiper={setNewsSwiper} slidesPerView={1} className="h-full">
              {newsSlides.map((slide, idx) => (
                <SwiperSlide key={idx}>
                  <div className="w-full h-full flex justify-between">
                    {slide.items.map((item: any) => (
                      <MobileNewsCard key={item.id} news={item} isFeatured={slide.type === 'featured'} isDark={isDark} onClick={() => { unmute(); playManual(item); }} />
                    ))}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="h-[160px] shrink-0 -mt-1"><VideoCarouselBlock videos={data?.videos?.allVideos || []} isDark={isDark} /></div>
      </div>
    </div>
  );
}