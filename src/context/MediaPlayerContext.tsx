'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4',
];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';
const FORBIDDEN_KEYWORD = 'HCD'; 

// BLOQUEO ESPECÍFICO DE INICIO
const BLOCKED_START_VIDEO_ID = '471'; // "LA ÚNICA FÁBRICA DE HELICÓPTEROS..."

const START_HISTORY_KEY = 'sv_hard_block_v7';
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

interface MediaPlayerState {
  currentContent: Video | Article | null;
  currentIntroUrl: string | null;
  isIntroVisible: boolean;
  shouldPlayContent: boolean;
}

interface HistoryItem { id: string; timestamp: number; }

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
  const [videoPool, _setVideoPool] = useState<Video[]>([]);
  const isInitialVideoPicked = useRef(false);
  const lastCategoryRef = useRef<string>('');
  
  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntroUrl: null,
    isIntroVisible: true,
    shouldPlayContent: false,
  });

  // Shuffle síncrono al recibir los datos
  const setVideoPool = useCallback((videos: Video[]) => {
    if (!videos || videos.length === 0) return;
    const shuffled = [...videos].sort(() => Math.random() - 0.5);
    _setVideoPool(shuffled);
  }, []);

  const getHistory = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(START_HISTORY_KEY);
      if (!saved) return [];
      const parsed: HistoryItem[] = JSON.parse(saved);
      const now = Date.now();
      return parsed.filter(item => (now - item.timestamp) < FOUR_DAYS_MS).map(h => h.id);
    } catch (e) { return []; }
  }, []);

  const saveHistory = useCallback((id: string) => {
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

  const getNextVideo = useCallback((isFirstVideo: boolean = false) => {
    if (videoPool.length === 0) return null;

    const startIds = isFirstVideo ? getHistory() : [];
    
    // FILTRADO CON BLOQUEO DIRECTO
    let candidates = videoPool.filter(v => {
      const isHCD = v.categoria.toUpperCase().includes(FORBIDDEN_KEYWORD);
      
      if (isFirstVideo) {
        // Bloqueo manual del ID 471 SOLO para el inicio
        const isBlockedID = v.id === BLOCKED_START_VIDEO_ID || String(v.id) === BLOCKED_START_VIDEO_ID;
        return !isHCD && !startIds.includes(v.id) && !isBlockedID;
      }
      
      return !isHCD && v.categoria !== lastCategoryRef.current;
    });

    // Fallback: Si todos están bloqueados por historial, liberamos historial pero NO el 471 ni HCD
    if (candidates.length === 0 && isFirstVideo) {
      candidates = videoPool.filter(v => {
        const isHCD = v.categoria.toUpperCase().includes(FORBIDDEN_KEYWORD);
        const isBlockedID = v.id === BLOCKED_START_VIDEO_ID || String(v.id) === BLOCKED_START_VIDEO_ID;
        return !isHCD && !isBlockedID;
      });
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    if (selected) lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool, getHistory]);

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

  const handleIntroEnded = useCallback(() => setState(prev => ({ ...prev, isIntroVisible: false })), []);

  const handleContentEnded = useCallback(() => {
    const next = getNextVideo(false); 
    if (next) startTransition(next);
  }, [getNextVideo, startTransition]);

  const playManual = useCallback((item: Video | Article) => startTransition(item), [startTransition]);

  useEffect(() => {
    // Esperamos a tener una cantidad razonable para asegurar que el ID 471 no sea el único
    if (videoPool.length > 50 && !state.currentContent && !isInitialVideoPicked.current) {
      const first = getNextVideo(true); 
      if (first) {
        isInitialVideoPicked.current = true;
        saveHistory(first.id);
        startTransition(first);
      }
    }
  }, [videoPool, state.currentContent, getNextVideo, startTransition, saveHistory]);

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