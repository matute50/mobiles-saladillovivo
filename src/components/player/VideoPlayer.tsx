'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactPlayer from 'react-player';
import Image from 'next/image'; 
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OnProgressProps } from 'react-player/base';

interface VideoPlayerProps {
  content: Video | Article | null;
  isActive: boolean;
  shouldPreload?: boolean;
  onEnded: () => void;
  onReady?: () => void; 
  muted?: boolean; 
  isPlaying: boolean;
}

export default function VideoPlayer({ 
  content, isActive, onEnded, onReady, muted = true, isPlaying = true 
}: VideoPlayerProps) {
  
  const playerRef = useRef<ReactPlayer>(null);
  
  // Refs para control de tiempo y estado previo
  const mountTimeRef = useRef<number>(Date.now());
  const prevContentRef = useRef<Video | Article | null>(null); // Para detectar cambios
  const MIN_INTRO_TIME_MS = 1500; 

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // ESTADO PARA EL SLIDE FANTASMA (Anti-pantalla negra)
  const [frozenSlide, setFrozenSlide] = useState<string | null>(null);

  const durationRef = useRef<number>(0);
  const ENABLE_FILTERS = true; 

  // --- PRE-CÁLCULOS ACTUALES ---
  const rawSlide = (content as any)?.url_slide;
  const rawVideoUrl = (content as any)?.url;

  const isSlide = typeof rawSlide === 'string' && rawSlide.trim().length > 0;
  const hasVideoUrl = typeof rawVideoUrl === 'string' && rawVideoUrl.trim().length > 0;

  const slideUrl = useMemo(() => {
    if (!isSlide) return null;
    return `${rawSlide}?autoplay=1&mute=0&t=${new Date().getTime()}`;
  }, [isSlide, rawSlide, (content as any)?.id]);

  // --- EFECTO DE CAMBIO DE CONTENIDO Y PERSISTENCIA ---
  useEffect(() => {
    // 1. Detectar qué era lo anterior
    const prevItem = prevContentRef.current;
    const prevWasSlide = (prevItem as any)?.url_slide;

    // 2. Si venimos de un slide y cambiamos a otra cosa...
    if (prevWasSlide && content?.id !== prevItem?.id) {
      // ¡CONGELAMOS EL SLIDE ANTERIOR!
      // Lo guardamos en el estado para mantenerlo visible detrás del nuevo contenido
      // mientras carga el intro.
      setFrozenSlide(prevWasSlide);
      
      // Lo borramos a los 3 segundos (tiempo de sobra para que el Intro tape todo)
      setTimeout(() => {
        setFrozenSlide(null);
      }, 3000);
    } else if (!prevWasSlide) {
      // Si no veníamos de un slide, no hace falta congelar nada
      setFrozenSlide(null);
    }

    // 3. Actualizamos ref y reseteamos estados del nuevo contenido
    prevContentRef.current = content;
    mountTimeRef.current = Date.now();
    
    setIsFadingOut(false);
    setIsLoaded(false); 
    setIsBuffering(false);
    durationRef.current = 0;
  }, [content]);

  // --- LÓGICA DE TIEMPO (POLÍTICA ESTRICTA) ---
  useEffect(() => {
    if (!isSlide || !isPlaying || !isActive) return;

    const article = content as Article;
    const dbDuration = article?.animation_duration || 15;
    const durationSec = Math.max(dbDuration, 5); 
    const totalDuration = durationSec * 1000;

    // Timer para FIN EXACTO
    const endTimer = setTimeout(() => {
       onEnded();
    }, totalDuration);
    
    // Fallback de seguridad
    const safetyTimer = setTimeout(() => {
       finalizeLoading();
    }, 3000);

    return () => {
      clearTimeout(endTimer);
      clearTimeout(safetyTimer);
    };
  }, [content, isPlaying, isActive, onEnded, isSlide, onReady]);


  // --- COORDINADOR DE CARGA ---
  const finalizeLoading = () => {
    setIsLoaded(true);
    const elapsedTime = Date.now() - mountTimeRef.current;
    const remainingTime = MIN_INTRO_TIME_MS - elapsedTime;

    const notifyReady = () => {
      if (onReady) onReady(); 
    };

    if (remainingTime > 0) {
      setTimeout(notifyReady, remainingTime);
    } else {
      notifyReady();
    }
  };

  // --- HANDLERS VIDEO ---
  const handleDuration = (duration: number) => {
    durationRef.current = duration;
  };

  const handleProgress = (state: OnProgressProps) => {
    if (state.playedSeconds > 0 && isBuffering) setIsBuffering(false);
    if (!durationRef.current || durationRef.current === 0) return;
    
    const timeLeft = durationRef.current - state.playedSeconds;
    if (timeLeft < 0.6 && !isFadingOut) setIsFadingOut(true);
    if (timeLeft < 0.2) onEnded();
  };

  // --- COMPONENTE VISUAL ---
  const RetroFilters = ({ isHeavy }: { isHeavy: boolean }) => (
    <div className={cn("absolute inset-0 z-[15] pointer-events-none transition-opacity duration-700 ease-out", isHeavy ? "opacity-100 bg-black" : "opacity-0")}>
      <div className="tv-vignette" />
      <div className="tv-scanlines opacity-50" />
      <div className="absolute inset-0 overflow-hidden z-20">
         <div className={cn("tv-noise", isHeavy ? "opacity-30" : "opacity-1")} />
      </div>
      {isHeavy && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative w-full h-full">
                <Image src="/sintonizando.png" alt="Sintonizando..." fill className="object-cover opacity-80" priority />
            </div>
        </div>
      )}
    </div>
  );

  // --- RENDER ---
  if (!content) return <div className="w-full h-full bg-black" />;

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
      
      {/* --- CAPA 0: SLIDE FANTASMA (FONDO) --- */}
      {/* Este iframe se queda quieto cuando cambiamos de noticia a video, evitando el negro */}
      {frozenSlide && (
        <div className="absolute inset-0 z-0 pointer-events-none">
           <iframe
              src={frozenSlide}
              className="w-full h-full border-0 opacity-100"
              scrolling="no" title="Ghost Slide"
           />
        </div>
      )}

      {/* --- CAPA 1: CONTENIDO ACTUAL --- */}
      {/* Si es Slide Activo */}
      {isSlide && slideUrl && (
        <div className="absolute inset-0 z-10 w-full h-full">
            {ENABLE_FILTERS && <RetroFilters isHeavy={!isLoaded} />}
            <iframe
                key={(content as any)?.id} 
                src={slideUrl}
                className={cn("w-full h-full border-0 pointer-events-none transition-opacity duration-500", !isFadingOut ? "opacity-100" : "opacity-0")}
                scrolling="no" title="Slide" loading="eager"
                allow="accelerometer; autoplay *; camera *; encrypted-media *; fullscreen *; gyroscope; microphone *; picture-in-picture *; web-share *"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                onLoad={() => finalizeLoading()}
            />
        </div>
      )}

      {/* Si es Video Activo */}
      {!isSlide && hasVideoUrl && (
        <div className="absolute inset-0 z-10 w-full h-full">
          <div className={cn("w-full h-full transition-opacity duration-500 ease-in-out relative", (isLoaded && !isFadingOut) ? "opacity-100" : "opacity-0")}>
              {ENABLE_FILTERS && <RetroFilters isHeavy={!isLoaded || isBuffering} />}
              <ReactPlayer
                ref={playerRef} url={content.url as string} 
                width="100%" height="100%" playing={isActive && isPlaying} muted={muted} volume={1}
                onReady={() => setIsLoaded(true)} onBuffer={() => setIsBuffering(true)} onBufferEnd={() => setIsBuffering(false)}
                onDuration={handleDuration} onProgress={handleProgress} onEnded={onEnded} onError={() => onEnded()}
                playsinline
                config={{ youtube: { playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, fs: 0, disablekb: 1 } } }}
              />
          </div>
        </div>
      )}
      
      {/* Si es Video pero sin URL (Error) */}
      {!isSlide && !hasVideoUrl && (
         <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center bg-black">
            <div className="tv-noise opacity-20" />
         </div>
      )}

    </div>
  );
}