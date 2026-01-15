'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4',
];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';
const FORBIDDEN_CATEGORY = 'HCD DE SALADILLO - Período 2025';
const VIEWED_HISTORY_KEY = 'sv_viewed_history_7d';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const lastCategoryRef = useRef<string>('');
  
  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntroUrl: null,
    isIntroVisible: true,
    shouldPlayContent: false,
  });

  // 1. Cargar y limpiar historial del dispositivo (Memoria de 7 días)
  useEffect(() => {
    const saved = localStorage.getItem(VIEWED_HISTORY_KEY);
    if (saved) {
      try {
        const parsed: HistoryItem[] = JSON.parse(saved);
        const now = Date.now();
        // Solo conservamos los videos vistos en la última semana
        const freshHistory = parsed.filter(item => (now - item.timestamp) < SEVEN_DAYS_MS);
        setHistory(freshHistory);
        localStorage.setItem(VIEWED_HISTORY_KEY, JSON.stringify(freshHistory));
      } catch (e) {
        console.error("Error al cargar el historial de reproducción");
      }
    }
  }, []);

  // 2. Función para registrar videos en el historial
  const markAsViewed = useCallback((id: string) => {
    setHistory(prev => {
      const now = Date.now();
      // Filtramos para evitar duplicados y añadimos el nuevo con el tiempo actual
      const filtered = prev.filter(item => item.id !== id);
      const updated = [...filtered, { id, timestamp: now }];
      localStorage.setItem(VIEWED_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 3. Motor de selección inteligente de videos
  const getNextRandomVideo = useCallback(() => {
    if (videoPool.length === 0) return null;

    const viewedIds = history.map(h => h.id);

    // FILTRO 1: No vistos en 7 días + Diferente categoría + No prohibidos
    let candidates = videoPool.filter(v => 
      !viewedIds.includes(v.id) && 
      v.categoria !== FORBIDDEN_CATEGORY && 
      v.categoria !== lastCategoryRef.current
    );

    // FILTRO 2 (FALLBACK): Si no hay videos nuevos de otra categoría, buscamos cualquier video nuevo (no visto en 7 días)
    if (candidates.length === 0) {
      candidates = videoPool.filter(v => 
        !viewedIds.includes(v.id) && 
        v.categoria !== FORBIDDEN_CATEGORY
      );
    }

    // FILTRO 3 (REINICIO): Si el usuario ya vio TODO en la última semana, permitimos repetir pero priorizamos otra categoría
    if (candidates.length === 0) {
      candidates = videoPool.filter(v => 
        v.categoria !== FORBIDDEN_CATEGORY && 
        v.categoria !== lastCategoryRef.current
      );
    }

    // Si todo falla, seleccionamos cualquier video permitido
    if (candidates.length === 0) {
      candidates = videoPool.filter(v => v.categoria !== FORBIDDEN_CATEGORY);
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    if (selected) lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool, history]);

  // Lógica de transición (Intro -> Contenido)
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
    // Marcamos el video que termina como visto
    if (state.currentContent?.id) {
      markAsViewed(state.currentContent.id);
    }
    const next = getNextRandomVideo();
    if (next) startTransition(next);
  }, [getNextRandomVideo, startTransition, state.currentContent, markAsViewed]);

  const playManual = useCallback((item: Video | Article) => {
    if (item.id) markAsViewed(item.id);
    startTransition(item);
  }, [startTransition, markAsViewed]);

  // Inicio automático de la App
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
      const first = getNextRandomVideo();
      if (first) startTransition(first);
    }
  }, [videoPool, state.currentContent, getNextRandomVideo, startTransition]);

  return (
    <MediaPlayerContext.Provider value={{ state, videoPool, setVideoPool, playManual, handleIntroEnded, handleContentEnded }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export const useMediaPlayer = () => {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error('useMediaPlayer debe ser usado dentro de MediaPlayerProvider');
  return context;
};