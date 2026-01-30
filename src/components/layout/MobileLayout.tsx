'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext'; 
import VideoSection from './VideoSection';
import { PageData, Video, Article } from '@/lib/types'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { 
  Play, ChevronLeft, ChevronRight, X, Sun, Moon, 
  Share2, Search, HelpCircle, ZoomIn, MapPin, Wind, Cloud, 
  Sun as SunIcon, CloudRain, CloudLightning
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';

// --- CONFIGURACIÓN ---
const SALADILLO_COORDS = { lat: -34.6387, lon: -59.7777 };

const getYouTubeThumbnail = (url: string) => {
  if (!url) return '/placeholder.png';
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : '/placeholder.png';
};

const getDisplayCategory = (dbCat: string) => {
  if (!dbCat) return 'VARIOS';
  const upper = dbCat.trim().toUpperCase();
  if (upper.includes('HCD') && upper.includes('SALADILLO')) return 'HCD SALADILLO';
  const MAP: Record<string, string> = {
    'EXPORT': 'Gente de Acá', 'SEMBRANDO FUTURO': 'Sembrando Futuro',
    'ARCHIVO SALADILLO VIVO': 'De Otros Tiempos', 'HISTORIA': 'De Otros Tiempos',
    'NOTICIAS': 'Últimas Noticias', 'CLIPS': 'Saladillo Canta',
    'CORTOS': 'Hacelo Corto', 'FIERROS': 'Fierros Saladillo'
  };
  return MAP[upper] || upper; 
};

// Función de iconos actualizada para Visual Crossing
const getWeatherIcon = (iconName: string, size = 24, className = "") => {
  const name = iconName?.toLowerCase() || '';
  if (name.includes('clear-day')) return <SunIcon size={size} className={cn("text-yellow-400", className)} />;
  if (name.includes('clear-night')) return <Moon size={size} className={cn("text-yellow-200", className)} />;
  if (name.includes('rain')) return <CloudRain size={size} className={cn("text-blue-500", className)} />;
  if (name.includes('cloudy')) return <Cloud size={size} className={cn("text-blue-400", className)} />;
  if (name.includes('thunder')) return <CloudLightning size={size} className={cn("text-purple-500", className)} />;
  return <SunIcon size={size} className={cn("text-yellow-400", className)} />;
};

// --- COMPONENTE CLIMA GIGANTE ACTUALIZADO (Visual Crossing) ---

function WeatherWidget({ isDark }: { isDark: boolean }) {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = process.env.NEXT_PUBLIC_VISUAL_CROSSING_KEY;
        const url = `https://weather.visualcrossing.com/visual-crossing-weather-api/rest/services/timeline/${SALADILLO_COORDS.lat},${SALADILLO_COORDS.lon}?unitGroup=metric&key=${API_KEY}&contentType=json&lang=es`;
        
        const res = await fetch(url);
        const data = await res.json();
        setWeather(data);
      } catch (e) { 
        console.error("Error cargando clima:", e); 
      }
    };
    fetchWeather();
  }, []);

  if (!weather) return <div className="h-32 animate-pulse bg-neutral-800/10 rounded-2xl mb-12" />;

  const current = weather.currentConditions;
  const themeBlue = isDark ? "text-[#6699ff]" : "text-[#003399]";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl mb-12 border shrink-0 transition-all",
      isDark ? "bg-neutral-900/40 border-white/5 shadow-2xl" : "bg-white border-neutral-100 shadow-md"
    )}>
      <div className="flex items-center h-32">
        
        {/* LADO IZQUIERDO: AHORA */}
        <div className="flex-[0.9] flex flex-col justify-center pl-6 pr-4 border-r border-black/5 dark:border-white/5">
          <div className="flex items-center gap-1.5 opacity-50 mb-1">
            <MapPin size={14} className={themeBlue} />
            <span className={cn("text-[11px] font-black uppercase tracking-[0.2em]", isDark ? "text-white" : "text-black")}>Ahora</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className={cn("text-6xl font-black italic tracking-tighter leading-none", isDark ? "text-white" : "text-neutral-900")}>
              {Math.round(current.temp)}°
            </h2>
            {getWeatherIcon(current.icon, 40, "drop-shadow-lg")}
          </div>
        </div>

        {/* LADO DERECHO: 4 DÍAS PRONÓSTICO */}
        <div className="flex-[1.1] flex justify-between px-4">
          {weather.days.slice(1, 5).map((day: any) => (
            <div key={day.datetime} className="flex flex-col items-center gap-2">
              <span className={cn("text-[11px] font-black uppercase italic opacity-60", isDark ? "text-white" : "text-black")}>
                {new Date(day.datetime + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').toUpperCase()}
              </span>
              {getWeatherIcon(day.icon, 26)}
              <div className="flex flex-col items-center leading-none">
                <span className={cn("text-[14px] font-black italic", isDark ? "text-white" : "text-neutral-900")}>
                  {Math.round(day.tempmax)}°
                </span>
                <span className="text-[10px] font-bold opacity-30">
                  {Math.round(day.tempmin)}°
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES DE INTERFAZ (Se mantienen igual) ---

function MobileNewsCard({ news, isFeatured, onClick, isDark }: any) {
  if (!news) return null;
  const handleShare = (e: any) => { 
    e.stopPropagation(); 
    if (navigator.share) navigator.share({ url: `${window.location.origin}/?id=${news.id}` });
  };

  return (
    <div onClick={onClick} className={cn("relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform", isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200", isFeatured ? "w-full h-full" : "w-[49%] h-full")}>
      <div className="relative w-full h-full">
        <button onClick={handleShare} className="absolute top-2 right-2 z-30 p-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white">
          <Share2 size={isFeatured ? 20 : 16} />
        </button>
        <Image src={news.imagen || '/placeholder.png'} alt={news.titulo} fill priority={isFeatured} sizes="(max-width: 768px) 50vw, 33vw" className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-3 text-center text-white">
            <div className={cn("flex items-center justify-center rounded-full backdrop-blur-sm border border-white/20 mb-2 p-3", isDark ? "bg-[#6699ff]/50" : "bg-[#003399]/50")}>
                <Play size={isFeatured ? 32 : 24} fill="white" className="ml-1"/>
            </div>
            <h3 className={cn("font-black uppercase tracking-tight leading-[1.1] text-balance line-clamp-3 italic", isFeatured ? "text-xl" : "text-[13px]")}>
              {news.titulo.replaceAll('|', ' ')}
            </h3>
        </div>
      </div>
    </div>
  );
}

function VideoCarouselBlock({ videos, isDark }: any) {
  const { playManual } = useMediaPlayer();
  const { unmute } = useVolume();
  const [activeCatIndex, setActiveCatIndex] = useState(0);

  const categories = useMemo(() => {
    return Array.from(new Set(videos.map((v: Video) => getDisplayCategory(v.categoria)))).sort();
  }, [videos]);

  const currentCat = (categories[activeCatIndex] as string) || 'VARIOS';
  const filtered = videos.filter((v: Video) => getDisplayCategory(v.categoria) === currentCat);
  const themeColorClass = isDark ? "text-[#6699ff]" : "text-[#003399]";

  if (videos.length === 0) return null;

  return (
    <div className="flex flex-col h-full w-full pt-[5px]">
      <div className="flex items-center justify-between px-2 py-0.5 shrink-0">
        <button onClick={() => setActiveCatIndex(p => p === 0 ? categories.length - 1 : p - 1)} className={themeColorClass}><ChevronLeft size={32} /></button>
        <h2 className={cn("font-black italic text-xl uppercase tracking-wider text-center flex-1 truncate px-2", themeColorClass)}>{currentCat}</h2>
        <button onClick={() => setActiveCatIndex(p => p === categories.length - 1 ? 0 : p + 1)} className={themeColorClass}><ChevronRight size={32} /></button>
      </div>
      <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1 px-1 mt-[5px]">
        {filtered.map((v: Video) => (
          <SwiperSlide key={v.id}>
            <div onClick={() => { unmute(); playManual(v); }} className={cn("relative h-full rounded-lg overflow-hidden border", isDark ? "bg-neutral-800 border-neutral-700/50" : "bg-white border-neutral-200")}>
              <Image src={v.imagen || getYouTubeThumbnail(v.url)} alt={v.nombre} fill sizes="33vw" className="object-cover opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="bg-[#003399]/50 p-1.5 rounded-full border border-white/10 -mt-[45px]"><Play size={21} fill="white" /></div>
              </div>
              <div className="absolute bottom-0 w-full p-1.5 bg-gradient-to-t from-black via-black/60 to-transparent">
                <p className="text-[14px] text-white font-bold line-clamp-3 uppercase text-center leading-tight">
                  {v.nombre.replaceAll('|', ' ')}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function MobileLayout({ data }: { data: PageData }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { setVideoPool, playManual } = useMediaPlayer(); 
  const { isMuted, unmute, toggleMute } = useVolume(); 
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const searchParams = useSearchParams();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    const allArticles = [...(data.articles?.featuredNews ? [data.articles.featuredNews] : []), ...(data.articles?.secondaryNews || []), ...(data.articles?.otherNews || [])];
    const matchedArticles = allArticles.filter(a => a.titulo.toLowerCase().includes(q));
    const matchedVideos = (data.videos?.allVideos || []).filter(v => v.nombre.toLowerCase().includes(q));
    return { ...data, articles: { featuredNews: matchedArticles[0] || null, secondaryNews: matchedArticles.slice(1, 5), otherNews: matchedArticles.slice(5) }, videos: { ...data.videos, allVideos: matchedVideos } };
  }, [searchQuery, data]);

  const newsSlides = useMemo(() => {
    const slides = [];
    const articles = filteredData?.articles;
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    return slides;
  }, [filteredData]);

  useEffect(() => {
    if (data && mounted) {
      const newsId = searchParams.get('id');
      const videoId = searchParams.get('v');
      const allVideos = data.videos?.allVideos || [];
      let target: Video | Article | undefined;
      
      if (newsId) {
        const allArticles = [...(data.articles?.featuredNews ? [data.articles.featuredNews] : []), ...(data.articles?.secondaryNews || []), ...(data.articles?.otherNews || [])];
        target = allArticles.find(n => String(n.id) === newsId);
      } else if (videoId) target = allVideos.find(v => String(v.id) === videoId);

      if (target) { 
        if (!isMuted) toggleMute(); 
        const forceAudio = () => { unmute(); window.removeEventListener('touchstart', forceAudio); }; 
        window.addEventListener('touchstart', forceAudio); 
      }
      (setVideoPool as any)(allVideos, target);
    }
  }, [data, mounted, searchParams, setVideoPool]);

  if (!mounted) return null;

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden", isDark ? "bg-black" : "bg-neutral-50")}>
      <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-50", isDark ? "bg-neutral-900" : "bg-white border-b")}>
          {!isSearchOpen ? (
            <div className="relative w-36 h-full py-1"><Image src={isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png'} alt="Logo" fill priority sizes="150px" className="object-contain" /></div>
          ) : (
            <div className="flex-1 h-full flex items-center pr-2">
              <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..." className={cn("w-full bg-transparent border-b outline-none py-1 text-sm", isDark ? "border-white/20 text-white" : "border-black/10 text-black")} />
            </div>
          )}
          <div className="flex items-center gap-3">
             <button onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(""); }} className={isDark ? "text-neutral-300" : "text-neutral-700"}><Search size={20}/></button>
             {!isSearchOpen && (
               <>
                 <button onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={20} className="text-white"/> : <Moon size={20}/>}</button>
                 <button onClick={() => navigator.share?.({ url: window.location.href })} className={isDark ? "text-white" : "text-black"}><Share2 size={20}/></button>
                 <button onClick={() => setIsHelpOpen(true)} className={isDark ? "text-white" : "text-black"}><HelpCircle size={20}/></button>
               </>
             )}
          </div>
      </header>

      <div className="relative z-40 w-full aspect-video bg-black"><VideoSection isMobile={true} /></div>

      <div className="flex-1 flex flex-col gap-2 px-3 pt-1 pb-4 overflow-y-auto">
          {/* SECCIÓN NOTICIAS */}
          <div className="flex items-center justify-between px-2 shrink-0">
            <button onClick={() => newsSwiper?.slidePrev()} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}><ChevronLeft size={32} /></button>
            <h3 className={cn("font-black italic text-xl uppercase text-center flex-1 truncate px-2 mt-1", isDark ? "text-[#6699ff]" : "text-[#003399]")}>{searchQuery ? "Resultados" : "Últimas Noticias"}</h3>
            <button onClick={() => newsSwiper?.slideNext()} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}><ChevronRight size={32} /></button>
          </div>
          <div className="w-full aspect-[16/6.4] shrink-0">
            <Swiper onSwiper={setNewsSwiper} slidesPerView={1} className="h-full">
              {newsSlides.map((slide, idx) => (
                <SwiperSlide key={idx}>
                  <div className="w-full h-full flex justify-between">
                    {slide.items.map((item: any) => (<MobileNewsCard key={item.id} news={item} isFeatured={slide.type === 'featured'} isDark={isDark} onClick={() => { unmute(); playManual(item); }} />))}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="h-[160px] shrink-0 -mt-1">
            <VideoCarouselBlock videos={filteredData?.videos?.allVideos || []} isDark={isDark} />
          </div>

          {/* WIDGET CLIMA GIGANTE (Visual Crossing) */}
          <WeatherWidget isDark={isDark} />
      </div>

      {/* MODAL AYUDA */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md px-4">
          <div className={cn("relative w-full max-h-[92vh] rounded-[24px] flex flex-col overflow-hidden shadow-2xl border", isDark ? "bg-neutral-900 border-white/10" : "bg-white border-black/5")}>
            <button onClick={() => setIsHelpOpen(false)} className="absolute top-3 right-3 z-[110] p-1.5 rounded-full bg-black/10 text-neutral-500"><X size={18} /></button>
            <div className="p-8 text-center">
                <h2 className={cn("text-xl font-black italic uppercase mb-2", isDark ? "text-[#6699ff]" : "text-[#003399]")}>Saladillo Vivo</h2>
                <button onClick={() => setIsHelpOpen(false)} className="mt-8 px-6 py-2 bg-[#003399] text-white rounded-full font-bold uppercase text-xs">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}