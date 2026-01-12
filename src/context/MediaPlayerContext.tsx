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

// Intro específico para slides de noticias
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

  // Función para forzar el ocultamiento del intro (usada por los Slides al cargar)
  const hideIntro = useCallback(() => {
    setState(prev => ({ ...prev, isIntroVisible: false }));
  }, []);

  // --- FUNCIÓN PRINCIPAL DE TRANSICIÓN ---
  const triggerTransition = useCallback((nextContent: Video | Article | null) => {
    if (!nextContent) return;

    // 1. DETECTAR SI ES NOTICIA
    // Verificamos si tiene la propiedad 'url_slide' o si NO tiene 'url' de video
    const isArticle = 'url_slide' in nextContent || !('url' in nextContent);
    
    // 2. ELEGIR EL INTRO CORRECTO
    // Si es noticia -> NEWS_INTRO. Si es video -> Random.
    const newIntro = isArticle ? NEWS_INTRO : getRandomIntro();

    console.log("🔄 [Transition] Nuevo contenido:", isArticle ? "NOTICIA" : "VIDEO");
    console.log("🎬 [Transition] Intro seleccionado:", newIntro);

    // 3. ACTUALIZAR ESTADO
    setState(prev => ({
      ...prev,
      isIntroVisible: true, // Mostramos intro
      currentIntro: newIntro,
      currentContent: nextContent, // Ponemos EXACTAMENTE lo que tocó el usuario
      isContentPlaying: true 
    }));

    // 4. GESTIÓN DE TIEMPO DEL INTRO
    if (isArticle) {
      // CASO NOTICIA:
      // NO ponemos timeout. El intro se quedará en loop (gracias a VideoSection)
      // hasta que el slide cargue y llame a hideIntro().
    } else {
      // CASO VIDEO:
      // Ponemos un timeout fijo de 4 segundos para ocultar el intro.
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isIntroVisible: false
        }));
      }, 4000);
    }

  }, []);

  // Inicio Automático (Solo si no hay nada reproduciendo)
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
      const firstVideo = videoPool[Math.floor(Math.random() * videoPool.length)];
      triggerTransition(firstVideo);
    }
  }, [videoPool, triggerTransition, state.currentContent]);

  // Selección Manual del Usuario (Clic en Noticia o Video)
  const playManual = (item: Video | Article) => {
    // Pasamos directamente el item clickeado a la transición
    triggerTransition(item);
  };

  // Cuando termina un contenido, pasamos a uno random
  const handleContentEnded = () => {
    if (videoPool.length === 0) return;
    const nextRandom = videoPool[Math.floor(Math.random() * videoPool.length)];
    triggerTransition(nextRandom);
  };

  return (
    <MediaPlayerContext.Provider value={{ 
      state, 
      videoPool, 
      setVideoPool, 
      playManual, 
      handleContentEnded,
      hideIntro 
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