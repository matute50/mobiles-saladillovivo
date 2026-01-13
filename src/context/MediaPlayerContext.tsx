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
  nextContent: Video | Article | null; // Precarga lógica
  currentIntroUrl: string | null;
  isIntroActive: boolean; // Si la intro se está reproduciendo (Capa Superior)
  isContentReadyToPlay: boolean; // Señal para dar Play al contenido de abajo (Capa Inferior)
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
  videoPool: Video[];
  setVideoPool: (videos: Video[]) => void;
  playManual: (item: Video | Article) => void;
  handleIntroProgress: (remainingTime: number) => void; // Comunicación Intro -> Contexto
  handleIntroEnded: () => void;
  handleContentEnded: () => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPool] = useState<Video[]>([]);
  const lastCategoryRef = useRef<string>(''); // Para evitar categorías repetidas
  const interruptedVideoRef = useRef<Video | null>(null); // Para volver al video si se ve una noticia

  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    nextContent: null,
    currentIntroUrl: null,
    isIntroActive: true,
    isContentReadyToPlay: false,
  });

  // --- 1. LÓGICA DE SELECCIÓN (Regla de Oro: No HCD, Categoría Distinta) ---
  const getNextRandomVideo = useCallback(() => {
    if (videoPool.length === 0) return null;

    // A. Filtrar prohibidos y repetidos de categoría
    let validVideos = videoPool.filter(v => 
      v.categoria !== FORBIDDEN_CATEGORY && 
      v.categoria !== lastCategoryRef.current
    );

    // Si el filtro es muy estricto y nos quedamos sin videos, relajamos la categoría anterior
    // pero mantenemos la prohibición de HCD.
    if (validVideos.length === 0) {
       validVideos = videoPool.filter(v => v.categoria !== FORBIDDEN_CATEGORY);
    }
    
    if (validVideos.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * validVideos.length);
    const selected = validVideos[randomIndex];
    
    // Guardar categoría para la próxima
    lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool]);

  // --- 2. INICIAR TRANSICIÓN ---
  const startTransition = useCallback((content: Video | Article, isResume = false) => {
    const isNews = 'url_slide' in content || !('url' in content);
    
    // Si es noticia usamos el video específico, si no, uno al azar
    const introUrl = isNews ? NEWS_INTRO_VIDEO : INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)];

    setState({
      currentContent: content, // Esto monta el componente abajo (Z-10)
      nextContent: null,
      currentIntroUrl: introUrl,
      isIntroActive: true, // Esto muestra la intro arriba (Z-20)
      isContentReadyToPlay: false, // Esperando señal de tiempo (4s antes)
    });

  }, []);

  // --- 3. INTERACCIÓN MANUAL (Carrusel / Click Noticia) ---
  const playManual = useCallback((item: Video | Article) => {
    const isNews = 'url_slide' in item || !('url' in item);
    
    if (isNews) {
        // Si reproducimos una noticia manual, guardamos qué video estaba sonando (si era video)
        // para cumplir la regla: "volverá a la producción del video interrumpido"
        if (state.currentContent && 'url' in state.currentContent) {
            interruptedVideoRef.current = state.currentContent as Video;
        }
    } else {
        // Si el usuario elige un video manual, limpiamos la referencia de interrupción
        interruptedVideoRef.current = null;
    }

    startTransition(item);
  }, [state.currentContent, startTransition]);


  // --- 4. GESTIÓN DEL FLUJO "INTRO -> CONTENT" ---
  
  // Llamado por VideoSection cuando a la Intro le faltan X segundos
  const handleIntroProgress = useCallback((remainingTime: number) => {
    // REGLA: Cuando faltan 4 segundos, activamos el play de abajo
    if (remainingTime <= 4.0 && remainingTime > 0) {
        setState(prev => {
            if (!prev.isContentReadyToPlay) {
                return { ...prev, isContentReadyToPlay: true };
            }
            return prev;
        });
    }
  }, []);

  // Llamado cuando la intro termina visualmente
  const handleIntroEnded = useCallback(() => {
    setState(prev => ({ ...prev, isIntroActive: false }));
  }, []);

  // --- 5. FIN DE CONTENIDO (Regla: Loop infinito o volver de noticia) ---
  const handleContentEnded = useCallback(() => {
    // A. Si acabamos de ver una noticia y había un video interrumpido
    if (interruptedVideoRef.current) {
        const resumeVideo = interruptedVideoRef.current;
        interruptedVideoRef.current = null; // Limpiamos
        startTransition(resumeVideo, true);
        return;
    }

    // B. Flujo Normal: Buscar siguiente video aleatorio
    const nextVideo = getNextRandomVideo();
    if (nextVideo) {
        startTransition(nextVideo);
    }
  }, [getNextRandomVideo, startTransition]);

  // Inicio Automático
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
        const first = getNextRandomVideo();
        if (first) startTransition(first);
    }
  }, [videoPool, getNextRandomVideo, startTransition, state.currentContent]);

  return (
    <MediaPlayerContext.Provider value={{ 
      state, 
      videoPool, 
      setVideoPool, 
      playManual,
      handleIntroProgress,
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