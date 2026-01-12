'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OnProgressProps } from 'react-player/base';

interface VideoPlayerProps {
  content: Video | Article | null;
  isActive: boolean;
  shouldPreload?: boolean;
  onEnded: () => void;
  muted?: boolean; 
  isPlaying: boolean;
}

export default function VideoPlayer({ 
  content, 
  isActive, 
  onEnded, 
  muted = true, 
  isPlaying = true 
}: VideoPlayerProps) {
  
  const playerRef = useRef<ReactPlayer>(null);
  
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isTuning, setIsTuning] = useState(false);

  const durationRef = useRef<number>(0);
  const ENABLE_FILTERS = true; 

  // --- 0. PRE-CÁLCULOS SEGUROS ---
  const isArticle = useMemo(() => {
    return content && !('url' in content && typeof (content as Video).url === 'string');
  }, [content]);

  const articleData = isArticle ? (content as Article) : null;

  const slideUrl = useMemo(() => {
    if (!articleData || !articleData.url_slide) return null;
    return `${articleData.url_slide}?t=${new Date().getTime()}`;
  }, [articleData?.url_slide, articleData?.id]);


  // --- 1. LÓGICA DE RESETEO ---
  useEffect(() => {
    setIsFadingOut(false);
    setIsLoaded(false); 
    setIsBuffering(false);
    setIsTuning(false); 
    durationRef.current = 0;
  }, [content]);

  // --- 2. LÓGICA PARA ARTÍCULOS ---
  useEffect(() => {
    if (!isArticle || !isPlaying || !isActive) return;

    setIsTuning(true); // Activar estática de "Sintonizando"

    const article = content as Article;
    const totalDuration = (article.animation_duration || 15) * 1000;
    const fadeDuration = 500; 

    // Timer para fade out normal
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, totalDuration - fadeDuration);

    // Timer para terminar el slide
    const endTimer = setTimeout(() => {
      onEnded();
    }, totalDuration);

    // === TIMER DE SEGURIDAD (FALLBACK) ===
    // Si en 2.5 segundos el iframe no avisó que cargó, destrabamos todo a la fuerza.
    const safetyTimer = setTimeout(() => {
       setIsLoaded(true);
       setIsTuning(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
      clearTimeout(safetyTimer); // Limpiar timer de seguridad
    };
  }, [content, isPlaying, isActive, onEnded, isArticle]);

  // --- 3. LÓGICA PARA VIDEOS ---
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

  const handleSlideLoad = () => {
    setTimeout(() => {
      setIsLoaded(true);
      setIsTuning(false); 
    }, 500);
  };

  // --- COMPONENTE DE FILTROS ---
  const RetroFilters = ({ isHeavy }: { isHeavy: boolean }) => (
    <div 
      className={cn(
        "absolute inset-0 z-[15] pointer-events-none transition-opacity duration-700 ease-out",
        isHeavy ? "opacity-100 bg-black" : "opacity-20"
      )}
    >
      <div className="tv-vignette" />
      <div className="tv-scanlines opacity-50" />
      <div className="absolute inset-0 overflow-hidden">
         <div className={cn("tv-noise", isHeavy ? "opacity-30" : "opacity-1")} />
      </div>
      
      {isHeavy && (
        <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/50 font-mono text-xs animate-pulse tracking-widest">SINTONIZANDO...</p>
        </div>
      )}
    </div>
  );

  // --- RENDERIZADO ---
  if (!content) return <div className="w-full h-full bg-black" />;

  // A. VIDEO
  if (!isArticle) {
    const video = content as Video;
    const showStatic = !isLoaded || isBuffering;

    return (
      <div className="w-full h-full bg-black overflow-hidden relative">
        <div 
          className={cn(
            "w-full h-full transition-opacity duration-500 ease-in-out relative",
            (isLoaded && !isFadingOut) ? "opacity-100" : "opacity-0"
          )}
        >
            {ENABLE_FILTERS && <RetroFilters isHeavy={showStatic} />}

            <ReactPlayer
              ref={playerRef}
              url={video.url}
              width="100%"
              height="100%"
              playing={isActive && isPlaying}
              muted={muted} 
              volume={1}
              onReady={() => setIsLoaded(true)} 
              onBuffer={() => setIsBuffering(true)}      
              onBufferEnd={() => setIsBuffering(false)}  
              onDuration={handleDuration}       
              onProgress={handleProgress}       
              onEnded={onEnded}                 
              playsinline={true} 
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 1,
                    controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, fs: 0, disablekb: 1,
                  }
                }
              }}
            />
        </div>
      </div>
    );
  }

  // B. SLIDE (.HTML)
  if (!slideUrl) return <div className="w-full h-full bg-black text-white">Sin slide</div>;

  const showSlideStatic = !isLoaded || isTuning;

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
        <div className="w-full h-full relative">
          
          {ENABLE_FILTERS && <RetroFilters isHeavy={showSlideStatic} />}

          <iframe
              key={articleData?.id} 
              src={slideUrl}
              className={cn(
                  "w-full h-full border-0 pointer-events-none transition-opacity duration-500",
                  (!isTuning && !isFadingOut) ? "opacity-100" : "opacity-0"
              )}
              scrolling="no"
              title={articleData?.titulo}
              loading="eager"
              sandbox="allow-scripts allow-same-origin"
              onLoad={handleSlideLoad}
          />
        </div>
    </div>
  );
}