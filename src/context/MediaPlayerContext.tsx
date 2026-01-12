'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Video, Article, PageData } from '@/lib/types';

// LISTA DE INTROS LOCALES
const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4',
  '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4',
  '/videos_intro/intro4.mp4',
  '/videos_intro/intro5.mp4',
];

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
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPool] = useState<Video[]>([]);
  
  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntro: null,
    isIntroVisible: true, // Arranca visible
    isContentPlaying: false,
  });

  const getRandomIntro = () => INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)];

  const getRandomVideo = useCallback(() => {
    if (videoPool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * videoPool.length);
    return videoPool[randomIndex];
  }, [videoPool]);

  // --- TRANSICIÓN ROBUSTA ---
  const triggerTransition = useCallback((nextContent: Video | Article | null) => {
    if (!nextContent) return;

    const newIntro = getRandomIntro();

    // 1. Iniciar Intro y Cargar Contenido (Muteado)
    setState(prev => ({
      ...prev,
      isIntroVisible: true,
      currentIntro: newIntro,
      currentContent: nextContent,
      isContentPlaying: true // IMPORTANTE: True para que YouTube empiece a cargar en background
    }));

    // 2. Ocultar Intro después de 4 segundos
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isIntroVisible: false
      }));
    }, 4000);

  }, []);

  // INICIO AUTOMÁTICO
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
      const firstVideo = getRandomVideo();
      triggerTransition(firstVideo);
    }
  }, [videoPool, getRandomVideo, triggerTransition, state.currentContent]);

  const playManual = (item: Video | Article) => {
    triggerTransition(item);
  };

  const handleContentEnded = () => {
    const nextRandom = getRandomVideo();
    triggerTransition(nextRandom);
  };

  return (
    <MediaPlayerContext.Provider value={{ 
      state, 
      videoPool, 
      setVideoPool, 
      playManual, 
      handleContentEnded 
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