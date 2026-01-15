'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4',
];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';

// Configuración de Memoria de Inicio
const START_HISTORY_KEY = 'sv_start_history_4d';
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

interface MediaPlayerState {
  currentContent: Video | Article | null;
  currentIntroUrl: string | null;
  isIntroVisible: boolean;
  shouldPlayContent: boolean;
}

interface HistoryItem {
  id: string;
  timestamp: number;
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
  videoPool: Video[];
  setVideoPool: (videos: Video[]) => void;
  playManual: (item: Video | Article) => void;
  handleIntroEnded: () => void;
  handleContentEnded: () => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPool] = useState<Video[]>([]);
  const isInitialVideoPicked = useRef(false);
  const lastCategoryRef = useRef<string>('');
  
  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntroUrl: null,
    isIntroVisible: true,
    shouldPlayContent: false,
  });

  // 1. Obtener IDs del historial de inicio directamente del localStorage (Síncrono)
  const getViewedStartIds = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(START_HISTORY_KEY);
      if (!saved) return [];
      const parsed: HistoryItem[] = JSON.parse(saved);
      const now = Date.now();
      // Solo devolvemos IDs que tengan menos de 4 días
      return parsed.filter(item => (now - item.timestamp) < FOUR_DAYS_MS).map(h => h.id);
    } catch (e) {
      return [];
    }
  }, []);

  // 2. Guardar el video elegido como "inicio" en el localStorage
  const saveStartVideo = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(START_HISTORY_KEY);
      let history: HistoryItem[] = saved ? JSON.parse(saved) : [];
      const now = Date.now();
      
      // Limpiamos viejos y agregamos el nuevo
      history = history.filter(item => item.id !== id && (now - item.timestamp) < FOUR_DAYS_MS);
      history.push({ id, timestamp: now });
      
      localStorage.setItem(START_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}
  }, []);

  // 3. Selección de video
  const getNextVideo = useCallback((isFirstVideo: boolean = false) => {
    if (videoPool.length === 0) return null;

    // Si es el primero de la sesión, leemos el historial directamente del disco
    const startIds = isFirstVideo ? getViewedStartIds() : [];

    let candidates = videoPool.filter(v => {
      const cat = v.categoria.toUpperCase();
      const isHCD = cat.includes('HCD'); // Filtro estricto para HCD
      
      if (isFirstVideo) {
        // Al inicio: No HCD y no haber sido "inicio" en los últimos 4 días
        return !isHCD && !startIds.includes(v.id);
      }
      // En reproducción normal: No HCD y no repetir la misma categoría seguida
      return !isHCD && v.categoria !== lastCategoryRef.current;
    });

    // Fallback: Si todos los videos ya fueron inicio en los últimos 4 días,
    // elegimos cualquier video (que no sea HCD) para no romper la app.
    if (candidates.length === 0) {
      candidates = videoPool.filter(v => !v.categoria.toUpperCase().includes('HCD'));
    }

    // Selección aleatoria real sobre los candidatos
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    if (selected) lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool, getViewedStartIds]);

  const startTransition = useCallback((nextContent: Video | Article) => {
    const isNews = 'url_slide' in nextContent || !('url' in nextContent);
    const nextIntro = isNews ? NEWS_INTRO_VIDEO : INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)];
    
    setState({
      currentContent: nextContent,
      currentIntroUrl: nextIntro,
      isIntroVisible: true,
      shouldPlayContent: true,
    });
  }, []);

  const handleIntroEnded = useCallback(() => {
    setState(prev => ({ ...prev, isIntroVisible: false }));
  }, []);

  const handleContentEnded = useCallback(() => {
    const next = getNextVideo(false); 
    if (next) startTransition(next);
  }, [getNextVideo, startTransition]);

  const playManual = useCallback((item: Video | Article) => {
    startTransition(item);
  }, [startTransition]);

  // EL DISPARADOR: Solo se ejecuta una vez cuando el pool de videos está listo
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent && !isInitialVideoPicked.current) {
      const first = getNextVideo(true); 
      if (first) {
        isInitialVideoPicked.current = true;
        saveStartVideo(first.id); // Guardamos en el acto
        startTransition(first);
      }
    }
  }, [videoPool, state.currentContent, getNextVideo, startTransition, saveStartVideo]);

  return (
    <MediaPlayerContext.Provider value={{ state, videoPool, setVideoPool, playManual, handleIntroEnded, handleContentEnded }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export const useMediaPlayer = () => {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error('useMediaPlayer error');
  return context;
};