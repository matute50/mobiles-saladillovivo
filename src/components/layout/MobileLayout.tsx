'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import VideoSection from './VideoSection';
import { PageData, Video } from '@/lib/types'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Controller } from 'swiper/modules';
import { Play, ChevronLeft, ChevronRight, FileText, X, Sun, Moon, Share2, Search, HelpCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Swiper as SwiperClass } from 'swiper';

import 'swiper/css';

const STOP_WORDS = new Set([
  "el","la","los","las","un","una","unos","unas","lo","al","del","a","ante","bajo","con","contra","de","desde",
  "durante","en","entre","hacia","hasta","mediante","para","por","según","sin","sobre","tras","y","o","u","e",
  "ni","pero","aunque","sino","porque","como","que","si","me","te","se","nos","os","les","mi","mis","tu","tus",
  "su","sus","nuestro","nuestra","nuestros","nuestras","este","esta","estos","estas","ese","esa","esos","esas",
  "aquel","aquella","aquellos","aquellas","ser","estar","haber","tener","hacer","ir","ver","dar","decir","puede",
  "pueden","fue","es","son","era","eran","esta","estan","hay","mas","más","menos","muy","ya","aqui","ahí","asi",
  "así","tambien","también","solo","sólo","todo","todos","todas","algo","nada"
]);

const MOCK_DATA = {
  articles: { featuredNews: null, secondaryNews: [], otherNews: [] },
  videos: { allVideos: [], liveStream: null },
  ads: []
};

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
  return (match && match[2].length === 11) 
    ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` 
    : '/placeholder.png';
};

function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
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

  const toggleTheme = () => setIsDark(!isDark);

  return { isDark: mounted ? isDark : true, toggleTheme };
}

function MobileNewsCard({ news, isFeatured, onClick, isDark }: { news: any; isFeatured: boolean; onClick: () => void; isDark: boolean }) {
  if (!news) return null;
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform",
        isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200",
        isFeatured ? "w-full h-full" : "w-[49%] h-full"
      )}
    >
      <div className="relative w-full h-full">
        <Image
          src={news.imagen || '/placeholder.png'}
          alt={news.titulo || 'Noticia'}
          fill
          priority={isFeatured}
          sizes="(max-width: 768px) 100vw, 50vw" 
          className="object-cover opacity-90"
        />
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t",
          isDark ? "from-black via-black/40 to-transparent" : "from-black/80 via-black/20 to-transparent"
        )} />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full border border-white/30 backdrop-blur-sm z-10">
          <FileText size={isFeatured ? 24 : 16} className="text-white" />
        </div>

        <div className="absolute bottom-0 left-0 p-2 w-full z-20">
          <h3 className={cn(
            "font-['CenturyGothic'] font-bold text-white leading-tight line-clamp-2", 
            isFeatured ? "text-lg mb-1" : "text-xs mb-0.5"
          )}>
            {news.titulo}
          </h3>
          {isFeatured && <p className="text-xs text-gray-300 line-clamp-2 font-light">{news.bajada}</p>}
        </div>
      </div>
    </div>
  );
}

function VideoCarouselBlock({ videos, isDark }: { videos: any[]; isDark: boolean }) {
  const { playManual } = useMediaPlayer(); 
  const [activeCatIndex, setActiveCatIndex] = useState(0);

  const categories = useMemo(() => {
    if (!videos || videos.length === 0) return [];
    const uniqueCats = new Set(videos.map(v => getDisplayCategory(v.categoria)));
    return Array.from(uniqueCats).sort();
  }, [videos]);

  useEffect(() => {
    if (activeCatIndex >= categories.length) setActiveCatIndex(0);
  }, [categories, activeCatIndex]);

  const currentCat = categories[activeCatIndex];

  const filteredVideos = useMemo(() => {
    if (!currentCat) return [];
    return videos.filter(v => getDisplayCategory(v.categoria) === currentCat);
  }, [videos, currentCat]);

  const handlePrevCat = useCallback(() => {
    setActiveCatIndex(prev => (prev === 0 ? categories.length - 1 : prev - 1));
  }, [categories.length]);

  const handleNextCat = useCallback(() => {
    setActiveCatIndex(prev => (prev === categories.length - 1 ? 0 : prev + 1));
  }, [categories.length]);

  if (!videos || videos.length === 0) return <div className={cn("text-xs p-4 text-center italic", isDark ? "text-neutral-500" : "text-neutral-400")}>No hay videos disponibles</div>;
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-col gap-0 h-full w-full">
      <div className={cn(
        "flex items-center justify-between px-2 py-2 shrink-0 rounded-lg border mx-1 transition-colors",
        isDark ? "bg-neutral-900/50 border-white/5" : "bg-neutral-100 border-neutral-200"
      )}>
        <button onClick={handlePrevCat} className={cn("p-2 transition-colors active:scale-90 -mt-[20px]", isDark ? "text-neutral-400 hover:text-orange-500" : "text-neutral-500 hover:text-orange-600")}>
          <ChevronLeft size={28} strokeWidth={3} />
        </button>
        
        <h2 className={cn(
          "font-sans font-extrabold text-xl text-center uppercase tracking-wider truncate px-2 flex-1 drop-shadow-sm -mt-[20px]",
          isDark ? "text-white" : "text-black"
        )}>
          {currentCat}
        </h2>
        
        <button onClick={handleNextCat} className={cn("p-2 transition-colors active:scale-90 -mt-[20px]", isDark ? "text-neutral-400 hover:text-orange-500" : "text-neutral-500 hover:text-orange-600")}>
          <ChevronRight size={28} strokeWidth={3} />
        </button>
      </div>

      <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1 min-h-0 px-1">
        {filteredVideos.map((video) => {
          const thumbSrc = video.imagen || getYouTubeThumbnail(video.url);
          return (
            <SwiperSlide key={video.id} className="h-full">
               <div 
                 onClick={() => playManual(video)} 
                 className={cn(
                   "relative h-full w-full rounded-lg overflow-hidden border active:scale-95 transition-transform group",
                   isDark ? "bg-neutral-800 border-neutral-700/50" : "bg-white border-neutral-200 shadow-sm"
                 )}
               >
                  <Image src={thumbSrc} alt={video.nombre} fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" sizes="150px" />
                   <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <div className="bg-black/40 p-1.5 rounded-full backdrop-blur-sm border border-white/10">
                        <Play size={16} fill="white" className="text-white" />
                      </div>
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                      <p className="text-[9px] text-white font-medium line-clamp-2 leading-tight text-center">{video.nombre}</p>
                   </div>
               </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

export default function MobileLayout({ data, isMobile }: { data: PageData; isMobile: boolean }) {
  const safeData = data || MOCK_DATA;
  const { articles, videos, ads } = safeData as PageData;
  const isLandscape = useOrientation();
  
  const { isDark, toggleTheme } = useTheme(); 
  
  const { playManual, setVideoPool } = useMediaPlayer(); 
  
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const [adsSwiper, setAdsSwiper] = useState<SwiperClass | null>(null);

  const [infoModal, setInfoModal] = useState<{ open: boolean; view: 'DECRETO' | 'BIO' }>({ open: false, view: 'DECRETO' });
  const openModal = (view: 'DECRETO' | 'BIO') => setInfoModal({ open: true, view });
  const closeModal = () => setInfoModal({ ...infoModal, open: false });
  const toggleModalView = () => setInfoModal(prev => ({ ...prev, view: prev.view === 'DECRETO' ? 'BIO' : 'DECRETO' }));

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const logoSrc = isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png';
  const linkColor = isDark ? '#6699ff' : '#003399';
  const iconColor = isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-black';

  const themeClasses = {
    bg: isDark ? "bg-black" : "bg-neutral-50",
    text: isDark ? "text-white" : "text-neutral-900",
    header: isDark 
      ? "bg-gradient-to-b from-neutral-600 to-black" 
      : "bg-gradient-to-b from-neutral-400 to-white",
    containerVideo: isDark ? "bg-neutral-900/30 border-white/5" : "bg-white border-neutral-200 shadow-sm",
    playerWrapper: isDark ? "bg-black border-white/5" : "bg-white border-neutral-200",
  };

  useEffect(() => {
    if (videos?.allVideos?.length > 0) {
       setVideoPool(videos.allVideos);
    }
  }, [videos, setVideoPool]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVideos([]);
      return;
    }

    const queryWords = searchQuery.toLowerCase()
      .split(/\s+/) 
      .filter(w => w.length > 0 && !STOP_WORDS.has(w)); 

    if (queryWords.length === 0) {
      setFilteredVideos([]);
      return;
    }

    const results = (videos?.allVideos || []).filter(video => {
      const titleLower = (video.nombre || "").toLowerCase();
      return queryWords.some(qWord => titleLower.includes(qWord));
    });

    const mappedResults = results.map(v => ({
      ...v,
      categoria: 'TU BUSQUEDA'
    }));

    setFilteredVideos(mappedResults);

  }, [searchQuery, videos]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchOpen]);

  const toggleSearch = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchQuery("");
      setFilteredVideos([]);
    } else {
      setIsSearchOpen(true);
    }
  };

  const videosDisplay = (isSearchOpen && searchQuery.length > 0) 
    ? filteredVideos 
    : (videos?.allVideos || []);

  const newsSlides = useMemo(() => {
    const slides = [];
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) {
      slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    }
    return slides;
  }, [articles]);

  const adsSlides = useMemo(() => {
    if (!ads || ads.length === 0) return [];
    let res = [...ads];
    while (res.length < 3) res = [...res, ...ads];
    return res;
  }, [ads]);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Saladillo Vivo',
          text: 'Mirá lo que está pasando en Saladillo Vivo',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error compartiendo', error);
      }
    } else {
      alert('Función de compartir no soportada en este navegador.');
    }
  };

  if (isLandscape) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
         <div className="w-full h-full"><VideoSection isMobile={true} /></div>
      </div>
    );
  }

  return (
    <>
      {/* MODAL INFO */}
      {infoModal.open && (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal}>
          <div 
            className={cn(
              "relative w-full max-w-md p-6 rounded-xl shadow-2xl overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-200 flex flex-col items-center",
              isDark ? "bg-neutral-900 text-white border border-white/10" : "bg-white text-neutral-900"
            )} 
            onClick={(e) => e.stopPropagation()}
          >
             <button onClick={closeModal} className="absolute top-3 right-3 p-1 opacity-70 hover:opacity-100 hover:bg-black/10 rounded-full transition-all"><X size={24} /></button>
             
             {infoModal.view === 'DECRETO' ? (
               <div className="flex flex-col items-center w-full">
                  <p className="text-sm font-bold text-center mb-4 uppercase tracking-wide leading-relaxed">
                    Declarado de interés cultural<br/>
                    <span style={{ color: linkColor }}>DECRETO H.C.D. Nro. 37/2022</span>
                  </p>
                  <div className="relative w-full h-auto bg-white rounded-md overflow-hidden shadow-sm mb-4">
                      <Image src="/DECRETO.png" alt="Decreto HCD" width={600} height={800} className="object-contain w-full h-auto" />
                  </div>
                  <button 
                    onClick={toggleModalView} 
                    className="mt-2 text-xs font-bold underline cursor-pointer hover:opacity-80 transition-opacity uppercase tracking-widest"
                    style={{ color: linkColor }}
                  >
                    Conocé al Creador
                  </button>
               </div>
             ) : (
               <div className="w-full">
                 <div className="flex flex-col items-center mb-6">
                    <h2 className="text-3xl font-bold font-sans mb-1 text-center">Matías Vidal</h2>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-center border-b-2 pb-1" style={{ color: linkColor, borderColor: linkColor }}>CREADOR DE SALADILLO VIVO</p>
                 </div>
                 <div className={cn("space-y-4 text-sm leading-relaxed text-justify mb-4", isDark ? "text-neutral-300" : "text-neutral-700")}>
                   <p>Soy el creador de <strong style={{ color: linkColor }}>SALADILLO VIVO</strong>, un medio local hecho desde cero con tecnología propia y una visión muy clara: conectar mi comunidad con contenidos relevantes y cercanos.</p>
                   <p>Desde las apps para TV, web y móviles hasta el sistema de noticias, todo lo programé yo. No contraté a nadie, no tercericé tareas: el código, el acopio de contenidos, la cámara, la edición y hasta el streaming, salen de mis propias ideas.</p>
                   <blockquote className={cn("pl-4 border-l-4 font-medium italic my-4 py-1", isDark ? "border-white/20 text-white" : "border-neutral-300 text-black")}>"Nunca fue mi intención poner a funcionar una plataforma más, sino crear identidad."</blockquote>
                   <p>Quiero mostrar a <strong style={{ color: linkColor }}>Saladillo</strong> en su diversidad: sus historias, sus voces, su arte, porque además de técnico, también soy parte de una red viva llena de talentosos e incansables a los que acompaño desde mi lugar, ofreciendo mi medio como espacio para que sus expresiones lleguen más lejos.</p>
                   <p>El motor detrás de todo esto no es una estrategia de negocio. Es el amor por mi ciudad y el deseo de ver crecer a los demás.</p>
                   <p>Es la misma energía que me lleva, cada semana, a correr muchos kilómetros entrenando para una nueva maratón, donde cada paso es constancia, esfuerzo, y visión de llegada.</p>
                 </div>
                 <div className="w-full text-center">
                    <button 
                      onClick={toggleModalView} 
                      className="text-xs font-bold underline cursor-pointer hover:opacity-80 transition-opacity uppercase tracking-widest"
                      style={{ color: linkColor }}
                    >
                      Ver Decreto H.C.D.
                    </button>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}

      <div className={cn("fixed inset-0 z-[100] flex flex-col w-full h-[100dvh] overflow-hidden transition-colors duration-300", themeClasses.bg, themeClasses.text)}>
        
        {/* HEADER */}
        <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-20 sticky top-0 transition-colors duration-300 relative", themeClasses.header)}>
            
            {/* Si NO estamos buscando: Mostramos Logo */}
            {!isSearchOpen && (
              <div className="relative w-36 h-full py-1 flex items-center justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                 <Image src={logoSrc} alt="Saladillo Vivo" fill sizes="(max-width: 768px) 144px, 144px" className="object-contain object-left" priority />
              </div>
            )}

            {/* Si ESTAMOS buscando: Mostramos Input */}
            {isSearchOpen && (
              <div className="flex-1 h-full flex items-center pr-2 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="relative w-full">
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar video..."
                    className={cn(
                      "w-full bg-transparent border-b-2 outline-none py-1 pl-1 pr-8 font-sans font-medium placeholder:font-normal",
                      isDark 
                        ? "border-white/20 text-white placeholder:text-neutral-500 focus:border-white/50" 
                        : "border-black/10 text-black placeholder:text-neutral-400 focus:border-black/30"
                    )}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 z-30 shrink-0">
               {/* Botón LUPA */}
               <button 
                  onClick={toggleSearch} 
                  className={cn("active:scale-90 transition-transform", isSearchOpen ? "text-red-500 hover:text-red-600" : iconColor)}
               >
                  {isSearchOpen ? <X size={24} strokeWidth={2.5} /> : <Search size={20} strokeWidth={2} />}
               </button>

               {!isSearchOpen && (
                 <>
                   {/* Botón de INSTALAR PWA */}
                   {deferredPrompt && (
                     <button onClick={handleInstallClick} className={cn("active:scale-90 transition-transform animate-pulse text-green-500 hover:text-green-600")}>
                        <Download size={20} strokeWidth={2.5} />
                     </button>
                   )}
                   
                   <button onClick={handleShare} className={cn("active:scale-90 transition-transform", iconColor)}><Share2 size={20} strokeWidth={2} /></button>
                   <button onClick={toggleTheme} className={cn("active:scale-90 transition-transform", iconColor)}>{isDark ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}</button>
                   <button onClick={() => openModal('DECRETO')} className={cn("active:scale-90 transition-transform", iconColor)}><HelpCircle size={20} strokeWidth={2} /></button>
                 </>
               )}
            </div>
        </header>

        <div className={cn("shrink-0 sticky top-11 z-30 w-full shadow-xl border-b transition-colors", themeClasses.playerWrapper)}>
          <VideoSection isMobile={true} />
        </div>

        <div className="flex-1 flex flex-col gap-2 px-3 pt-[2px] pb-1 min-h-0">
          
          <div className="w-full px-1 mt-1 text-center shrink-0">
              <h3 className={cn("font-sans font-extrabold text-xl uppercase tracking-wider", isDark ? "text-white" : "text-black")}>Últimas Noticias</h3>
          </div>
          <div className="w-full aspect-[16/8] shrink-0">
            <Swiper modules={[Controller]} onSwiper={setNewsSwiper} controller={{ control: adsSwiper }} spaceBetween={10} slidesPerView={1} className="h-full w-full rounded-xl">
              {newsSlides.length > 0 ? (
                  newsSlides.map((slide, index) => (
                    <SwiperSlide key={`news-${index}`}>
                       <div className="w-full h-full flex justify-between">
                          {slide.items.map((item) => (
                            <MobileNewsCard 
                              key={item?.id} 
                              news={item} 
                              isFeatured={slide.type === 'featured'} 
                              onClick={() => playManual(item)} 
                              isDark={isDark} 
                            />
                          ))}
                       </div>
                    </SwiperSlide>
                  ))
              ) : (
                  <SwiperSlide>
                    <div className={cn("w-full h-full flex items-center justify-center text-xs rounded-xl", isDark ? "bg-neutral-900 text-gray-500" : "bg-neutral-100 text-gray-400")}>Cargando noticias...</div>
                  </SwiperSlide>
              )}
            </Swiper>
          </div>
          
          <div className="h-[220px] shrink-0 flex flex-col -mt-[5px]">
              <div className={cn("flex-1 rounded-xl p-2 border transition-colors", themeClasses.containerVideo)}>
                 <VideoCarouselBlock videos={videosDisplay} isDark={isDark} />
              </div>
          </div>

          <div className="w-full flex-1 min-h-0 mt-2">
              <Swiper modules={[Controller]} onSwiper={setAdsSwiper} controller={{ control: newsSwiper }} spaceBetween={10} slidesPerView={1} loop={adsSlides.length > 3} className="h-full w-full">
                {adsSlides.map((ad, idx) => (
                    <SwiperSlide key={`ad-${idx}`}>
                      <div className={cn("relative w-full h-full rounded-lg overflow-hidden border", isDark ? "border-white/10 bg-black" : "border-neutral-200 bg-white")}>
                          <Image src={ad.imagen_url || '/placeholder_ad.png'} alt="Publicidad" fill className="object-cover" />
                      </div>
                    </SwiperSlide>
                ))}
              </Swiper>
          </div>
        </div>
      </div>
    </>
  );
}