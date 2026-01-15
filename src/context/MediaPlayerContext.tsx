'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4',
];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';
const FORBIDDEN_KEYWORD = 'HCD'; // Filtro estricto para cualquier categoría que contenga HCD

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

  // Función para obtener el historial directamente del localStorage (Sin esperar al estado)
  const getFreshHistory = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(START_HISTORY_KEY);
      if (!saved) return [];
      const parsed: HistoryItem[] = JSON.parse(saved);
      const now = Date.now();
      // Filtrar vencidos
      const fresh = parsed.filter(item => (now - item.timestamp) < FOUR_DAYS_MS);
      return fresh.map(h => h.id);
    } catch (e) {
      return [];
    }
  }, []);

  // Función para guardar en el historial
  const markAsStartVideo = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(START_HISTORY_KEY);
      let history: HistoryItem[] = saved ? JSON.parse(saved) : [];
      const now = Date.now();
      
      history = history.filter(item => item.id !== id && (now - item.timestamp) < FOUR_DAYS_MS);
      history.push({ id, timestamp: now });
      
      localStorage.setItem(START_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}
  }, []);

  // Motor de selección
  const getNextVideo = useCallback((isFirstVideo: boolean = false) => {
    if (videoPool.length === 0) return null;

    // Si es el primero, leemos el historial directamente del disco
    const viewedIds = isFirstVideo ? getFreshHistory() : [];

    let candidates = videoPool.filter(v => {
      const isHCD = v.categoria.toUpperCase().includes(FORBIDDEN_KEYWORD);
      if (isFirstVideo) {
        // Al inicio: No HCD y no estar en el historial de 4 días
        return !isHCD && !viewedIds.includes(v.id);
      }
      // En reproducción automática: No HCD y no repetir categoría anterior
      return !isHCD && v.categoria !== lastCategoryRef.current;
    });

    // Fallback: Si el filtro es demasiado estricto y nos quedamos sin videos, 
    // relajamos la regla pero mantenemos la prohibición de HCD.
    if (candidates.length === 0) {
      candidates = videoPool.filter(v => !v.categoria.toUpperCase().includes(FORBIDDEN_KEYWORD));
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    if (selected) lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool, getFreshHistory]);

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

  // EL CORAZÓN DE LA SOLUCIÓN:
  // Este efecto solo corre cuando el pool de videos está listo.
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent && !isInitialVideoPicked.current) {
      const first = getNextVideo(true); 
      if (first) {
        isInitialVideoPicked.current = true;
        markAsStartVideo(first.id); // Guardamos inmediatamente
        startTransition(first);
      }
    }
  }, [videoPool, state.currentContent, getNextVideo, startTransition, markAsStartVideo]);

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