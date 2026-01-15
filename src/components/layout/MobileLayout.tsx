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

const STOP_WORDS = new Set(["el","la","los","las","un","una","unos","unas","lo","al","del","a","ante","bajo","con","contra","de","desde","durante","en","entre","hacia","hasta","mediante","para","por","según","sin","sobre","tras","y","o","u","e","ni","pero","aunque","sino","porque","como","que","si","me","te","se","nos","os","les","mi","mis","tu","tus","su","sus","nuestro","nuestra","nuestros","nuestras","este","esta","estos","estas","ese","esa","esos","esas","aquel","aquella","aquellos","aquellas","ser","estar","haber","tener","hacer","ir","ver","dar","decir","puede","pueden","fue","es","son","era","eran","esta","estan","hay","mas","más","menos","muy","ya","aqui","ahí","asi","así","tambien","también","solo","sólo","todo","todos","todas","algo","nada"]);

const BACKUP_VIDEO: Video = { 
  id: 'backup-default', 
  nombre: 'Saladillo Vivo - Transmisión', 
  url: 'https://www.youtube.com/watch?v=ysz5S6P_bsI', 
  categoria: 'General', 
  fecha: new Date().toISOString(),
  imagen: 'https://img.youtube.com/vi/ysz5S6P_bsI/mqdefault.jpg'
};

const MOCK_DATA = {
  articles: { featuredNews: null, secondaryNews: [], otherNews: [] },
  videos: { allVideos: [BACKUP_VIDEO], liveStream: null },
  ads: []
};

const CATEGORY_MAP: Record<string, string> = { 'export': 'Gente de Acá', 'SEMBRANDO FUTURO': 'Sembrando Futuro', 'ARCHIVO SALADILLO VIVO': 'De Otros Tiempos', 'historia': 'De Otros Tiempos', 'Noticias': 'Últimas Noticias', 'clips': 'Saladillo Canta', 'cortos': 'Hacelo Corto', 'TU BUSQUEDA': 'TU BUSQUEDA' };

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
  const toggleTheme = () => setIsDark(!isDark);
  return { isDark: mounted ? isDark : true, toggleTheme };
}

// MobileNewsCard con leading ajustado a 0.8
function MobileNewsCard({ news, isFeatured, onClick, isDark }: { news: any; isFeatured: boolean; onClick: () => void; isDark: boolean }) {
  if (!news) return null;
  return (
    <div onClick={onClick} className={cn("relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform group", isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200", isFeatured ? "w-full h-full" : "w-[49%] h-full")}>
      <div className="relative w-full h-full">
        <Image src={news.imagen || '/placeholder.png'} alt={news.titulo || 'Noticia'} fill priority={isFeatured} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
        <div className={cn("absolute inset-0 bg-gradient-to-t z-10", isDark ? "from-black via-black/60 to-transparent" : "from-black/90 via-black/50 to-transparent")} />
        <div className="absolute inset-0 z-20 flex flex-col">
            <div className={cn("flex-1 flex items-center justify-center min-h-0", isFeatured && "pt-16")}>
                <div className={cn("flex items-center justify-center rounded-full backdrop-blur-sm border border-white/20 shadow-2xl transition-transform duration-300 group-active:scale-90", "bg-[#003399]/50", isFeatured ? "p-4" : "p-3", isFeatured && "-translate-y-[20px]")}>
                    <Play size={isFeatured ? 38 : 28} fill="currentColor" className="text-white ml-1 opacity-90" strokeWidth={0}/>
                </div>
            </div>
            <div className={cn("shrink-0 w-full flex flex-col justify-end", isFeatured ? "p-4 pb-2" : "p-2 pb-3")}>
                {/* AQUI EL CAMBIO: leading-[0.8] para reducir espacio entre lineas */}
                <h3 className={cn("text-white font-black uppercase tracking-tight leading-[0.8] text-balance drop-shadow-xl text-center", isFeatured ? "line-clamp-3 mb-1" : "line-clamp-4 mb-0")} style={{ fontSize: isFeatured ? 'clamp(1.3rem, 6vw, 2.2rem)' : 'clamp(0.95rem, 4.5vw, 1.6rem)', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>{news.titulo}</h3>
                {isFeatured && news.bajada && (<p className="text-xs text-gray-300 line-clamp-2 font-medium text-center opacity-80 leading-tight mx-auto max-w-[90%]">{news.bajada}</p>)}
            </div>
        </div>
      </div>
    </div>
  );
}

function VideoCarouselBlock({ videos, isDark }: { videos: any[]; isDark: boolean }) {
  const { playManual } = useMediaPlayer(); 
  const { unmute } = useVolume(); 
  const [activeCatIndex, setActiveCatIndex] = useState(0);

  const handlePlay = (video: any) => {
    if (unmute) unmute();
    if (playManual) playManual(video);
  };

  const categories = useMemo(() => {
    if (!videos || videos.length === 0) return [];
    const uniqueCats = new Set(videos.map(v => getDisplayCategory(v.categoria)));
    return Array.from(uniqueCats).sort();
  }, [videos]);

  useEffect(() => { if (activeCatIndex >= categories.length) setActiveCatIndex(0); }, [categories, activeCatIndex]);

  const currentCat = categories[activeCatIndex];
  const filteredVideos = useMemo(() => {
    if (!currentCat) return [];
    return videos.filter(v => getDisplayCategory(v.categoria) === currentCat);
  }, [videos, currentCat]);

  return (
    <div className="flex flex-col gap-0 h-full w-full">
      <div className="flex items-center justify-between px-2 py-0.5 shrink-0 rounded-lg mx-1 transition-colors bg-transparent">
        <button onClick={() => setActiveCatIndex(prev => (prev === 0 ? categories.length - 1 : prev - 1))} className={cn("p-2 transition-colors active:scale-90 -mt-[15px]", isDark ? "text-neutral-400 hover:text-red-500" : "text-neutral-500 hover:text-red-600")}><ChevronLeft size={28} strokeWidth={3} /></button>
        <h2 className={cn("font-sans font-extrabold text-xl text-center uppercase tracking-wider truncate px-2 flex-1 drop-shadow-sm -mt-[15px]", isDark ? "text-white" : "text-black")}>{currentCat}</h2>
        <button onClick={() => setActiveCatIndex(prev => (prev === categories.length - 1 ? 0 : prev + 1))} className={cn("p-2 transition-colors active:scale-90 -mt-[15px]", isDark ? "text-neutral-400 hover:text-red-500" : "text-neutral-500 hover:text-red-600")}><ChevronRight size={28} strokeWidth={3} /></button>
      </div>

      <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1 min-h-0 px-1">
        {filteredVideos.map((video) => (
            <SwiperSlide key={video.id} className="h-full">
               <div onClick={() => handlePlay(video)} className={cn("relative h-full w-full rounded-lg overflow-hidden border active:scale-95 transition-transform group", isDark ? "bg-neutral-800 border-neutral-700/50" : "bg-white border-neutral-200 shadow-sm")}>
                  <Image src={video.imagen || getYouTubeThumbnail(video.url)} alt={video.nombre} fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" sizes="150px" />
                   <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <div className={cn("p-1.5 rounded-full backdrop-blur-sm border border-white/10", "-mt-[50px]", "bg-[#003399]/50")}> <Play size={21} fill="white" className="text-white" /> </div>
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                      <p className="text-[14px] text-white font-bold line-clamp-3 leading-tight text-center uppercase drop-shadow-md">{video.nombre}</p>
                   </div>
               </div>
            </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default function MobileLayout({ data, isMobile }: { data: PageData; isMobile: boolean }) {
  const safeData = data || MOCK_DATA;
  const { articles, ads } = safeData as PageData;
  const { isDark, toggleTheme } = useTheme(); 
  const { playManual, setVideoPool, currentVideo } = useMediaPlayer();
  const { unmute } = useVolume(); 
  
  const rawVideos = safeData.videos?.allVideos || [];
  const activeVideos = rawVideos.length > 0 ? rawVideos : [BACKUP_VIDEO];

  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const [adsSwiper, setAdsSwiper] = useState<SwiperClass | null>(null);
  const [infoModal, setInfoModal] = useState<{ open: boolean; view: 'DECRETO' | 'BIO' }>({ open: false, view: 'DECRETO' });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const themeClasses = {
    bg: isDark ? "bg-black" : "bg-neutral-50",
    text: isDark ? "text-white" : "text-neutral-900",
    header: isDark ? "bg-gradient-to-b from-neutral-600 to-black" : "bg-gradient-to-b from-neutral-400 to-white",
    containerVideo: "bg-transparent border-none shadow-none", 
    playerWrapper: isDark ? "bg-black border-white/5" : "bg-white border-neutral-200",
  };

  useEffect(() => { 
    if (activeVideos.length > 0) {
      setVideoPool(activeVideos); 
    }
  }, [activeVideos, setVideoPool]);

  useEffect(() => {
    if (!currentVideo && activeVideos.length > 0) {
       if (playManual) playManual(activeVideos[0]);
    }
  }, [activeVideos, currentVideo, playManual]);

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

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Saladillo Vivo',
          text: 'Información local al instante.',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
        console.log("Web Share API no soportada");
    }
  };

  const handleNewsClick = (item: any) => {
    if (unmute) unmute();
    if (playManual) playManual(item);
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredVideos([]); return; }
    const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0 && !STOP_WORDS.has(w)); 
    if (queryWords.length === 0) { setFilteredVideos([]); return; }
    const results = activeVideos.filter(video => queryWords.some(qWord => (video.nombre || "").toLowerCase().includes(qWord)));
    setFilteredVideos(results.map(v => ({ ...v, categoria: 'TU BUSQUEDA' })));
  }, [searchQuery, activeVideos]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) setTimeout(() => { searchInputRef.current?.focus(); }, 50);
  }, [isSearchOpen]);

  const newsSlides = useMemo(() => {
    const slides = [];
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    return slides;
  }, [articles]);

  const adsSlides = useMemo(() => {
    if (!ads || ads.length === 0) return [];
    let res = [...ads];
    while (res.length < 3) res = [...res, ...ads];
    return res;
  }, [ads]);

  return (
    <>
      <style>{`@keyframes installPulse { 0%, 100% { color: #003399; } 50% { color: #6699ff; } } .install-pulse { animation: installPulse 1.5s ease-in-out infinite; }`}</style>

      {infoModal.open && (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setInfoModal({...infoModal, open: false})}>
          <div className={cn("relative w-full max-w-md p-6 rounded-xl shadow-2xl overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-200 flex flex-col items-center", isDark ? "bg-neutral-900 text-white border border-white/10" : "bg-white text-neutral-900")} onClick={(e) => e.stopPropagation()}>
             <button onClick={() => setInfoModal({...infoModal, open: false})} className="absolute top-3 right-3 p-1 opacity-70 hover:opacity-100 hover:bg-black/10 rounded-full transition-all"><X size={24} /></button>
             {infoModal.view === 'DECRETO' ? (
               <div className="flex flex-col items-center w-full">
                  <p className="text-sm font-bold text-center mb-4 uppercase tracking-wide leading-relaxed">Declarado de interés cultural<br/><span style={{ color: '#003399' }}>DECRETO H.C.D. Nro. 37/2022</span></p>
                  <div className="relative w-full h-auto bg-white rounded-md overflow-hidden shadow-sm mb-4"><Image src="/DECRETO.png" alt="Decreto HCD" width={600} height={800} className="object-contain w-full h-auto" /></div>
                  <button onClick={() => setInfoModal(p => ({...p, view: 'BIO'}))} className="mt-2 text-xs font-bold underline cursor-pointer hover:opacity-80 transition-opacity uppercase tracking-widest" style={{ color: '#003399' }}>Conocé al Creador</button>
               </div>
             ) : (
               <div className="w-full">
                 <div className="flex flex-col items-center mb-6"><h2 className="text-3xl font-bold font-sans mb-1 text-center">Matías Vidal</h2><p className="text-xs font-bold uppercase tracking-[0.2em] text-center border-b-2 pb-1" style={{ color: '#003399', borderColor: '#003399' }}>CREADOR DE SALADILLO VIVO</p></div>
                 <div className={cn("space-y-4 text-sm leading-relaxed text-justify mb-4", isDark ? "text-neutral-300" : "text-neutral-700")}>
                   <p>Soy el creador de <strong style={{ color: '#003399' }}>SALADILLO VIVO</strong>...</p>
                 </div>
                 <div className="w-full text-center"><button onClick={() => setInfoModal(p => ({...p, view: 'DECRETO'}))} className="text-xs font-bold underline cursor-pointer hover:opacity-80 transition-opacity uppercase tracking-widest" style={{ color: '#003399' }}>Ver Decreto H.C.D.</button></div>
               </div>
             )}
          </div>
        </div>
      )}

      <div className={cn("fixed inset-0 z-[100] flex flex-col w-full h-[100dvh] overflow-hidden transition-colors duration-300", themeClasses.bg, themeClasses.text)}>
        <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-20 sticky top-0 transition-colors duration-300 relative", themeClasses.header)}>
            {!isSearchOpen && (<div className="relative w-36 h-full py-1 flex items-center justify-start animate-in fade-in slide-in-from-left-2 duration-300"><Image src={isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png'} alt="Saladillo Vivo" fill sizes="(max-width: 768px) 144px, 144px" className="object-contain object-left" priority /></div>)}
            {isSearchOpen && (
              <div className="flex-1 h-full flex items-center pr-2 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="relative w-full"><input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar video..." className={cn("w-full bg-transparent border-b-2 outline-none py-1 pl-1 pr-8 font-sans font-medium placeholder:font-normal", isDark ? "border-white/20 text-white placeholder:text-neutral-500 focus:border-white/50" : "border-black/10 text-black placeholder:text-neutral-400 focus:border-black/30")} />{searchQuery && (<button onClick={() => setSearchQuery("")} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-red-500"><X size={16} /></button>)}</div>
              </div>
            )}
            <div className="flex items-center gap-3 z-30 shrink-0">
               <button onClick={() => { setIsSearchOpen(!isSearchOpen); if(isSearchOpen) setSearchQuery(""); }} className={cn("active:scale-90 transition-transform", isSearchOpen ? "text-red-500 hover:text-red-600" : (isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-black'))}>{isSearchOpen ? <X size={24} strokeWidth={2.5} /> : <Search size={20} strokeWidth={2} />}</button>
               {!isSearchOpen && (
                 <>
                   <button onClick={toggleTheme} className={cn("active:scale-90 transition-transform", isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-black')}>{isDark ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}</button>
                   <button onClick={handleShare} className={cn("active:scale-90 transition-transform", isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-black')}><Share2 size={20} strokeWidth={2} /></button>
                   <button onClick={() => setInfoModal({open: true, view: 'DECRETO'})} className={cn("active:scale-90 transition-transform", isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-black')}><HelpCircle size={20} strokeWidth={2} /></button>
                   {deferredPrompt && (<button onClick={handleInstallClick} className={cn("active:scale-90 transition-transform install-pulse")}><Download size={20} strokeWidth={2.5} /></button>)}
                 </>
               )}
            </div>
        </header>

        {/* CONTENEDOR VIDEO (aspect-video crítico) */}
        <div className={cn("shrink-0 sticky top-11 z-30 w-full aspect-video shadow-xl border-b transition-colors", themeClasses.playerWrapper)}>
          <VideoSection isMobile={true} />
        </div>

        <div className="flex-1 flex flex-col gap-2 px-3 pt-[2px] pb-1 min-h-0">
          <div className="w-full px-1 mt-1 text-center shrink-0"><h3 className={cn("font-sans font-extrabold text-xl uppercase tracking-wider", isDark ? "text-white" : "text-black")}>Últimas Noticias</h3></div>
          <div className="w-full aspect-[16/8] shrink-0">
            <Swiper modules={[Controller]} onSwiper={setNewsSwiper} controller={{ control: adsSwiper }} spaceBetween={10} slidesPerView={1} className="h-full w-full rounded-xl">
              {newsSlides.map((slide, index) => (
                <SwiperSlide key={`news-${index}`}>
                   <div className="w-full h-full flex justify-between">{slide.items.map((item) => (<MobileNewsCard key={item?.id} news={item} isFeatured={slide.type === 'featured'} onClick={() => handleNewsClick(item)} isDark={isDark} />))}</div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="h-[160px] shrink-0 flex flex-col -mt-[5px]">
              <div className={cn("flex-1 rounded-xl p-2 border transition-colors", themeClasses.containerVideo)}><VideoCarouselBlock videos={(isSearchOpen && searchQuery.length > 0) ? filteredVideos : activeVideos} isDark={isDark} /></div>
          </div>
          <div className="w-full flex-1 min-h-0 mt-2">
              <Swiper modules={[Controller]} onSwiper={setAdsSwiper} controller={{ control: newsSwiper }} spaceBetween={10} slidesPerView={1} loop={adsSlides.length > 3} className="h-full w-full">
                {adsSlides.map((ad, idx) => (<SwiperSlide key={`ad-${idx}`}><div className={cn("relative w-full h-full rounded-lg overflow-hidden border", isDark ? "border-white/10 bg-black" : "border-neutral-200 bg-white")}><Image src={ad.imagen_url || '/placeholder_ad.png'} alt="Publicidad" fill className="object-cover" /></div></SwiperSlide>))}
              </Swiper>
          </div>
        </div>
      </div>
    </>
  );
}