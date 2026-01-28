'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext'; 
import VideoSection from './VideoSection';
import { PageData, Video, Article } from '@/lib/types'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Play, ChevronLeft, ChevronRight, X, Sun, Moon, Share2, Search, HelpCircle, Download, ZoomIn } from 'lucide-react';
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
  const MAP: Record<string, string> = {
    'EXPORT': 'Gente de Acá', 'SEMBRANDO FUTURO': 'Sembrando Futuro',
    'ARCHIVO SALADILLO VIVO': 'De Otros Tiempos', 'HISTORIA': 'De Otros Tiempos',
    'NOTICIAS': 'Últimas Noticias', 'CLIPS': 'Saladillo Canta',
    'CORTOS': 'Hacelo Corto', 'FIERROS': 'Fierros Saladillo'
  };
  return MAP[upper] || upper; 
};

// --- COMPONENTES INTERNOS ---

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
        <Image src={news.imagen || '/placeholder.png'} alt={news.titulo} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover opacity-90" />
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
  const categories = useMemo(() => Array.from(new Set(videos.map((v: Video) => getDisplayCategory(v.categoria)))).sort(), [videos]);
  const currentCat = categories[activeCatIndex] || 'VARIOS';
  const filtered = videos.filter((v: Video) => getDisplayCategory(v.categoria) === currentCat);
  const themeColorClass = isDark ? "text-[#6699ff]" : "text-[#003399]";

  if (videos.length === 0) return <div className="h-full flex items-center justify-center text-neutral-500 italic text-sm">No hay videos</div>;

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
              <button onClick={(e) => { e.stopPropagation(); if(navigator.share) navigator.share({ url: `${window.location.origin}/?v=${v.id}` }); }} className="absolute top-1 right-1 z-30 p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white">
                <Share2 size={14} />
              </button>
              <Image src={v.imagen || getYouTubeThumbnail(v.url)} alt={v.nombre} fill sizes="(max-width: 768px) 33vw, 20vw" className="object-cover opacity-90" />
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
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<'decreto' | 'creador'>('decreto');
  const [isDecretoZoomed, setIsDecretoZoomed] = useState(false);
  
  const searchParams = useSearchParams();
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
      if (target) { if (!isMuted) toggleMute(); const forceAudio = () => { unmute(); window.removeEventListener('touchstart', forceAudio); }; window.addEventListener('touchstart', forceAudio); }
      (setVideoPool as any)(allVideos, target);
    }
  }, [data, mounted, searchParams, setVideoPool, isMuted, toggleMute, unmute]);

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
                 
                 {/* BOTÓN COMPARTIR RECUPERADO */}
                 <button onClick={() => navigator.share?.({ url: window.location.href })} className={isDark ? "text-white" : "text-black"}>
                    <Share2 size={20}/>
                 </button>

                 <button onClick={() => { setHelpTab('decreto'); setIsHelpOpen(true); }} className={isDark ? "text-white" : "text-black"}>
                    <HelpCircle size={20}/>
                 </button>
               </>
             )}
          </div>
      </header>

      <div className="relative z-40 w-full aspect-video bg-black"><VideoSection isMobile={true} /></div>

      <div className="flex-1 flex flex-col gap-2 px-3 pt-1 pb-1 overflow-y-auto">
          <div className="flex items-center justify-between px-2 shrink-0">
            <button onClick={() => newsSwiper?.slidePrev()} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}><ChevronLeft size={28} /></button>
            <h3 className={cn("font-extrabold italic text-xl uppercase text-center flex-1 truncate px-2 mt-1", isDark ? "text-[#6699ff]" : "text-[#003399]")}>{searchQuery ? "Resultados" : "Últimas Noticias"}</h3>
            <button onClick={() => newsSwiper?.slideNext()} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}><ChevronRight size={28} /></button>
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
          <div className="h-[160px] shrink-0 -mt-1"><VideoCarouselBlock videos={filteredData?.videos?.allVideos || []} isDark={isDark} /></div>
      </div>

      {/* --- MODAL AJUSTADO AL CONTENIDO --- */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in duration-300 px-4">
          <div className={cn("relative w-full h-auto max-h-[92vh] rounded-[24px] flex flex-col overflow-hidden shadow-2xl border transition-all", isDark ? "bg-neutral-900 border-white/10" : "bg-white border-black/5")}>
            
            <button onClick={() => setIsHelpOpen(false)} className="absolute top-3 right-3 z-[110] p-1.5 rounded-full bg-black/10 text-neutral-500 hover:bg-black/20">
              <X size={18} />
            </button>

            <div className="overflow-y-auto">
              {helpTab === 'decreto' ? (
                <div className="flex flex-col animate-in fade-in duration-300 pb-4">
                  <div className="px-6 pt-8 pb-3 text-center">
                    <h2 className={cn("text-[14px] font-black uppercase italic tracking-tight leading-tight", isDark ? "text-[#6699ff]" : "text-[#003399]")}>Saladillo Vivo fue declarado de interés cultural municipal</h2>
                    <p className={cn("text-[12px] font-black uppercase italic opacity-90 mt-0.5", isDark ? "text-white" : "text-neutral-800")}>DECRETO H.C.D. Nro. 37/2022</p>
                  </div>
                  <div onClick={() => setIsDecretoZoomed(true)} className="relative w-full px-6 flex justify-center cursor-zoom-in">
                    <img src="/decreto.png" alt="Decreto" className="max-h-[55vh] w-auto object-contain rounded-sm shadow-sm" />
                    <div className="absolute bottom-2 right-10 bg-black/50 p-1 rounded-full text-white"><ZoomIn size={14} /></div>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button onClick={() => setHelpTab('creador')} className={cn("font-black italic uppercase tracking-widest text-[11px] border-b-2 pb-0.5", isDark ? "text-[#6699ff] border-[#6699ff]" : "text-[#003399] border-[#003399]")}>Nota del Creador</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col animate-in fade-in duration-300 pb-4">
                  <div className="flex flex-row items-center justify-between px-6 pt-8 pb-3 gap-4 shrink-0">
                    <div className="flex-1 text-left">
                      <h2 className={cn("text-[20px] font-black italic tracking-tight uppercase leading-tight", isDark ? "text-[#6699ff]" : "text-[#003399]")}>Nota del Creador</h2>
                      <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Saladillo Vivo Digital</p>
                    </div>
                    <div className="relative w-24 h-24 bg-black/10 rounded-xl overflow-hidden shrink-0 border border-black/5 aspect-square">
                      <Image src="/maraton.png" alt="Maratón" fill className="object-cover" />
                    </div>
                  </div>
                  <div className="px-6 space-y-2.5">
                    <div className={cn("text-[11px] leading-[1.35] font-medium space-y-2 text-justify", isDark ? "text-neutral-300" : "text-neutral-700")}>
                      <p>Soy el creador de <strong>SALADILLO VIVO</strong>, un medio local hecho desde cero con tecnología propia y una visión muy clara: conectar mi comunidad con contenidos relevantes y cercanos.</p>
                      <p>Desde las apps para TV, web y móviles hasta el sistema de noticias, todo lo programé yo. No contraté a nadie, no tercericé tareas: el código, la cámara, la edición y el streaming, salen de mis propias ideas.</p>
                      <p>Nunca fue mi intención poner a funcionar una plataforma más, sino crear identidad. Quiero mostrar a Saladillo en su diversidad, porque además de técnico, también soy parte de esta red viva llena de talento.</p>
                      <p>El motor es el amor por mi ciudad y el deseo de ver crecer a los demás. Es la misma energía que me lleva a correr muchos kilómetros cada semana, donde cada paso es constancia y esfuerzo.</p>
                      <p className="font-black italic text-right pt-1 border-t border-black/5 opacity-80">Matías Vidal</p>
                    </div>
                    <div className="pt-3 flex justify-center">
                      <button onClick={() => setHelpTab('decreto')} className={cn("font-black italic uppercase tracking-widest text-[10px] opacity-70", isDark ? "text-white" : "text-black")}>Ver Decreto</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY ZOOM 100% */}
      {isDecretoZoomed && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className="shrink-0 h-14 flex items-center justify-between px-6 bg-black/80 text-white z-[210]">
                <p className="text-[10px] font-black uppercase tracking-widest">Lectura de Decreto</p>
                <button onClick={() => setIsDecretoZoomed(false)} className="p-2 rounded-full bg-white/10"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-auto bg-neutral-900 flex justify-start items-start">
                <div className="min-w-[800px] w-[200%] h-auto relative p-4"> 
                    <img src="/decreto.png" alt="Zoom" className="w-full h-auto" onDoubleClick={() => setIsDecretoZoomed(false)} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
}