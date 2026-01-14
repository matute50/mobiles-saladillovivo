'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  content: Video | Article;
  shouldPlay: boolean; 
  onEnded: () => void;
  onStart?: () => void;
  muted: boolean;
}

export default function VideoPlayer({ content, shouldPlay, onEnded, onStart, muted }: VideoPlayerProps) {
  const [volume, setVolume] = useState(0); 
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Referencias para timers que permiten cancelación y reprogramación dinámica
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isArticle = 'url_slide' in content || !('url' in content);
  const articleData = isArticle ? (content as Article) : null;
  const videoData = !isArticle ? (content as Video) : null;

  // --- LÓGICA DE CIERRE (onEnded con FadeOut previo) ---
  const triggerEnd = useCallback(() => {
    setIsFadingOut(true);
    // 500ms de gracia para el fade out antes de notificar al MediaPlayerContext
    setTimeout(() => onEnded(), 500);
  }, [onEnded]);

  // --- PROGRAMACIÓN DINÁMICA DE DURACIÓN ---
  const scheduleTimers = useCallback((seconds: number) => {
    // Limpiar timers previos si existen
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (endTimerRef.current) clearTimeout(endTimerRef.current);

    const ms = seconds * 1000;
    
    // Timer para iniciar el Fade Out visual (0.5s antes del fin)
    fadeTimerRef.current = setTimeout(() => {
      setIsFadingOut(true);
    }, Math.max(0, ms - 500));

    // Timer para disparar el evento de fin de contenido
    endTimerRef.current = setTimeout(() => {
      onEnded();
    }, ms);
  }, [onEnded]);

  // --- LISTENER DE POSTMESSAGE ---
  useEffect(() => {
    if (!isArticle || !shouldPlay) return;

    const handleMessage = (event: MessageEvent) => {
      // Validación básica de estructura de datos
      const { data } = event;
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'SET_SLIDE_DURATION':
          if (typeof data.durationSeconds === 'number' && data.durationSeconds > 0) {
            console.log(`[Slide] Nueva duración recibida: ${data.durationSeconds}s`);
            scheduleTimers(data.durationSeconds);
          }
          break;

        case 'SLIDE_ENDED':
          console.log(`[Slide] Solicitud de finalización inmediata`);
          triggerEnd();
          break;
        
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isArticle, shouldPlay, scheduleTimers, triggerEnd]);

  // --- EFECTO INICIAL (BD Fallback) ---
  useEffect(() => {
    if (isArticle && shouldPlay) {
      setIsFadingOut(false);
      const initialDuration = articleData?.animation_duration || 15;
      scheduleTimers(initialDuration);
    }
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, [isArticle, shouldPlay, articleData, scheduleTimers]);

  // --- LÓGICA DE VOLUMEN (Solo para Videos) ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (shouldPlay && !muted && !isArticle) {
      setVolume(0); 
      let currentVol = 0;
      interval = setInterval(() => {
        currentVol += 0.05; 
        if (currentVol >= 1) { currentVol = 1; clearInterval(interval!); }
        setVolume(currentVol);
      }, 50); 
    } else if (muted) {
      setVolume(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [shouldPlay, muted, isArticle]);

  // === RENDER: SLIDE HTML ===
  if (isArticle && articleData?.url_slide) {
    return (
      <div className={cn("w-full h-full bg-black transition-opacity duration-500", isFadingOut ? "opacity-0" : "opacity-100")}>
        <iframe 
          src={articleData.url_slide}
          className="w-full h-full border-0"
          scrolling="no"
          allow="autoplay; fullscreen"
          // Mantenemos allow-scripts para que el postMessage funcione
          sandbox="allow-scripts allow-forms allow-presentation" 
          onLoad={() => { if(onStart) onStart(); }}
          title="Saladillo Vivo News Slide"
        />
      </div>
    );
  }

  // === RENDER: YOUTUBE PLAYER ===
  if (videoData) {
    return (
      <ReactPlayer
        url={videoData.url}
        width="100%" height="100%"
        playing={shouldPlay} 
        muted={muted}
        volume={volume}
        onEnded={onEnded}
        onStart={onStart}
        plays