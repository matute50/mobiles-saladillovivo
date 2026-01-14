'use client';

import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  content: Video | Article;
  shouldPlay: boolean; 
  onEnded: () => void;
  muted: boolean;
}

export default function VideoPlayer({ content, shouldPlay, onEnded, muted }: VideoPlayerProps) {
  const [volume, setVolume] = useState(0); 
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  const isArticle = 'url_slide' in content || !('url' in content);
  const articleData = isArticle ? (content as Article) : null;
  const videoData = !isArticle ? (content as Video) : null;

  // Reset de estados
  useEffect(() => {
    setIsFadingOut(false);
    setVolume(0);
  }, [content]);

  // --- LÓGICA DE FADE IN & LIMPIEZA ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (shouldPlay && !muted && !isArticle) {
      setVolume(0); 
      let currentVol = 0;
      interval = setInterval(() => {
        currentVol += 0.05; 
        if (currentVol >= 1) {
          currentVol = 1;
          if (interval) clearInterval(interval);
        }
        setVolume(currentVol);
      }, 50); 
    } else if (muted) {
      setVolume(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [shouldPlay, muted, isArticle]);

  // --- LÓGICA MAESTRA DEL SLIDE (Noticias) ---
  useEffect(() => {
    let fadeTimer: NodeJS.Timeout | null = null;
    let endTimer: NodeJS.Timeout | null = null;

    if (isArticle && shouldPlay) {
      const exactDurationSeconds = articleData?.animation_duration || 15;
      const exactDurationMs = exactDurationSeconds * 1000;
      
      // Timer A: Fade Out
      const fadeOutTime = Math.max(0, exactDurationMs - 500);
      fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, fadeOutTime);

      // Timer B: Fin del Show
      endTimer = setTimeout(() => {
        onEnded(); 
      }, exactDurationMs);
    }

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      if (endTimer) clearTimeout(endTimer);
    };
  }, [isArticle, shouldPlay, articleData, onEnded]);


  // === RENDER: NOTICIA HTML (SLIDE) ===
  if (isArticle && articleData?.url_slide) {
    return (
      <div className={cn(
        "w-full h-full bg-black transition-opacity duration-500 ease-in-out",
        isFadingOut ? "opacity-0" : "opacity-100"
      )}>
        <iframe 
          src={articleData.url_slide}
          className="w-full h-full border-0"
          scrolling="no"
          // CRÍTICO: 'autoplay' permite el audio. 'sandbox' mantiene seguridad.
          allow="autoplay; fullscreen; picture-in-picture"
          sandbox="allow-scripts allow-forms allow-presentation" 
          title="Noticia Slide"
        />
      </div>
    );
  }

  // === RENDER: VIDEO YOUTUBE ===
  if (videoData) {
    return (
      <ReactPlayer
        url={videoData.url}
        width="100%"
        height="100%"
        playing={shouldPlay} 
        muted={muted}
        volume={volume}
        onEnded={onEnded}
        playsinline={true} 
        config={{
          youtube: {
            playerVars: {
              autoplay: 1,
              controls: 0,      
              modestbranding: 1,
              rel: 0,           
              showinfo: 0,
              iv_load_policy: 3,
              fs: 0,
              disablekb: 1,     
              origin: typeof window !== 'undefined' ? window.location.origin : undefined
            }
          }
        }}
      />
    );
  }

  return null;
}