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
  content, 
  isActive, 
  onEnded, 
  onReady, 
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
  
  // 1. Validamos url_slide primero
  const rawSlide = (content as any)?.url_slide;
  const isSlide = useMemo(() => {
    return typeof rawSlide === 'string' && rawSlide.trim().length > 0;
  }, [rawSlide]);

  const slideUrl = useMemo(() => {
    if (!isSlide) return null;
    return `${rawSlide}?autoplay=1&mute=0&t=${new Date().getTime()}`;
  }, [isSlide, rawSlide, (content as any)?.id]);

  // --- 1. LÓGICA DE RESETEO ---
  useEffect(() => {
    setIsFadingOut(false);
    setIsLoaded(false); 
    setIsBuffering(false);
    setIsTuning(false); 
    durationRef.current = 0;
  }, [content]);

  // --- 2. LÓGICA PARA SLIDES (PRIORIDAD) ---
  useEffect(() => {
    if (!isSlide || !isPlaying || !isActive) return;

    setIsTuning(true);

    const article = content as Article;
    const totalDuration = (article?.animation_duration || 15) * 1000;
    const fadeDuration = 500; 

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, totalDuration - fadeDuration);

    const endTimer = setTimeout(() => {
      onEnded();
    }, totalDuration);

    const safetyTimer = setTimeout(() => {
       setIsLoaded(true);
       setIsTuning(false);
       if (onReady) onReady();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
      clearTimeout(safetyTimer);
    };
  }, [content, isPlaying, isActive, onEnded, isSlide, onReady]);

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
      if (onReady) onReady();
    }, 500);
  };

  const RetroFilters = ({ isHeavy }: { isHeavy: boolean }) => (
    <div className={cn("absolute inset-0 z-[15] pointer-events-none transition-opacity duration-700 ease-out", isHeavy ? "opacity-100 bg-black" : "opacity-20")}>
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

  // --- RENDERIZADO ---
  if (!content) return <div className="w-full h-full bg-black" />;

  // MODO 1: SLIDE (PRIORIDAD ALTA)
  if (isSlide) {
    if (!slideUrl) return <div className="bg-black text-white p-4">Error: URL Slide vacía</div>;
    const showSlideStatic = !isLoaded || isTuning;

    return (
      <div className="w-full h-full bg-black overflow-hidden relative">
          <div className="w-full h-full relative">
            {ENABLE_FILTERS && <RetroFilters isHeavy={showSlideStatic} />}
            <iframe
                key={(content as any)?.id} src={slideUrl}
                className={cn("w-full h-full border-0 pointer-events-none transition-opacity duration-500", (!isTuning && !isFadingOut) ? "opacity-100" : "opacity-0")}
                scrolling="no" title="Slide" loading="eager"
                allow="accelerometer; autoplay *; camera *; encrypted-media *; fullscreen *; gyroscope; microphone *; picture-in-picture *; web-share *"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                onLoad={handleSlideLoad}
            />
          </div>
      </div>
    );
  }

  // MODO 2: VIDEO (FALLBACK)
  const video = content as Video;
  const showStatic = !isLoaded || isBuffering;

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
      <div className={cn("w-full h-full transition-opacity duration-500 ease-in-out relative", (isLoaded && !isFadingOut) ? "opacity-100" : "opacity-0")}>
          {ENABLE_FILTERS && <RetroFilters isHeavy={showStatic} />}
          <ReactPlayer
            ref={playerRef} url={video.url} width="100%" height="100%" playing={isActive && isPlaying} muted={muted} volume={1}
            onReady={() => setIsLoaded(true)} onBuffer={() => setIsBuffering(true)} onBufferEnd={() => setIsBuffering(false)}
            onDuration={handleDuration} onProgress={handleProgress} onEnded={onEnded} playsinline
            config={{ youtube: { playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, fs: 0, disablekb: 1 } } }}
          />
      </div>
    </div>
  );
}