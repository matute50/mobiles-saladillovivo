'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4',
  '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4',
  '/videos_intro/intro4.mp4',
  '/videos_intro/intro5.mp4',
];

const NEWS_INTRO = '/videos_intro/noticias.mp4'; 

interface MediaPlayerState {
  currentContent: Video | Article | null; 
  currentIntro: string | null;            
  isIntroVisible: boolean;                
  isContentPlaying: boolean;              
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
  videoPool: Video[];
  setVideoPool: (videos: Video[]) => void;
  playManual: (item: Video | Article) => void; 
  handleContentEnded: () => void;              
  hideIntro: () => void; 
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPool] = useState<Video[]>([]);
  
  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntro: null,
    isIntroVisible: true, 
    isContentPlaying: false,
  });

  const getRandomIntro = () => INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)];

  const hideIntro = useCallback(() => {
    setState(prev => ({ ...prev, isIntroVisible: false }));
  }, []);

  const triggerTransition = useCallback((nextContent: Video | Article | null) => {
    if (!nextContent) return;

    // DETECCIÓN INTELIGENTE DE INTRO
    const rawSlide = (nextContent as any).url_slide;
    const isSlide = typeof rawSlide === 'string' && rawSlide.trim().length > 0;
    
    // POLÍTICA DE INTROS:
    // 1. Si es Noticia (Slide) -> Intro "Noticias" (Marca)
    // 2. Si es Video -> Intro "Aleatorio" (Variedad)
    const newIntro = isSlide ? NEWS_INTRO : getRandomIntro();

    setState(prev => ({
      ...prev,
      isIntroVisible: true,     // <--- SIEMPRE visible al iniciar nuevo contenido
      currentIntro: newIntro,
      currentContent: nextContent, 
      isContentPlaying: true 
    }));

    // GESTIÓN DE DURACIÓN DEL CONTENIDO
    if (isSlide) {
      // SLIDE: El componente VideoPlayer manejará el tiempo exacto usando animation_duration
      // y llamará a handleContentEnded() cuando termine.
    } else {
      // VIDEO: Solo controlamos el tiempo del intro (4s), el video dura lo que dura.
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isIntroVisible: false
        }));
      }, 4000);
    }

  }, []);

  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
      const firstVideo = videoPool[Math.floor(Math.random() * videoPool.length)];
      triggerTransition(firstVideo);
    }
  }, [videoPool, triggerTransition, state.currentContent]);

  const playManual = (item: Video | Article) => {
    triggerTransition(item);
  };

  const handleContentEnded = () => {
    if (videoPool.length === 0) return;
    // Selección aleatoria del siguiente contenido
    const nextRandom = videoPool[Math.floor(Math.random() * videoPool.length)];
    // Transición inmediata
    triggerTransition(nextRandom);
  };

  return (
    <MediaPlayerContext.Provider value={{ 
      state, videoPool, setVideoPool, playManual, handleContentEnded, hideIntro 
    }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error('useMediaPlayer debe usarse dentro de MediaPlayerProvider');
  return context;
}