'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4',
];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';
const FORBIDDEN_KEYWORD = 'HCD'; 

// Nueva clave para forzar limpieza de historial previo
const START_HISTORY_KEY = 'sv_final_start_v3';
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

  // 1. Obtener historial síncrono
  const getHistoryFromDisk = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(START_HISTORY_KEY);
      if (!saved) return [];
      const parsed: HistoryItem[] = JSON.parse(saved);
      const now = Date.now();
      return parsed.filter(item => (now - item.timestamp) < FOUR_DAYS_MS).map(h => h.id);
    } catch (e) { return []; }
  }, []);

  // 2. Guardar en disco
  const saveToDisk = useCallback((id: string) => {
    if (typeof window === 'undefined' || !id) return;
    try {
      const saved = localStorage.getItem(START_HISTORY_KEY);
      let history: HistoryItem[] = saved ? JSON.parse(saved) : [];
      const now = Date.now();
      history = history.filter(item => item.id !== id && (now - item.timestamp) < FOUR_DAYS_MS);
      history.push({ id, timestamp: now });
      localStorage.setItem(START_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}
  }, []);

  // 3. Función Shuffle Robusta
  const shuffle = <T,>(arr: T[]): T[] => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  };

  // 4. Selección con filtro y barajado
  const getNextVideo = useCallback((isFirstVideo: boolean = false) => {
    if (videoPool.length === 0) return null;

    const startIds = isFirstVideo ? getHistoryFromDisk() : [];

    // Mezclamos TODO el pool antes de empezar para romper cualquier orden de la DB
    const randomizedPool = shuffle(videoPool);

    let candidates = randomizedPool.filter(v => {
      const isHCD = v.categoria.toUpperCase().includes(FORBIDDEN_KEYWORD);
      if (isFirstVideo) {
        return !isHCD && !startIds.includes(v.id);
      }
      return !isHCD && v.categoria !== lastCategoryRef.current;
    });

    // Fallback: Si no hay candidatos, usamos el pool mezclado pero quitamos HCD
    if (candidates.length === 0) {
      candidates = randomizedPool.filter(v => !v.categoria.toUpperCase().includes(FORBIDDEN_KEYWORD));
    }

    const selected = candidates[0];
    if (selected) lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool, getHistoryFromDisk]);

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

  // EFECTO DE ARRANQUE CON "CHECK DE ESTABILIDAD"
  useEffect(() => {
    // IMPORTANTE: Solo elegimos el primer video si el pool tiene MÁS DE 5 elementos.
    // Esto garantiza que no elija el primero que llegue si la carga es asíncrona.
    if (videoPool.length > 5 && !state.currentContent && !isInitialVideoPicked.current) {
      console.log("Pool estabilizado con:", videoPool.length, "videos. Eligiendo inicio...");
      const first = getNextVideo(true); 
      if (first) {
        isInitialVideoPicked.current = true;
        saveToDisk(first.id);
        startTransition(first);
      }
    }
  }, [videoPool, state.currentContent, getNextVideo, startTransition, saveToDisk]);

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