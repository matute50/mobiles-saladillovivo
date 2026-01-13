'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4',
  '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4',
  '/videos_intro/intro4.mp4',
  '/videos_intro/intro5.mp4',
];

const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';
const FORBIDDEN_CATEGORY = 'HCD DE SALADILLO - Período 2025';

interface MediaPlayerState {
  currentContent: Video | Article | null;
  currentIntroUrl: string | null;
  isIntroVisible: boolean;      // Controla la visibilidad de la Capa Z-40
  shouldPlayContent: boolean;   // Controla el Play de la Capa Z-10 (Turno Único)
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
  videoPool: Video[];
  setVideoPool: (videos: Video[]) => void;
  playManual: (item: Video | Article) => void;
  handleIntroEnded: () => void;   // El Intro terminó, dar paso al contenido
  handleContentEnded: () => void; // El contenido terminó, iniciar nuevo ciclo
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPool] = useState<Video[]>([]);
  const lastCategoryRef = useRef<string>('');

  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntroUrl: null,
    isIntroVisible: true,
    shouldPlayContent: false, // REGLA DE ORO: Empieza en falso, esperamos al Intro
  });

  // --- 1. SELECCIÓN ALEATORIA INTELIGENTE ---
  const getNextRandomVideo = useCallback(() => {
    if (videoPool.length === 0) return null;

    // A. Filtrar prohibidos y repetidos de categoría inmediata
    let validVideos = videoPool.filter(v => 
      v.categoria !== FORBIDDEN_CATEGORY && 
      v.categoria !== lastCategoryRef.current
    );

    // B. Fallback: Si no hay de otra categoría, solo respetar la prohibición de HCD
    if (validVideos.length === 0) {
       validVideos = videoPool.filter(v => v.categoria !== FORBIDDEN_CATEGORY);
    }
    
    if (validVideos.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * validVideos.length);
    const selected = validVideos[randomIndex];
    lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool]);

  // --- 2. MOTOR DE TRANSICIÓN ---
  const startTransition = useCallback((nextContent: Video | Article) => {
    const isNews = 'url_slide' in nextContent || !('url' in nextContent);
    const nextIntro = isNews ? NEWS_INTRO_VIDEO : INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)];

    setState({
      currentContent: nextContent,
      currentIntroUrl: nextIntro,
      isIntroVisible: true,     // Capa Intro Activa
      shouldPlayContent: false, // Capa Contenido PAUSADA (Turno Único)
    });
  }, []);

  // --- 3. HANDSHAKE: FIN DE INTRO ---
  const handleIntroEnded = useCallback(() => {
    // El intro terminó: Ocultamos capa Z-40 y damos luz verde a Z-10
    setState(prev => ({
      ...prev,
      isIntroVisible: false,
      shouldPlayContent: true 
    }));
  }, []);

  // --- 4. FIN DE CICLO (LOOP) ---
  const handleContentEnded = useCallback(() => {
    // Buscar siguiente video
    const nextVideo = getNextRandomVideo();
    if (nextVideo) {
      startTransition(nextVideo);
    }
  }, [getNextRandomVideo, startTransition]);

  // --- 5. INTERACCIÓN MANUAL ---
  const playManual = useCallback((item: Video | Article) => {
    startTransition(item);
  }, [startTransition]);

  // --- 6. COLD START (Autoplay Inicial) ---
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
      const firstVideo = getNextRandomVideo();
      if (firstVideo) startTransition(firstVideo);
    }
  }, [videoPool, getNextRandomVideo, startTransition, state.currentContent]);

  return (
    <MediaPlayerContext.Provider value={{ 
      state, 
      videoPool, 
      setVideoPool, 
      playManual,
      handleIntroEnded,
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