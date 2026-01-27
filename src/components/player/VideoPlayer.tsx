'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface VideoPlayerProps {
  content: Video | Article | null; 
  shouldPlay: boolean; 
  onEnded: () => void;
  onStart?: () => void;
  muted: boolean;
}

export default function VideoPlayer({ content, shouldPlay, onEnded, onStart, muted }: VideoPlayerProps) {
  const [volume, setVolume] = useState(0); 
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false); 
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- CLÁUSULA DE SEGURIDAD TOTAL ---
  // Si content es null o undefined, devolvemos un fondo negro y salimos.
  if (!content) {
    return <div className="w-full h-full bg-black" />;
  }

  // Ahora es seguro usar el operador 'in'
  const isArticle = 'url_slide' in content || !('url' in content);
  const articleData = isArticle ? (content as Article) : null;
  const videoData = !isArticle ? (content as Video) : null;

  const { play: playAudio, pause: pauseAudio } = useAudioPlayer(articleData?.audio_url || null);

  const triggerEnd = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => onEnded(), 500);
  }, [onEnded]);

  useEffect(() => {
    setIsFadingOut(false);
    setIsPlayerReady(false);
  }, [content]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (shouldPlay && !muted && !isArticle && isPlayerReady) {
      setVolume(0); 
      let currentVol = 0;
      interval = setInterval(() => {
        currentVol += 0.05; 
        if (currentVol >= 1) { 
          currentVol = 1; 
          if(interval) clearInterval(interval); 
        }
        setVolume(currentVol);
      }, 50); 
    } else if (muted) setVolume(0);
    return () => { if (interval) clearInterval(interval); };
  }, [shouldPlay, muted, isArticle, isPlayerReady]);

  useEffect(() => {
    if (isArticle && shouldPlay && !isFadingOut) {
      playAudio();
      const duration = (articleData?.animation_duration || 45) * 1000;
      fadeTimerRef.current = setTimeout(() => triggerEnd(), duration);
    } else {
      pauseAudio();
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    }
    return () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current); };
  }, [isArticle, shouldPlay, isFadingOut, playAudio, pauseAudio, articleData, triggerEnd]);

  if (isArticle && articleData?.url_slide) {
    return (
      <div className={cn("w-full h-full bg-black transition-opacity duration-500", isFadingOut ? "opacity-0" : "opacity-100")}>
        <iframe 
          src={articleData.url_slide} 
          className="w-full h-full border-0" 
          scrolling="no" 
          allow="autoplay; fullscreen" 
          sandbox="allow-scripts allow-forms allow-presentation" 
          onLoad={onStart} 
        />
      </div>
    );
  }

  if (videoData) {
    return (
      <ReactPlayer
        url={videoData.url} 
        width="100%" 
        height="100%"
        playing={shouldPlay && !isFadingOut}
        volume={volume}
        muted={muted}
        onEnded={triggerEnd}
        onStart={onStart}
        onReady={() => setIsPlayerReady(true)}
        config={{
          youtube: {
            playerVars: { 
              modestbranding: 1, 
              controls: 0, 
              showinfo: 0, 
              rel: 0,
              // Corrección para el error de postMessage
              origin: typeof window !== 'undefined' ? window.location.origin : '' 
            }
          }
        }}
      />
    );
  }

  return <div className="w-full h-full bg-black" />;
}