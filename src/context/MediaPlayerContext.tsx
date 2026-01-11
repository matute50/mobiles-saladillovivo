'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Video, Article, PageData } from '@/lib/types';

// LISTA DE INTROS LOCALES (Deben existir en public/videos_intro/)
const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4',
  '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4',
];

type MediaType = 'VIDEO' | 'NEWS' | 'INTRO';

interface MediaPlayerState {
  currentContent: Video | Article | null; // El contenido real (YouTube/Slide)
  currentIntro: string | null;            // La URL del intro actual
  isIntroVisible: boolean;                // Si el intro está tapando al contenido
  isContentPlaying: boolean;              // Estado del contenido de fondo
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
  videoPool: Video[];
  setVideoPool: (videos: Video[]) => void;
  playManual: (item: Video | Article) => void; // Usuario elige
  handleContentEnded: () => void;              // Video/Slide terminó
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPool] = useState<Video[]>([]);
  
  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntro: null,
    isIntroVisible: true, // Arranca visible al iniciar la app
    isContentPlaying: false,
  });

  // Ayudante: Elegir Intro Aleatorio
  const getRandomIntro = () => INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)];

  // Ayudante: Elegir Video Aleatorio de la Base
  const getRandomVideo = useCallback(() => {
    if (videoPool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * videoPool.length);
    return videoPool[randomIndex];
  }, [videoPool]);

  // --- LÓGICA CORE: EJECUTAR TRANSICIÓN ---
  const triggerTransition = useCallback((nextContent: Video | Article | null) => {
    if (!nextContent) return;

    // 1. Preparamos el Intro
    const newIntro = getRandomIntro();

    setState(prev => ({
      ...prev,
      isIntroVisible: true,     // Mostramos capa superior
      currentIntro: newIntro,   // Seteamos video intro
      isContentPlaying: false   // Pausamos lógica de fondo momentáneamente
    }));

    // 2. Inmediatamente cargamos el contenido de fondo (YouTube/Slide)
    // El objetivo es que YouTube empiece a cargar MIENTRAS el intro se ve.
    setState(prev => ({
      ...prev,
      currentContent: nextContent,
      isContentPlaying: true // Damos play al de fondo (YouTube iniciará autoplay)
    }));

    // 3. A los 4 segundos exactos, quitamos el Intro
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isIntroVisible: false
      }));
    }, 4000);

  }, []);

  // CASO 1: INICIO DE APLICACIÓN
  // Cuando se cargan los videos por primera vez, arrancamos el ciclo.
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
      console.log("🚀 [Context] Inicio de App: Disparando Intro + Primer Video Random");
      const firstVideo = getRandomVideo();
      triggerTransition(firstVideo);
    }
  }, [videoPool, getRandomVideo, triggerTransition, state.currentContent]);

  // CASO 2: USUARIO ELIGE VIDEO (CARRUSEL)
  const playManual = (item: Video | Article) => {
    console.log("👆 [Context] Selección Manual: Disparando Intro + Video Elegido");
    triggerTransition(item);
  };

  // CASO 3 & 4: TERMINÓ VIDEO O SLIDE (AUTO-AVANCE)
  const handleContentEnded = () => {
    console.log("🏁 [Context] Contenido Finalizado: Disparando Intro + Video Random");
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