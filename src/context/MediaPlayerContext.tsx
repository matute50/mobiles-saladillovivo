'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = ['/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4', '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4'];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4?v=2';
const FORBIDDEN_CATEGORY = 'HCD DE SALADILLO - Período 2025';
const BLOCKED_START_ID = '471';

interface MediaPlayerState {
  currentContent: Video | Article | null;
  nextContent: Video | Article | null;
  currentIntroUrl: string | null;
  introQueue: string[];
  introId: number;
  isIntroVisible: boolean;
  shouldPlayContent: boolean;
  isContentPlaying: boolean;
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
  setVideoPool: (videos: Video[], initialTarget?: Video | Article) => void;
  playManual: (item: Video | Article) => void;
  prepareNext: () => void;
  triggerTransition: (delayMs?: number) => void;
  handleIntroEnded: () => void;
  handleContentEnded: () => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPoolState] = useState<Video[]>([]);
  const isInitialVideoPicked = useRef(false);
  const wakeLockRef = useRef<any>(null);

  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    nextContent: null,
    currentIntroUrl: null,
    introQueue: [],
    introId: 0,
    isIntroVisible: true,
    shouldPlayContent: false,
    isContentPlaying: false,
  });

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) { }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
  };

  useEffect(() => {
    if (state.shouldPlayContent) requestWakeLock(); else releaseWakeLock();
    const handleVisibility = () => { if (document.visibilityState === 'visible' && state.shouldPlayContent) requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { document.removeEventListener('visibilitychange', handleVisibility); releaseWakeLock(); };
  }, [state.shouldPlayContent]);

  const introTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleIntroEnded = useCallback(() => {
    setState(prev => ({ ...prev, isIntroVisible: false, isContentPlaying: true }));
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
  }, []);

  const getNextIntroUrl = useCallback((isVideo: boolean, currentQueue: string[]) => {
    if (!isVideo) return { url: NEWS_INTRO_VIDEO, newQueue: currentQueue };

    let newQueue = [...currentQueue];
    if (newQueue.length === 0) {
      newQueue = [...INTRO_VIDEOS].sort(() => Math.random() - 0.5);
      const lastIntro = state.currentIntroUrl;
      if (lastIntro && newQueue[0] === lastIntro && newQueue.length > 1) {
        const first = newQueue.shift()!;
        newQueue.push(first);
      }
    }

    const url = newQueue.shift() || INTRO_VIDEOS[0];
    return { url, newQueue };
  }, [state.currentIntroUrl]);

  const startTransition = useCallback((nextContent: Video | Article) => {
    const isVideo = 'url' in nextContent && typeof (nextContent as any).url === 'string';

    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    const { url: nextIntroUrl, newQueue } = getNextIntroUrl(isVideo, state.introQueue);

    setState(prev => ({
      ...prev,
      currentContent: nextContent,
      nextContent: null,
      currentIntroUrl: nextIntroUrl,
      introQueue: newQueue,
      introId: Date.now(),
      isIntroVisible: true,
      shouldPlayContent: true,
      isContentPlaying: false,
    }));

    introTimerRef.current = setTimeout(() => {
      handleIntroEnded();
    }, 10000);
  }, [state.introQueue, getNextIntroUrl, handleIntroEnded]);

  // React Compiler se encarga de optimizar esto, pero lo simulamos manualmente por ahora
  const candidates = useMemo(() => videoPool.filter(v => v.categoria !== FORBIDDEN_CATEGORY && String(v.id) !== BLOCKED_START_ID), [videoPool]);

  const getNextVideo = useCallback((excludeCategory?: string) => {
    if (candidates.length === 0) return null;
    let filtered = candidates.filter(v => v.categoria !== excludeCategory);
    if (filtered.length === 0) filtered = candidates;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [candidates]);

  const prepareNext = useCallback(() => {
    if (state.nextContent) return;
    const next = getNextVideo(state.currentContent?.categoria);
    if (next) {
      setState(prev => ({ ...prev, nextContent: next }));
    }
  }, [state.nextContent, state.currentContent?.categoria, getNextVideo]);

  const triggerTransition = useCallback((delayMs = 0) => {
    if (!state.nextContent || state.isIntroVisible) return;

    const isVideo = 'url' in state.nextContent && typeof (state.nextContent as any).url === 'string';

    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    const { url: nextIntroUrl, newQueue } = getNextIntroUrl(isVideo, state.introQueue);

    const SAFETY_DELAY = 1500;
    const effectiveDelay = Math.max(delayMs, SAFETY_DELAY);

    setState(prev => ({
      ...prev,
      currentContent: prev.currentContent,
      nextContent: prev.nextContent,
      currentIntroUrl: nextIntroUrl,
      introQueue: newQueue,
      introId: Date.now(),
      isIntroVisible: true,
      isContentPlaying: false,
    }));

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentContent: prev.nextContent,
        nextContent: null
      }));
    }, effectiveDelay);

    introTimerRef.current = setTimeout(() => {
      handleIntroEnded();
    }, 10000);
  }, [state.nextContent, state.isIntroVisible, state.introQueue, getNextIntroUrl, handleIntroEnded]);

  const setVideoPool = useCallback((videos: Video[], initialTarget?: Video | Article) => {
    setVideoPoolState(videos);
    if (initialTarget && !isInitialVideoPicked.current) {
      isInitialVideoPicked.current = true;
      startTransition(initialTarget);
    }
  }, [startTransition]);

  const handleContentEnded = useCallback(async () => {
    if (state.nextContent) {
      // v25.4: Si el contenido ya terminó, usamos startTransition para un swap INMEDIATO.
      // Esto evita el gap de 800ms de triggerTransition que causaba pantalla negra en noticias.
      startTransition(state.nextContent);
    } else {
      const next = getNextVideo();
      if (next) startTransition(next);
    }
  }, [state.nextContent, startTransition, getNextVideo]);

  const playManual = useCallback((item: Video | Article) => {
    isInitialVideoPicked.current = true;
    startTransition(item);
  }, [startTransition]);

  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent && !isInitialVideoPicked.current) {
      const first = getNextVideo();
      if (first) {
        isInitialVideoPicked.current = true;
        startTransition(first);
      }
    }
  }, [videoPool, state.currentContent]);

  const contextValue = useMemo(() => ({
    state, setVideoPool, playManual,
    prepareNext, triggerTransition,
    handleIntroEnded, handleContentEnded,
  }), [state, setVideoPool, playManual, prepareNext, triggerTransition, handleIntroEnded, handleContentEnded]);

  return (
    <MediaPlayerContext.Provider value={contextValue}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export const useMediaPlayer = () => {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error('useMediaPlayer error');
  return context;
};