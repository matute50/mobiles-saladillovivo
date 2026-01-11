'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type SlideType = 'html' | 'video' | 'image';

export interface SlideData {
  url: string;
  type: SlideType;
  duration?: number;
  title?: string; // <--- CAMPO AGREGADO
}

interface NewsPlayerContextType {
  playSlide: (slide: SlideData) => void;
  stopSlide: () => void;
  currentSlide: SlideData | null;
  isPlaying: boolean;
}

const NewsPlayerContext = createContext<NewsPlayerContextType | undefined>(undefined);

export const NewsPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentSlide, setCurrentSlide] = useState<SlideData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSlide = useCallback((slide: SlideData) => {
    setCurrentSlide(slide);
    setIsPlaying(true);
  }, []);

  const stopSlide = useCallback(() => {
    setIsPlaying(false);
    setCurrentSlide(null);
  }, []);

  return (
    <NewsPlayerContext.Provider value={{ playSlide, stopSlide, currentSlide, isPlaying }}>
      {children}
    </NewsPlayerContext.Provider>
  );
};

export const useNewsPlayer = () => {
  const context = useContext(NewsPlayerContext);
  if (!context) {
    throw new Error('useNewsPlayer debe usarse dentro de un NewsPlayerProvider');
  }
  return context;
};