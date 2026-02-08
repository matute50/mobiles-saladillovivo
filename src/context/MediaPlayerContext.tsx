'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = ['/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4', '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4'];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';
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
  });

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) { }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
  }, []);

  useEffect(() => {
    if (state.shouldPlayContent) requestWakeLock(); else releaseWakeLock();
    const handleVisibility = () => { if (document.visibilityState === 'visible' && state.shouldPlayContent) requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { document.removeEventListener('visibilitychange', handleVisibility); releaseWakeLock(); };
  }, [state.shouldPlayContent, requestWakeLock, releaseWakeLock]);

  const introTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleIntroEnded = useCallback(() => {
    setState(prev => ({ ...prev, isIntroVisible: false }));
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
  }, []);

  const getNextIntroUrl = useCallback((isVideo: boolean, currentQueue: string[]) => {
    if (!isVideo) return { url: NEWS_INTRO_VIDEO, newQueue: currentQueue };

    let newQueue = [...currentQueue];
    if (newQueue.length === 0) {
      // Recargar y barajar
      newQueue = [...INTRO_VIDEOS].sort(() => Math.random() - 0.5);

      // Si la primera del nuevo ciclo es igual a la última del anterior, rotar
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
    // Es video si tiene propiedad 'url'. 'Article' tiene 'url_slide'.
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
    }));

    introTimerRef.current = setTimeout(() => {
      handleIntroEnded();
    }, 4000);
  }, [handleIntroEnded, getNextIntroUrl, state.introQueue]);

  const candidates = React.useMemo(() => {
    return videoPool.filter(v => v.categoria !== FORBIDDEN_CATEGORY && String(v.id) !== BLOCKED_START_ID);
  }, [videoPool]);

  const getNextVideo = useCallback((excludeCategory?: string) => {
    if (candidates.length === 0) return null;

    let filtered = candidates.filter(v => v.categoria !== excludeCategory);

    if (filtered.length === 0) {
      filtered = candidates;
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [candidates]);

  const prepareNext = useCallback(() => {
    if (state.nextContent) return; // Ya hay uno preparado
    const next = getNextVideo(state.currentContent?.categoria);
    if (next) {
      setState(prev => ({ ...prev, nextContent: next }));
    }
  }, [getNextVideo, state.currentContent, state.nextContent]);

  const triggerTransition = useCallback((delayMs = 0) => {
    if (!state.nextContent || state.isIntroVisible) return;

    // Iniciar Intro inmediatamente
    const isVideo = 'url' in state.nextContent && typeof (state.nextContent as any).url === 'string';

    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    const { url: nextIntroUrl, newQueue } = getNextIntroUrl(isVideo, state.introQueue);

    // FASE 0: Definir Safety Delay (v23.0)
    // Regla: Nunca hacer swap instantáneo. Siempre dar tiempo a la intro para cubrir (800ms mínimo).
    const SAFETY_DELAY = 800;
    const effectiveDelay = Math.max(delayMs, SAFETY_DELAY);

    // FASE 1: Activar Intro Visualmente (Overlay) - INMEDIATO
    setState(prev => ({
      ...prev,
      // NO cambiamos currentContent todavía. Mantenemos el anterior sonando/viéndose.
      currentContent: prev.currentContent,
      nextContent: prev.nextContent,
      currentIntroUrl: nextIntroUrl,
      introQueue: newQueue,
      introId: Date.now(),
      isIntroVisible: true,
    }));

    // FASE 2: Swap Lógico - DIFERIDO (Cover First, Swap Later)
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentContent: prev.nextContent, // AHORA sí cambiamos (con intro encima)
        nextContent: null
      }));
    }, effectiveDelay);

    // FASE 3: Apagar Intro
    introTimerRef.current = setTimeout(() => {
      handleIntroEnded();
    }, 4000); // 4s total de intro
  }, [state.nextContent, state.isIntroVisible, handleIntroEnded, state.introQueue, getNextIntroUrl]);

  const setVideoPool = useCallback((videos: Video[], initialTarget?: Video | Article) => {
    setVideoPoolState(videos);
    if (initialTarget && !isInitialVideoPicked.current) {
      isInitialVideoPicked.current = true;
      startTransition(initialTarget);
    }
  }, [startTransition]);

  const handleContentEnded = useCallback(() => {
    // Detectamos si lo que terminó fue una Noticia (Article)
    const isNews = state.currentContent && ('url_slide' in state.currentContent || !('url' in state.currentContent));

    if (state.nextContent) {
      // Sivenimos de una Noticia, QUEREMOS la intro y transición suave.
      // triggerTransition() maneja exactamente: Intro Random + Background Play de nextContent.
      if (isNews) {
        triggerTransition();
      } else {
        // Comportamiento estándar para Youtube->Youtube (asumiendo que triggerTransition ya corrió en onNearEnd)
        // Si llegamos aquí sin trigger, hacemos swap directo.
        setState(prev => ({
          ...prev,
          currentContent: prev.nextContent,
          nextContent: null
        }));
      }
    } else {
      const next = getNextVideo();
      if (next) startTransition(next); // startTransition siempre pone intro para videos
    }
  }, [state.currentContent, state.nextContent, getNextVideo, startTransition, triggerTransition]);

  const playManual = useCallback((item: Video | Article) => {
    isInitialVideoPicked.current = true; // Evitar que el efecto de carga pise la selección manual
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
  }, [videoPool, state.currentContent, getNextVideo, startTransition]);

  return (
    <MediaPlayerContext.Provider value={{
      state, setVideoPool, playManual,
      prepareNext, triggerTransition,
      handleIntroEnded, handleContentEnded
    }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export const useMediaPlayer = () => {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error('useMediaPlayer error');
  return context;
};