'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OnProgressProps } from 'react-player/base';

interface VideoPlayerProps {
  content: Video | Article | null;
  isActive: boolean;
  onEnded: () => void;
  muted?: boolean; 
  volume?: number; 
  isPlaying: boolean;
}

export default function VideoPlayer({ 
  content, 
  isActive, 
  onEnded, 
  muted = true, 
  volume = 1, 
  isPlaying = true 
}: VideoPlayerProps) {
  
  const playerRef = useRef<ReactPlayer>(null);
  
  const onEndedRef = useRef(onEnded);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  const [hasMounted, setHasMounted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  // Volumen interno real que se aplica al player
  const [internalVolume, setInternalVolume] = useState(0);

  const durationRef = useRef<number>(0);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isArticle = useMemo(() => {
    if (!content) return false;
    return 'url_slide' in content || !('url' in content);
  }, [content]);

  const articleData = isArticle ? (content as Article) : null;
  const videoData = !isArticle ? (content as Video) : null;
  
  const contentId = isArticle ? articleData?.id : videoData?.url;

  const slideUrl = useMemo(() => {
    if (!articleData || !articleData.url_slide) return null;
    return `${articleData.url_slide}?autoplay=1&mute=0&t=${new Date().getTime()}`;
  }, [articleData?.url_slide, articleData?.id]);

  // --- RESETEO E INICIO (FADE IN) ---
  useEffect(() => {
    setIsFadingOut(false);
    setIsIframeLoaded(false);
    durationRef.current = 0;
    
    // Al cambiar video, reseteamos a 0 para asegurar Fade In
    setInternalVolume(0); 
  }, [contentId]); 

  // --- MAQUINA DE SUAVIZADO DE AUDIO (FADE IN / FADE OUT) ---
  useEffect(() => {
    // Definimos el objetivo:
    // Si el usuario muteó globalmente -> 0
    // Si estamos en Fade Out (final del video) -> 0
    // Si no -> volumen deseado (1)
    let target = muted ? 0 : volume;
    if (isFadingOut) target = 0;

    // Si ya estamos cerca del objetivo, no hacemos nada
    if (Math.abs(internalVolume - target) < 0.01) return;

    const DURATION = 500; // 0.5s duración del fade
    const INTERVAL = 50;  // updates cada 50ms
    const STEPS = DURATION / INTERVAL; 
    
    const diff = target - internalVolume;
    const stepAmount = diff / STEPS;

    const timer = setInterval(() => {
      setInternalVolume(prev => {
        const next = prev + stepAmount;
        // Evitamos pasarnos del objetivo
        if ((stepAmount > 0 && next >= target) || (stepAmount < 0 && next <= target)) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [volume, internalVolume, muted, isFadingOut]); 


  // --- TIEMPOS ESTRICTOS (SLIDES) ---
  useEffect(() => {
    if (!isArticle || !articleData || !isActive) return;

    const exactDurationSeconds = articleData.animation_duration || 15;
    const exactDurationMs = exactDurationSeconds * 1000;
    const fadeOutTimeMs = Math.max(0, exactDurationMs - 500);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true); // Esto activará el Fade Out de audio en el useEffect de arriba
    }, fadeOutTimeMs);

    const endTimer = setTimeout(() => {
      if (onEndedRef.current) onEndedRef.current();
    }, exactDurationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [articleData?.id, isArticle, isActive]); 

  const handleDuration = (duration: number) => {
    durationRef.current = duration;
  };

  const handleProgress = (state: OnProgressProps) => {
    if (!durationRef.current) return;
    const timeLeft = durationRef.current - state.playedSeconds;
    
    // Activar Fade Out al final del video
    if (timeLeft < 0.6 && !isFadingOut) setIsFadingOut(true);
    if (timeLeft < 0.2) onEnded();
  };

  if (!hasMounted || !content) return <div className="w-full h-full bg-black" />;

  const transitionClass = cn(
    "w-full h-full transition-opacity duration-500 ease-in-out",
    isFadingOut ? "opacity-0" : "opacity-100"
  );

  // VIDEO RENDER
  if (!isArticle && videoData) {
    return (
      <div className="w-full h-full bg-black overflow-hidden relative">
        <div className={transitionClass}>
          <ReactPlayer
            ref={playerRef}
            url={videoData.url}
            width="100%"
            height="100%"
            playing={isActive && isPlaying}
            // El mute real se controla via volumen 0
            muted={false} 
            // Usamos internalVolume que hace la transición suave
            volume={internalVolume} 
            onDuration={handleDuration}       
            onProgress={handleProgress}       
            onEnded={onEnded}                 
            playsinline={true} 
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, fs: 0, disablekb: 1,
                  origin: typeof window !== 'undefined' ? window.location.origin : undefined
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  // SLIDE RENDER
  if (isArticle && slideUrl) {
    return (
      <div className="w-full h-full bg-black overflow-hidden relative">
        <iframe
            key={articleData?.id} 
            src={slideUrl}
            className={cn(
              "w-full h-full border-0 pointer-events-none transition-opacity duration-500",
              (isIframeLoaded && !isFadingOut) ? "opacity-100" : "opacity-0"
            )}
            scrolling="no"
            title={articleData?.titulo}
            loading="eager"
            allow="accelerometer; autoplay *; camera *; encrypted-media *; fullscreen *; gyroscope; microphone *; picture-in-picture *; web-share *"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            onLoad={() => setIsIframeLoaded(true)}
        />
      </div>
    );
  }

  return <div className="w-full h-full bg-black" />;
}