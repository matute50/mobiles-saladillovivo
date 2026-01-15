'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4',
];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';
const FORBIDDEN_CATEGORY = 'HCD DE SALADILLO - Período 2025';

// Nueva configuración: Memoria de Inicio de 4 días
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
  const [startHistory, setStartHistory] = useState<HistoryItem[]>([]);
  const isInitialVideoPicked = useRef(false);
  const lastCategoryRef = useRef<string>('');
  
  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntroUrl: null,
    isIntroVisible: true,
    shouldPlayContent: false,
  });

  // 1. Cargar y limpiar el historial de "Inicios" al arrancar
  useEffect(() => {
    const saved = localStorage.getItem(START_HISTORY_KEY);
    if (saved) {
      try {
        const parsed: HistoryItem[] = JSON.parse(saved);
        const now = Date.now();
        // Filtramos solo los que ocurrieron en los últimos 4 días
        const freshHistory = parsed.filter(item => (now - item.timestamp) < FOUR_DAYS_MS);
        setStartHistory(freshHistory);
        localStorage.setItem(START_HISTORY_KEY, JSON.stringify(freshHistory));
      } catch (e) {
        console.error("Error al procesar historial de inicio");
      }
    }
  }, []);

  // 2. Registrar el video que sirvió de inicio
  const markAsStartVideo = useCallback((id: string) => {
    const now = Date.now();
    const saved = localStorage.getItem(START_HISTORY_KEY);
    let history: HistoryItem[] = saved ? JSON.parse(saved) : [];
    
    // Evitamos duplicados y actualizamos
    history = history.filter(item => item.id !== id);
    history.push({ id, timestamp: now });
    
    localStorage.setItem(START_HISTORY_KEY, JSON.stringify(history));
    setStartHistory(history);
  }, []);

  // 3. Selección de video
  const getNextVideo = useCallback((isFirstVideo: boolean = false) => {
    if (videoPool.length === 0) return null;

    const startIds = startHistory.map(h => h.id);

    let candidates = videoPool.filter(v => {
      const isForbidden = v.categoria.includes('HCD'); // Filtro categoría HCD
      
      // Si es el primer video de la sesión, aplicamos el filtro de los 4 días
      if (isFirstVideo) {
        return !isForbidden && !startIds.includes(v.id);
      }
      
      // Para el resto, solo evitamos la categoría HCD y la categoría que acaba de sonar
      return !isForbidden && v.categoria !== lastCategoryRef.current;
    });

    // Fallback: Si no hay candidatos (ej. ya se usaron todos como inicio), ignoramos el filtro de 4 días
    if (candidates.length === 0) {
      candidates = videoPool.filter(v => !v.categoria.includes('HCD'));
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    if (selected) lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool, startHistory]);

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
    const next = getNextVideo(false); // Siguiente video normal
    if (next) startTransition(next);
  }, [getNextVideo, startTransition]);

  const playManual = useCallback((item: Video | Article) => {
    startTransition(item);
  }, [startTransition]);

  // Efecto de Inicio de App
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent && !isInitialVideoPicked.current) {
      const first = getNextVideo(true); // Selección con filtro de 4 días
      if (first) {
        isInitialVideoPicked.current = true;
        markAsStartVideo(first.id);
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
  if (!context) throw new Error('useMediaPlayer must be used within MediaPlayerProvider');
  return context;
};