'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4',
  '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4',
  '/videos_intro/intro4.mp4',
  '/videos_intro/intro5.mp4',
];

const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4';

interface MediaPlayerState {
  currentContent: Video | Article | null; 
  currentIntro: string | null;            
  isIntroVisible: boolean;                
  isContentPlaying: boolean;              
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
  videoPool: Video[];
  setVideoPool: (videos: Video[]) => void;
  playManual: (item: Video | Article) => void; 
  handleContentEnded: () => void;
  dismissIntro: () => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPool] = useState<Video[]>([]);
  
  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntro: null,
    isIntroVisible: true,
    isContentPlaying: false,
  });

  const introStartTimeRef = useRef<number>(0);

  const getRandomIntro = () => INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)];

  const getRandomVideo = useCallback(() => {
    if (videoPool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * videoPool.length);
    return videoPool[randomIndex];
  }, [videoPool]);

  // --- TRANSICIÓN ---
  const triggerTransition = useCallback((nextContent: Video | Article | null) => {
    if (!nextContent) return;

    const isNewsArticle = 'url_slide' in nextContent || !('url' in nextContent);
    const newIntro = isNewsArticle ? NEWS_INTRO_VIDEO : getRandomIntro();

    introStartTimeRef.current = Date.now();

    setState(prev => ({
      ...prev,
      isIntroVisible: true, 
      currentIntro: newIntro,
      currentContent: nextContent,
      isContentPlaying: true 
    }));
  }, []); // Dependencias estables

  // --- OCULTAR INTRO ---
  const dismissIntro = useCallback(() => {
    const now = Date.now();
    const elapsed = now - introStartTimeRef.current;
    const MIN_DURATION = 2000; 

    if (elapsed >= MIN_DURATION) {
      setState(prev => ({ ...prev, isIntroVisible: false }));
    } else {
      const remaining = MIN_DURATION - elapsed;
      setTimeout(() => {
        setState(prev => ({ ...prev, isIntroVisible: false }));
      }, remaining);
    }
  }, []);

  // --- HANDLERS (MEMOIZADOS PARA EVITAR CRASH) ---
  const playManual = useCallback((item: Video | Article) => {
    triggerTransition(item);
  }, [triggerTransition]);

  const handleContentEnded = useCallback(() => {
    const nextRandom = getRandomVideo();
    triggerTransition(nextRandom);
  }, [getRandomVideo, triggerTransition]);

  // INICIO AUTOMÁTICO
  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
      const firstVideo = getRandomVideo();
      triggerTransition(firstVideo);
    }
  }, [videoPool, getRandomVideo, triggerTransition, state.currentContent]);

  return (
    <MediaPlayerContext.Provider value={{ 
      state, 
      videoPool, 
      setVideoPool, 
      playManual, 
      handleContentEnded,
      dismissIntro 
    }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error('useMediaPlayer debe usarse dentro de MediaPlayerProvider');
  return context;
}