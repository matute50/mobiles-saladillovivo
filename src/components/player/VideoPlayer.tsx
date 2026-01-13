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

  useEffect(() => {
    setIsFadingOut(false);
    setIsIframeLoaded(false);
    durationRef.current = 0;
    setInternalVolume(0); 
  }, [contentId]); 

  // --- SUAVIZADO DE VOLUMEN (Fade In / Out) ---
  useEffect(() => {
    let target = muted ? 0 : volume;
    if (isFadingOut) target = 0;

    if (Math.abs(internalVolume - target) < 0.01) return;

    const DURATION = 500; 
    const INTERVAL = 50;  
    const STEPS = DURATION / INTERVAL; 
    
    const diff = target - internalVolume;
    const stepAmount = diff / STEPS;

    const timer = setInterval(() => {
      setInternalVolume(prev => {
        const next = prev + stepAmount;
        if ((stepAmount > 0 && next >= target) || (stepAmount < 0 && next <= target)) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [volume, internalVolume, muted, isFadingOut]); 

  useEffect(() => {
    if (!isArticle || !articleData || !isActive) return;

    const exactDurationSeconds = articleData.animation_duration || 15;
    const exactDurationMs = exactDurationSeconds * 1000;
    const fadeOutTimeMs = Math.max(0, exactDurationMs - 500);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true); 
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
    if (timeLeft < 0.6 && !isFadingOut) setIsFadingOut(true);
    if (timeLeft < 0.2) onEnded();
  };

  if (!hasMounted || !content) return <div className="w-full h-full bg-black" />;

  const transitionClass = cn(
    "w-full h-full transition-opacity duration-500 ease-in-out",
    isFadingOut ? "opacity-0" : "opacity-100"
  );

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
            muted={false} 
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

  if (isArticle && slideUrl) {
    return (
      <div className="w-full h-full bg-black overflow-hidden relative">
        <div className={cn("w-full h-full relative", transitionClass)}>
            
            <iframe
                key={articleData?.id} 
                src={slideUrl}
                className={cn(
                "w-full h-full border-0 pointer-events-none transition-opacity duration-500",
                isIframeLoaded ? "opacity-100" : "opacity-0"
                )}
                scrolling="no"
                title={articleData?.titulo}
                loading="eager"
                allow="accelerometer; autoplay *; camera *; encrypted-media *; fullscreen *; gyroscope; microphone *; picture-in-picture *; web-share *"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                onLoad={() => setIsIframeLoaded(true)}
            />

            {/* TÍTULO GIGANTE SUPERPUESTO */}
            {isIframeLoaded && articleData?.titulo && (
                <div className="absolute inset-0 z-20 flex flex-col justify-end pb-16 px-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
                    <h1 
                        className="text-white text-center font-black uppercase tracking-tight leading-[0.85] drop-shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700"
                        style={{ 
                            fontSize: 'clamp(3.5rem, 8vw, 7rem)', 
                            textShadow: '0 4px 16px rgba(0,0,0,0.9)' 
                        }}
                    >
                        {articleData.titulo}
                    </h1>
                </div>
            )}
        </div>
      </div>
    );
  }

  return <div className="w-full h-full bg-black" />;
}