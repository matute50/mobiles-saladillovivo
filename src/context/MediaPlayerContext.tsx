'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4',
];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';
const FORBIDDEN_CATEGORY = 'HCD DE SALADILLO - Período 2025';
const BLOCKED_START_ID = '471';

const START_HISTORY_KEY = 'sv_start_history_4d_v9';
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
  // setVideoPool ahora acepta opcionalmente un contenido inicial para Deep Links
  setVideoPool: (videos: Video[], initialTarget?: Video | Article) => void;
  playManual: (item: Video | Article) => void;
  handleIntroEnded: () => void;
  handleContentEnded: () => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPoolState] = useState<Video[]>([]);
  const isInitialVideoPicked = useRef(false);
  const lastCategoryRef = useRef<string>('');
  
  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntroUrl: null,
    isIntroVisible: true,
    shouldPlayContent: false,
  });

  const getStartHistory = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(START_HISTORY_KEY);
      if (!saved) return [];
      const parsed: HistoryItem[] = JSON.parse(saved);
      const now = Date.now();
      return parsed.filter(item => (now - item.timestamp) < FOUR_DAYS_MS).map(h => h.id);
    } catch (e) { return []; }
  }, []);

  const saveStartHistory = useCallback((id: string) => {
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

  const getNextVideo = useCallback((isFirstBoot = false) => {
    if (videoPool.length === 0) return null;

    const historyIds = isFirstBoot ? getStartHistory() : [];
    
    let candidates = videoPool.filter(v => {
      const isHCD = v.categoria === FORBIDDEN_CATEGORY;
      if (isFirstBoot) {
        return !isHCD && String(v.id) !== BLOCKED_START_ID && !historyIds.includes(v.id);
      }
      return !isHCD && v.categoria !== lastCategoryRef.current;
    });

    if (candidates.length === 0) {
      candidates = videoPool.filter(v => v.categoria !== FORBIDDEN_CATEGORY && String(v.id) !== BLOCKED_START_ID);
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    if (selected) lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool, getStartHistory]);

  // Nueva implementación de setVideoPool sincronizada con Deep Linking
  const setVideoPool = useCallback((videos: Video[], initialTarget?: Video | Article) => {
    setVideoPoolState(videos);
    
    // Si la App entra por un link compartido (?id= o ?v=), initialTarget tendrá valor
    if (initialTarget && !isInitialVideoPicked.current) {
      isInitialVideoPicked.current = true;
      startTransition(initialTarget);
    }
  }, [startTransition]);

  const handleIntroEnded = useCallback(() => setState(prev => ({ ...prev, isIntroVisible: false })), []);

  const handleContentEnded = useCallback(() => {
    const next = getNextVideo(false); 
    if (next) startTransition(next);
  }, [getNextVideo, startTransition]);

  const playManual = useCallback((item: Video | Article) => startTransition(item), [startTransition]);

  useEffect(() => {
    // Si no hubo Deep Link (initialTarget), ejecutamos la rotación aleatoria normal
    if (videoPool.length > 0 && !state.currentContent && !isInitialVideoPicked.current) {
      const first = getNextVideo(true); 
      if (first) {
        isInitialVideoPicked.current = true;
        saveStartHistory(first.id);
        startTransition(first);
      }
    }
  }, [videoPool, state.currentContent, getNextVideo, startTransition, saveStartHistory]);

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