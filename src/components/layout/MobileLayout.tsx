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

// Importar estilos de Swiper
import 'swiper/css';

// --- CONSTANTES Y UTILIDADES ---
const STOP_WORDS = new Set(["el","la","los","las","un","una","unos","unas","lo","al","del","a","ante","bajo","con","contra","de","desde","durante","en","entre","hacia","hasta","mediante","para","por","según","sin","sobre","tras","y","o","u","e","ni","pero","aunque","sino","porque","como","que","si","me","te","se","nos","os","les","mi","mis","tu","tus","su","sus","nuestro","nuestra","nuestros","nuestras","este","esta","estos","estas","ese","esa","esos","esas","aquel","aquella","aquellos","aquellas","ser","estar","haber","tener","hacer","ir","ver","dar","decir","puede","pueden","fue","es","son","era","eran","esta","estan","hay","mas","más","menos","muy","ya","aqui","ahí","asi","así","tambien","también","solo","sólo","todo","todos","todas","algo","nada"]);

const CATEGORY_MAP: Record<string, string> = {
  'export': 'Gente de Acá',
  'SEMBRANDO FUTURO': 'Sembrando Futuro',
  'ARCHIVO SALADILLO VIVO': 'De Otros Tiempos',
  'historia': 'De Otros Tiempos',
  'Noticias': 'Últimas Noticias',
  'clips': 'Saladillo Canta',
  'cortos': 'Hacelo Corto',
  'TU BUSQUEDA': 'TU BUSQUEDA' 
};

const getDisplayCategory = (dbCat: string) => {
  if (!dbCat) return 'VARIOS';
  const original = dbCat.trim();
  const upper = original.toUpperCase();
  if (original === 'TU BUSQUEDA') return 'TU BUSQUEDA'; 
  if (upper.includes('HCD') && upper.includes('SALADILLO')) return 'HCD SALADILLO';
  if (upper.includes('ITEC') && upper.includes('CICAR')) return 'ITEC ¨A. Cicaré¨'; 
  if (upper.includes('FIERROS')) return 'Fierros Saladillo';
  if (CATEGORY_MAP[original]) return CATEGORY_MAP[original];
  return upper; 
};

const getYouTubeThumbnail = (url: string) => {
  if (!url) return '/placeholder.png';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : '/placeholder.png';
};

// --- HOOKS ---
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

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  return { isDark: mounted ? isDark : true, toggleTheme: () => setIsDark(!isDark) };
}

// --- COMPONENTES DE UI ---
function MobileNewsCard({ news, isFeatured, onClick, isDark }: { news: any; isFeatured: boolean; onClick: () => void; isDark: boolean }) {
  return (
    <div onClick={onClick} className={cn("relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform group", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200", isFeatured ? "w-full h-full" : "w-[49%] h-full")}>
      <div className="relative w-full h-full">
        <Image src={news.imagen || '/placeholder.png'} alt={news.titulo} fill className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
        <div className={cn("absolute inset-0 bg-gradient-to-t z-10", isDark ? "from-black via-black/60 to-transparent" : "from-black/90 via-black/50 to-transparent")} />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-3 text-center">
            <div className="flex-1 flex items-center justify-center">
                <div className="bg-[#003399]/50 p-3 rounded-full backdrop-blur-sm border border-white/20">
                    <Play size={isFeatured ? 32 : 24} fill="white" className="text-white ml-1"/>
                </div>
            </div>
            <h3 className={cn("text-white font-black uppercase leading-[1] line-clamp-3", isFeatured ? "text-xl" : "text-sm")}>{news.titulo}</h3>
        </div>
      </div>
    </div>
  );
}

function VideoCarouselBlock({ videos, isDark }: { videos: any[]; isDark: boolean }) {
  const { playManual } = useMediaPlayer(); 
  const { unmute } = useVolume();
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const categories = useMemo(() => Array.from(new Set(videos.map(v => getDisplayCategory(v.categoria)))).sort(), [videos]);
  const currentCat = categories[activeCatIndex];
  const filtered = videos.filter(v => getDisplayCategory(v.categoria) === currentCat);

  return (
    <div className="flex flex-col gap-2 h-full w-full">
      <div className="flex items-center justify-between px-2">
        <button onClick={() => setActiveCatIndex(prev => (prev === 0 ? categories.length - 1 : prev - 1))} className={isDark ? "text-neutral-400" : "text-neutral-600"}><ChevronLeft size={24}/></button>
        <h2 className={cn("font-bold uppercase tracking-tight", isDark ? "text-white" : "text-black")}>{currentCat}</h2>
        <button onClick={() => setActiveCatIndex(prev => (prev === categories.length - 1 ? 0 : prev + 1))} className={isDark ? "text-neutral-400" : "text-neutral-600"}><ChevronRight size={24}/></button>
      </div>
      <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1">
        {filtered.map((v) => (
          <SwiperSlide key={v.id}>
            <div onClick={() => { unmute(); playManual(v); }} className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
              <Image src={v.imagen || getYouTubeThumbnail(v.url)} alt={v.nombre} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play size={20} fill="white" className="text-white"/></div>
              <div className="absolute bottom-0 p-1 bg-black/60 w-full"><p className="text-[10px] text-white uppercase font-bold line-clamp-1">{v.nombre}</p></div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function MobileLayout({ data }: { data: PageData }) {
  const isLandscape = useOrientation();
  const { isDark, toggleTheme } = useTheme(); 
  const { playManual, setVideoPool } = useMediaPlayer();
  const { unmute } = useVolume();
  
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const [adsSwiper, setAdsSwiper] = useState<SwiperClass | null>(null);

  useEffect(() => { if (data?.videos?.allVideos) setVideoPool(data.videos.allVideos); }, [data, setVideoPool]);

  const newsSlides = useMemo(() => {
    const slides = [];
    const { articles } = data || {};
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    return slides;
  }, [data]);

  const adsSlides = useMemo(() => {
    const ads = data?.ads || [];
    if (ads.length === 0) return [];
    let res = [...ads];
    while (res.length < 3) res = [...res, ...ads];
    return res;
  }, [data]);

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden transition-colors", isDark ? "bg-black" : "bg-neutral-50")}>
      
      {/* HEADER (Invisible en landscape) */}
      {!isLandscape && (
        <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-50", isDark ? "bg-black" : "bg-white border-b")}>
          <div className="relative w-36 h-full py-1">
            <Image src={isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png'} alt="Logo" fill className="object-contain" priority />
          </div>
          <div className="flex gap-3 items-center">
             <button onClick={toggleTheme} className={isDark ? "text-white" : "text-black"}>{isDark ? <Sun size={20}/> : <Moon size={20}/>}</button>
          </div>
        </header>
      )}

      {/* REPRODUCTOR (Fixed Fullscreen en landscape) */}
      <div className={cn(
        "transition-all duration-500 ease-in-out",
        isLandscape ? "fixed inset-0 z-[500] w-[100vw] h-[100dvh]" : "relative z-40 w-full aspect-video shadow-2xl"
      )}>
        <VideoSection isMobile={true} />
      </div>

      {/* CUERPO SCROLLABLE (Invisible en landscape) */}
      {!isLandscape && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          <h3 className={cn("font-black text-xl uppercase tracking-tighter text-center", isDark ? "text-white" : "text-black")}>Últimas Noticias</h3>
          
          {/* SWIPER NOTICIAS */}
          <div className="w-full aspect-[16/9]">
            <Swiper modules={[Controller]} onSwiper={setNewsSwiper} controller={{ control: adsSwiper }} spaceBetween={10} slidesPerView={1} className="h-full">
              {newsSlides.map((slide, idx) => (
                <SwiperSlide key={idx}>
                  <div className="w-full h-full flex gap-2">
                    {slide.items.map((item: any) => (
                      <MobileNewsCard key={item.id} news={item} isFeatured={slide.type === 'featured'} isDark={isDark} onClick={() => { unmute(); playManual(item); }} />
                    ))}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* CARRUSEL VIDEOS */}
          <div className="h-[180px] w-full">
            <VideoCarouselBlock videos={data?.videos?.allVideos || []} isDark={isDark} />
          </div>

          {/* PUBLICIDAD */}
          <div className="w-full h-24 mt-4">
            <Swiper modules={[Controller]} onSwiper={setAdsSwiper} controller={{ control: newsSwiper }} spaceBetween={10} slidesPerView={1} loop={adsSlides.length > 1}>
              {adsSlides.map((ad: any, idx) => (
                <SwiperSlide key={idx}>
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/10">
                    <Image src={ad.imagen_url || '/placeholder_ad.png'} alt="Publicidad" fill className="object-cover" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

        </div>
      )}
    </div>
  );
}