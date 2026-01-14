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

// --- TARJETA DE NOTICIA ---
function MobileNewsCard({ news, isFeatured, onClick, isDark }: { news: any; isFeatured: boolean; onClick: () => void; isDark: boolean }) {
  if (!news) return null;
  return (
    <div onClick={onClick} className={cn("relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform group", isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200", isFeatured ? "w-full h-full" : "w-[49%] h-full")}>
      <div className="relative w-full h-full">
        <Image src={news.imagen || '/placeholder.png'} alt={news.titulo} fill priority={isFeatured} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
        <div className={cn("absolute inset-0 bg-gradient-to-t z-10", isDark ? "from-black via-black/60 to-transparent" : "from-black/90 via-black/50 to-transparent")} />
        <div className="absolute inset-0 z-20 flex flex-col">
            <div className={cn("flex-1 flex items-center justify-center min-h-0", isFeatured && "pt-16")}>
                <div className={cn("flex items-center justify-center rounded-full backdrop-blur-sm border border-white/20 shadow-2xl transition-transform duration-300 group-active:scale-90 bg-[#003399]/50", isFeatured ? "p-4" : "p-3", isFeatured && "-translate-y-[20px]")}>
                    <Play size={isFeatured ? 38 : 28} fill="white" className="text-white ml-1 opacity-90" strokeWidth={0}/>
                </div>
            </div>
            <div className={cn("shrink-0 w-full flex flex-col justify-end", isFeatured ? "p-4 pb-2" : "p-2 pb-3")}>
                <h3 className={cn("text-white font-black uppercase tracking-tight leading-[0.9] text-balance drop-shadow-xl text-center", isFeatured ? "line-clamp-3 mb-1 text-2xl" : "line-clamp-4 mb-0 text-base")} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>{news.titulo}</h3>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- CARRUSEL DE VIDEOS ---
function VideoCarouselBlock({ videos, isDark }: { videos: any[]; isDark: boolean }) {
  const { playManual } = useMediaPlayer(); 
  const { unmute } = useVolume();
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const categories = useMemo(() => Array.from(new Set(videos.map(v => getDisplayCategory(v.categoria)))).sort(), [videos]);
  const currentCat = categories[activeCatIndex];
  const filtered = videos.filter(v => getDisplayCategory(v.categoria) === currentCat);

  if (!videos.length || !categories.length) return null;

  return (
    <div className="flex flex-col gap-0 h-full w-full">
      <div className="flex items-center justify-between px-2 py-0.5 shrink-0 rounded-lg mx-1 transition-colors bg-transparent">
        <button onClick={() => setActiveCatIndex(prev => (prev === 0 ? categories.length - 1 : prev - 1))} className={cn("p-2 transition-colors active:scale-90 -mt-[15px]", isDark ? "text-neutral-400" : "text-neutral-500")}><ChevronLeft size={28} strokeWidth={3} /></button>
        <h2 className={cn("font-sans font-extrabold text-xl text-center uppercase tracking-wider truncate px-2 flex-1 drop-shadow-sm -mt-[15px]", isDark ? "text-white" : "text-black")}>{currentCat}</h2>
        <button onClick={() => setActiveCatIndex(prev => (prev === categories.length - 1 ? 0 : prev + 1))} className={cn("p-2 transition-colors active:scale-90 -mt-[15px]", isDark ? "text-neutral-400" : "text-neutral-500")}><ChevronRight size={28} strokeWidth={3} /></button>
      </div>
      <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1 min-h-0 px-1">
        {filtered.map((v) => (
          <SwiperSlide key={v.id}>
               <div onClick={() => { unmute(); playManual(v); }} className={cn("relative h-full w-full rounded-lg overflow-hidden border active:scale-95 transition-transform group", isDark ? "bg-neutral-800 border-neutral-700/50" : "bg-white border-neutral-200 shadow-sm")}>
                  <Image src={v.imagen || getYouTubeThumbnail(v.url)} alt={v.nombre} fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" sizes="150px" />
                   <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <div className={cn("p-1.5 rounded-full backdrop-blur-sm border border-white/10 -mt-[50px] bg-[#003399]/50")}> <Play size={21} fill="white" className="text-white" /> </div>
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                      <p className="text-[14px] text-white font-bold line-clamp-3 leading-tight text-center uppercase drop-shadow-md">{v.nombre}</p>
                   </div>
               </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default function MobileLayout({ data }: { data: PageData }) {
  const isLandscape = useOrientation();
  const { isDark, toggleTheme } = useTheme(); 
  const { playManual, setVideoPool } = useMediaPlayer();
  const { unmute } = useVolume();
  
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const [adsSwiper, setAdsSwiper] = useState<SwiperClass | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (data?.videos?.allVideos) setVideoPool(data.videos.allVideos); }, [data, setVideoPool]);

  // --- FILTRADO BÚSQUEDA ---
  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredVideos([]); return; }
    const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0 && !STOP_WORDS.has(w)); 
    const results = (data?.videos?.allVideos || []).filter(video => queryWords.some(qWord => (video.nombre || "").toLowerCase().includes(qWord)));
    setFilteredVideos(results.map(v => ({ ...v, categoria: 'TU BUSQUEDA' })));
  }, [searchQuery, data]);

  const newsSlides = useMemo(() => {
    const slides = [];
    const articles = data?.articles;
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    return slides;
  }, [data]);

  const adsSlides = useMemo(() => {
    const ads = data?.ads || [];
    let res = [...ads];
    while (res.length > 0 && res.length < 3) res = [...res, ...ads];
    return res;
  }, [data]);

  const iconColor = isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-black';

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden transition-colors", isDark ? "bg-black" : "bg-neutral-50")}>
      
      {/* HEADER RESTAURADO */}
      {!isLandscape && (
        <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-50 transition-colors", isDark ? "bg-gradient-to-b from-neutral-600 to-black" : "bg-gradient-to-b from-neutral-400 to-white")}>
          {!isSearchOpen ? (
            <div className="relative w-36 h-full py-1">
              <Image src={isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png'} alt="Logo" fill className="object-contain object-left" priority />
            </div>
          ) : (
            <div className="flex-1 h-full flex items-center pr-2">
              <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar video..." className={cn("w-full bg-transparent border-b-2 outline-none py-1 text-sm", isDark ? "border-white/20 text-white" : "border-black/10 text-black")} />
            </div>
          )}
          
          <div className="flex items-center gap-3">
             <button onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(""); }} className={iconColor}>
               {isSearchOpen ? <X size={24}/> : <Search size={20}/>}
             </button>
             {!isSearchOpen && (
               <>
                 <button onClick={toggleTheme} className={iconColor}>{isDark ? <Sun size={20}/> : <Moon size={20}/>}</button>
                 <button className={iconColor} onClick={() => { if(navigator.share) navigator.share({title:'Saladillo Vivo', url: window.location.href}) }}><Share2 size={20}/></button>
                 <button className={iconColor}><HelpCircle size={20}/></button>
                 <button className={iconColor}><Download size={20}/></button>
               </>
             )}
          </div>
        </header>
      )}

      {/* REPRODUCTOR FULLSCREEN HORIZONTAL */}
      <div className={cn(
        "transition-all duration-500",
        isLandscape ? "fixed inset-0 z-[500] w-[100vw] h-[100dvh]" : cn("shrink-0 sticky top-11 z-30 w-full aspect-video shadow-xl border-b", isDark ? "bg-black border-white/5" : "bg-white border-neutral-200")
      )}>
        <VideoSection isMobile={true} />
      </div>

      {/* CUERPO COMPACTO RESTAURADO */}
      {!isLandscape && (
        <div className="flex-1 flex flex-col gap-2 px-3 pt-1 pb-1 min-h-0 overflow-y-auto">
          <h3 className={cn("font-sans font-extrabold text-xl uppercase text-center tracking-wider shrink-0 mt-1", isDark ? "text-white" : "text-black")}>Últimas Noticias</h3>
          
          <div className="w-full aspect-[16/8] shrink-0">
            <Swiper modules={[Controller]} onSwiper={setNewsSwiper} controller={{ control: adsSwiper }} spaceBetween={10} slidesPerView={1} className="h-full">
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

          <div className="h-[160px] shrink-0 -mt-1">
            <VideoCarouselBlock videos={(isSearchOpen && searchQuery) ? filteredVideos : (data?.videos?.allVideos || [])} isDark={isDark} />
          </div>

          <div className="w-full flex-1 min-h-0 mt-2">
            <Swiper modules={[Controller]} onSwiper={setAdsSwiper} controller={{ control: newsSwiper }} spaceBetween={10} slidesPerView={1} loop={adsSlides.length > 1}>
              {adsSlides.map((ad: any, idx) => (
                <SwiperSlide key={idx}>
                  <div className={cn("relative w-full h-full rounded-lg overflow-hidden border", isDark ? "border-white/10 bg-black" : "border-neutral-200 bg-white")}>
                    <Image src={ad.imagen_url || '/placeholder_ad.png'} alt="Ad" fill className="object-cover" />
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