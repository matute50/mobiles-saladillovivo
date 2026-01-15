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

// Pantalla de Carga Elegante
function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
      <div className="relative w-48 h-24 animate-pulse">
        <Image src="/FONDO_OSCURO.png" alt="Saladillo Vivo" fill className="object-contain" />
      </div>
      <div className="mt-8 flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-[#003399]/20 border-t-[#003399] rounded-full animate-spin" />
        <p className="mt-4 text-neutral-500 text-[10px] uppercase tracking-[0.3em] font-bold">Sincronizando contenido...</p>
      </div>
    </div>
  );
}

const STOP_WORDS = new Set(["el","la","los","las","un","una","unos","unas","lo","al","del","a","ante","bajo","con","contra","de","desde","durante","en","entre","hacia","hasta","mediante","para","por","según","sin","sobre","tras","y","o","u","e","ni","pero","aunque","sino","porque","como","que","si","me","te","se","nos","os","les","mi","mis","tu","tus","su","sus","nuestro","nuestra","nuestros","nuevas","este","esta","estos","estas","ese","esa","esos","esas","aquel","aquella","aquellos","aquellas","ser","estar","haber","tener","hacer","ir","ver","dar","decir","puede","pueden","fue","es","son","era","eran","esta","estan","hay","mas","más","menos","muy","ya","aqui","ahí","asi","así","tambien","también","solo","sólo","todo","todos","todas","algo","nada"]);

const getDisplayCategory = (dbCat: string) => {
  if (!dbCat) return 'VARIOS';
  const upper = dbCat.trim().toUpperCase();
  if (upper.includes('HCD') && upper.includes('SALADILLO')) return 'HCD SALADILLO';
  if (upper.includes('ITEC') && upper.includes('CICAR')) return 'ITEC ¨A. Cicaré¨'; 
  return upper; 
};

const getYouTubeThumbnail = (url: string) => {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : '/placeholder.png';
};

function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check(); window.addEventListener('resize', check);
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
  return { isDark: mounted ? isDark : true, toggleTheme: () => setIsDark(!isDark) };
}

function MobileNewsCard({ news, isFeatured, onClick, isDark }: any) {
  return (
    <div onClick={onClick} className={cn("relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform", isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200", isFeatured ? "w-full h-full" : "w-[49%] h-full")}>
      <div className="relative w-full h-full">
        <Image src={news.imagen || '/placeholder.png'} alt={news.titulo} fill className="object-cover opacity-90" />
        <div className={cn("absolute inset-0 bg-gradient-to-t z-10", isDark ? "from-black via-black/60 to-transparent" : "from-black/90 via-black/50 to-transparent")} />
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-3 text-center">
            <div className={cn("flex items-center justify-center rounded-full bg-[#003399]/50 backdrop-blur-sm border border-white/20 mb-2", isFeatured ? "p-4" : "p-3")}>
                <Play size={isFeatured ? 32 : 24} fill="white" className="text-white ml-1"/>
            </div>
            <h3 className={cn("text-white font-black uppercase tracking-tight leading-[1.1] text-balance", isFeatured ? "text-xl line-clamp-3" : "text-[13px] line-clamp-4")}>{news.titulo}</h3>
        </div>
      </div>
    </div>
  );
}

function VideoCarouselBlock({ videos, isDark }: any) {
  const { playManual } = useMediaPlayer(); const { unmute } = useVolume();
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const categories = useMemo(() => Array.from(new Set(videos.map((v: any) => getDisplayCategory(v.categoria)))).sort(), [videos]);
  const currentCat = categories[activeCatIndex];
  const filtered = videos.filter((v: any) => getDisplayCategory(v.categoria) === currentCat);

  return (
    <div className="flex flex-col h-full w-full pt-[5px]">
      <div className="flex items-center justify-between px-2 py-0.5 shrink-0">
        <button onClick={() => setActiveCatIndex(p => p === 0 ? categories.length - 1 : p - 1)} className={isDark ? "text-neutral-400" : "text-neutral-500"}><ChevronLeft size={28} /></button>
        <h2 className={cn("font-extrabold text-xl uppercase tracking-wider text-center flex-1 truncate px-2", isDark ? "text-white" : "text-black")}>{currentCat}</h2>
        <button onClick={() => setActiveCatIndex(p => p === categories.length - 1 ? 0 : p + 1)} className={isDark ? "text-neutral-400" : "text-neutral-500"}><ChevronRight size={28} /></button>
      </div>
      <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1 px-1 mt-[5px]">
        {filtered.map((v: any) => (
          <SwiperSlide key={v.id}>
            <div onClick={() => { unmute(); playManual(v); }} className={cn("relative h-full rounded-lg overflow-hidden border", isDark ? "bg-neutral-800 border-neutral-700/50" : "bg-white border-neutral-200")}>
              <Image src={v.imagen || getYouTubeThumbnail(v.url)} alt={v.nombre} fill className="object-cover opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10"><div className="bg-[#003399]/50 p-1.5 rounded-full border border-white/10 -mt-10"><Play size={21} fill="white" /></div></div>
              <div className="absolute bottom-0 w-full p-1.5 bg-gradient-to-t from-black via-black/60 to-transparent"><p className="text-[14px] text-white font-bold line-clamp-2 uppercase text-center leading-tight">{v.nombre}</p></div>
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
  
  const [mounted, setMounted] = useState(false);
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const [adsSwiper, setAdsSwiper] = useState<SwiperClass | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; view: 'decreto' | 'creador' }>({ isOpen: false, view: 'decreto' });

  // PROTECCIÓN ANTI-ERROR: Solo activamos el montaje cuando React está listo en el cliente
  useEffect(() => {
    if (data?.videos?.allVideos) setVideoPool(data.videos.allVideos);
    const timer = setTimeout(() => setMounted(true), 1200);
    return () => clearTimeout(timer);
  }, [data, setVideoPool]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredVideos([]); return; }
    const q = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0 && !STOP_WORDS.has(w)); 
    const res = (data?.videos?.allVideos || []).filter(v => q.some(word => (v.nombre || "").toLowerCase().includes(word)));
    setFilteredVideos(res.map(v => ({ ...v, categoria: 'TU BUSQUEDA' })));
  }, [searchQuery, data]);

  const newsSlides = useMemo(() => {
    const slides = []; const articles = data?.articles;
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    return slides;
  }, [data]);

  const adsList = useMemo(() => data?.ads || [], [data]);
  const linkColor = isDark ? '#6699ff' : '#003399';

  // Si no ha cargado, mostramos LoadingScreen para evitar Application Error
  if (!mounted) return <LoadingScreen />;

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden transition-colors", isDark ? "bg-black" : "bg-neutral-50")}>
      
      {infoModal.isOpen && (
        <div className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>
          <div className={cn("relative w-full max-w-md p-6 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col items-center", isDark ? "bg-neutral-900 text-white border border-white/10" : "bg-white text-neutral-900")} onClick={(e) => e.stopPropagation()}>
             <button onClick={() => setInfoModal({ ...infoModal, isOpen: false })} className="absolute top-2 right-2 p-2 opacity-80 hover:opacity-100 bg-black/10 rounded-full transition-all z-[501]"><X size={32} /></button>
             
             {infoModal.view === 'decreto' ? (
               <div className="flex flex-col items-center w-full pt-4">
                  <p className="text-[13px] font-black text-center mb-6 uppercase tracking-widest leading-tight">Declarado de interés cultural<br/><span style={{ color: linkColor }} className="text-[11px] opacity-80">DECRETO H.C.D. Nro. 37/2022</span></p>
                  <div className="w-full relative bg-white rounded-lg shadow-inner overflow-hidden border border-neutral-200 mb-6">
                    <img src="/DECRETO.png?v=2" alt="Decreto HCD" className="w-full h-auto block" />
                  </div>
                  <button onClick={() => setInfoModal({ isOpen: true, view: 'creador' })} className="text-xs font-bold underline uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: linkColor }}>Conoce al creador</button>
               </div>
             ) : (
               <div className="flex flex-col items-center w-full pt-4 text-center">
                  <h2 className="text-3xl font-black mb-1">Matías Vidal</h2>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded mb-6" style={{ backgroundColor: linkColor, color: 'white' }}>CREADOR DE SALADILLO VIVO</p>
                  <div className="w-[180px] h-[180px] relative mb-6 rounded-full border-4 shadow-xl overflow-hidden" style={{ borderColor: linkColor }}>
                    <img src="/maraton.png" alt="Matías Vidal" className="w-full h-full object-cover" />
                  </div>
                  <div className={cn("space-y-4 text-[14px] leading-relaxed px-2", isDark ? "text-neutral-300" : "text-neutral-700")}>
                    <p>Soy el creador de <strong style={{ color: linkColor }}>SALADILLO VIVO</strong>, un medio local hecho desde cero...</p>
                    <p className="font-black italic py-2 border-y border-neutral-500/20 italic text-pretty">"Nunca fue mi intención poner a funcionar una plataforma más, sino crear identidad."</p>
                  </div>
                  <button onClick={() => setInfoModal({ isOpen: true, view: 'decreto' })} className="mt-8 text-xs font-bold underline uppercase tracking-widest opacity-60">Volver al Decreto</button>
               </div>
             )}
          </div>
        </div>
      )}

      {!isLandscape && (
        <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-50", isDark ? "bg-gradient-to-b from-neutral-600 to-black" : "bg-gradient-to-b from-neutral-400 to-white")}>
          {!isSearchOpen ? <div className="relative w-36 h-full py-1"><Image src={isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png'} alt="Logo" fill className="object-contain" priority /></div> :
          <div className="flex-1 h-full flex items-center pr-2"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..." className={cn("w-full bg-transparent border-b-2 outline-none py-1 text-sm", isDark ? "border-white/20 text-white" : "border-black/10 text-black")} /></div>}
          <div className="flex items-center gap-3">
             <button onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(""); }} className={isDark ? "text-neutral-300" : "text-neutral-700"}>{isSearchOpen ? <X size={24}/> : <Search size={20}/>}</button>
             {!isSearchOpen && (
               <>
                 <button onClick={toggleTheme}>{isDark ? <Sun size={20} className="text-white"/> : <Moon size={20}/>}</button>
                 <button onClick={() => navigator.share && navigator.share({url: window.location.href})} className={isDark ? "text-white" : "text-black"}><Share2 size={20}/></button>
                 <button onClick={() => setInfoModal({ isOpen: true, view: 'decreto' })} className={isDark ? "text-white" : "text-black"}><HelpCircle size={20}/></button>
                 <button className={isDark ? "text-white" : "text-black"}><Download size={20}/></button>
               </>
             )}
          </div>
        </header>
      )}

      <div className={cn("transition-all duration-500", isLandscape ? "fixed inset-0 z-[500] w-[100vw] h-[100dvh]" : "relative z-40 w-full aspect-video bg-black")}>
        <VideoSection isMobile={true} />
      </div>

      {!isLandscape && (
        <div className="flex-1 flex flex-col gap-2 px-3 pt-1 pb-1 min-h-0 overflow-y-auto">
          <h3 className={cn("font-extrabold text-xl uppercase text-center mt-1", isDark ? "text-white" : "text-black")}>Últimas Noticias</h3>
          <div className="w-full aspect-[16/8] shrink-0">
            <Swiper modules={[Controller]} onSwiper={setNewsSwiper} controller={{ control: adsSwiper }} slidesPerView={1} className="h-full">
              {newsSlides.map((slide, idx) => (
                <SwiperSlide key={idx}><div className="w-full h-full flex justify-between">{slide.items.map((item: any) => (<MobileNewsCard key={item.id} news={item} isFeatured={slide.type === 'featured'} isDark={isDark} onClick={() => { unmute(); playManual(item); }} />))}</div></SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="h-[160px] shrink-0 -mt-1"><VideoCarouselBlock videos={(isSearchOpen && searchQuery) ? filteredVideos : (data?.videos?.allVideos || [])} isDark={isDark} /></div>
          <div className="w-full flex-1 min-h-[100px] mt-2 pb-2">
            {adsList.length > 0 && (
              <Swiper modules={[Controller]} onSwiper={setAdsSwiper} controller={{ control: newsSwiper }} slidesPerView={1} loop className="h-full w-full">
                {adsList.map((ad: any, idx) => (<SwiperSlide key={idx}><div className={cn("relative w-full h-full rounded-lg overflow-hidden border", isDark ? "border-white/10 bg-black" : "border-neutral-200 bg-white")}><Image src={ad.imagen_url || '/placeholder_ad.png'} alt="Ad" fill className="object-cover" /></div></SwiperSlide>))}
              </Swiper>
            )}
          </div>
        </div>
      )}
    </div>
  );
}