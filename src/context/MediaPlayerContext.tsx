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
  isIntroVisible: boolean;
  shouldPlayContent: boolean;
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
  videoPool: Video[];
  setVideoPool: (videos: Video[], initialTarget?: Video | Article) => void;
  playManual: (item: Video | Article) => void;
  prepareNext: () => void;
  triggerTransition: () => void;
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

  const startTransition = useCallback((nextContent: Video | Article) => {
    const isVideo = 'url' in nextContent && nextContent.url;

    if (introTimerRef.current) clearTimeout(introTimerRef.current);

    setState({
      currentContent: nextContent,
      nextContent: null,
      currentIntroUrl: isVideo ? INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)] : NEWS_INTRO_VIDEO,
      isIntroVisible: true,
      shouldPlayContent: true,
    });

    introTimerRef.current = setTimeout(() => {
      handleIntroEnded();
    }, 4000);
  }, [handleIntroEnded]);

  const getNextVideo = useCallback((excludeCategory?: string) => {
    if (videoPool.length === 0) return null;

    let candidates = videoPool.filter(v =>
      v.categoria !== FORBIDDEN_CATEGORY &&
      v.categoria !== excludeCategory &&
      String(v.id) !== BLOCKED_START_ID
    );

    if (candidates.length === 0) {
      candidates = videoPool.filter(v => v.categoria !== FORBIDDEN_CATEGORY);
    }

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [videoPool]);

  const prepareNext = useCallback(() => {
    if (state.nextContent) return; // Ya hay uno preparado
    const next = getNextVideo(state.currentContent?.categoria);
    if (next) {
      setState(prev => ({ ...prev, nextContent: next }));
    }
  }, [getNextVideo, state.currentContent, state.nextContent]);

  const triggerTransition = useCallback(() => {
    if (!state.nextContent || state.isIntroVisible) return;

    // Iniciar Intro inmediatamente
    const isVideo = 'url' in state.nextContent && state.nextContent.url;

    if (introTimerRef.current) clearTimeout(introTimerRef.current);

    setState(prev => ({
      ...prev,
      currentIntroUrl: isVideo ? INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)] : NEWS_INTRO_VIDEO,
      isIntroVisible: true,
    }));

    // NO SE CAMBIA currentContent AQUÍ.
    // El cambio ocurrirá cuando el Video actual reporte su fin total (handleContentEnded)

    introTimerRef.current = setTimeout(() => {
      handleIntroEnded();
    }, 4000);
  }, [state.nextContent, state.isIntroVisible, handleIntroEnded]);

  const setVideoPool = useCallback((videos: Video[], initialTarget?: Video | Article) => {
    const shuffled = [...videos].sort(() => Math.random() - 0.5);
    setVideoPoolState(shuffled);
    if (initialTarget && !isInitialVideoPicked.current) {
      isInitialVideoPicked.current = true;
      startTransition(initialTarget);
    }
  }, [startTransition]);

  const handleContentEnded = useCallback(() => {
    if (state.nextContent) {
      setState(prev => ({
        ...prev,
        currentContent: prev.nextContent,
        nextContent: null
      }));
    } else {
      const next = getNextVideo();
      if (next) startTransition(next);
    }
  }, [state.nextContent, getNextVideo, startTransition]);

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
      state, videoPool, setVideoPool, playManual,
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