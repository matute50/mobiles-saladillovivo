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
const FORBIDDEN_CATEGORY = 'HCD DE SALADILLO - Período 2025';

interface MediaPlayerState {
  currentContent: Video | Article | null;
  currentIntroUrl: string | null;
  isIntroVisible: boolean;      
  shouldPlayContent: boolean;   // En lógica de Buffer, esto será TRUE antes de quitar el Intro
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
  const lastCategoryRef = useRef<string>('');

  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    currentIntroUrl: null,
    isIntroVisible: true,
    shouldPlayContent: false, 
  });

  const getNextRandomVideo = useCallback(() => {
    if (videoPool.length === 0) return null;
    let validVideos = videoPool.filter(v => 
      v.categoria !== FORBIDDEN_CATEGORY && v.categoria !== lastCategoryRef.current
    );
    if (validVideos.length === 0) validVideos = videoPool.filter(v => v.categoria !== FORBIDDEN_CATEGORY);
    if (validVideos.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * validVideos.length);
    const selected = validVideos[randomIndex];
    lastCategoryRef.current = selected.categoria;
    return selected;
  }, [videoPool]);

  // === ESTRATEGIA DE BUFFER: Inicia reproducción DEBAJO del Intro ===
  const startTransition = useCallback((nextContent: Video | Article) => {
    const isNews = 'url_slide' in nextContent || !('url' in nextContent);
    const nextIntro = isNews ? NEWS_INTRO_VIDEO : INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)];

    setState({
      currentContent: nextContent,
      currentIntroUrl: nextIntro,
      isIntroVisible: true,     
      shouldPlayContent: true, // ¡BUFFER ACTIVADO! El video inicia ya mismo
    });
  }, []);

  const handleIntroEnded = useCallback(() => {
    setState(prev => ({ ...prev, isIntroVisible: false }));
  }, []);

  const handleContentEnded = useCallback(() => {
    const nextVideo = getNextRandomVideo();
    if (nextVideo) startTransition(nextVideo);
  }, [getNextRandomVideo, startTransition]);

  const playManual = useCallback((item: Video | Article) => {
    startTransition(item);
  }, [startTransition]);

  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
      const firstVideo = getNextRandomVideo();
      if (firstVideo) startTransition(firstVideo);
    }
  }, [videoPool, getNextRandomVideo, startTransition, state.currentContent]);

  return (
    <MediaPlayerContext.Provider value={{ state, videoPool, setVideoPool, playManual, handleIntroEnded, handleContentEnded }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error('useMediaPlayer debe usarse dentro de MediaPlayerProvider');
  return context;
}