'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = [
  '/videos_intro/intro1.mp4',
  '/videos_intro/intro2.mp4',
  '/videos_intro/intro3.mp4',
  '/videos_intro/intro4.mp4',
  '/videos_intro/intro5.mp4',
];

const NEWS_INTRO = '/videos_intro/noticias.mp4'; 

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
  hideIntro: () => void; 
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

  const getRandomIntro = () => INTRO_VIDEOS[Math.floor(Math.random() * INTRO_VIDEOS.length)];

  const hideIntro = useCallback(() => {
    setState(prev => ({ ...prev, isIntroVisible: false }));
  }, []);

  const triggerTransition = useCallback((nextContent: Video | Article | null) => {
    if (!nextContent) return;

    // --- DETECCIÓN INFALIBLE ---
    // Si tiene 'url', es un video de YouTube. Si NO la tiene, asumimos que es Noticia.
    const isVideo = 'url' in nextContent;
    const isArticle = !isVideo;
    
    // Asignación de intro
    const newIntro = isArticle ? NEWS_INTRO : getRandomIntro();

    console.log("🔄 [Context] Reproduciendo:", isArticle ? "NOTICIA" : "VIDEO");
    
    setState(prev => ({
      ...prev,
      isIntroVisible: true, 
      currentIntro: newIntro,
      currentContent: nextContent, 
      isContentPlaying: true 
    }));

    if (isArticle) {
      // SI ES NOTICIA: Intro en loop infinito hasta que el slide avise (sin timeout)
    } else {
      // SI ES VIDEO: Intro dura 4 segundos fijos
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isIntroVisible: false
        }));
      }, 4000);
    }

  }, []);

  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent) {
      const firstVideo = videoPool[Math.floor(Math.random() * videoPool.length)];
      triggerTransition(firstVideo);
    }
  }, [videoPool, triggerTransition, state.currentContent]);

  const playManual = (item: Video | Article) => {
    triggerTransition(item);
  };

  const handleContentEnded = () => {
    if (videoPool.length === 0) return;
    const nextRandom = videoPool[Math.floor(Math.random() * videoPool.length)];
    triggerTransition(nextRandom);
  };

  return (
    <MediaPlayerContext.Provider value={{ 
      state, 
      videoPool, 
      setVideoPool, 
      playManual, 
      handleContentEnded,
      hideIntro 
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