'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface VolumeContextType {
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  hasInteracted: boolean;
  toggleMute: () => void;
  unmute: () => void;
}

const VolumeContext = createContext<VolumeContextType | undefined>(undefined);

export const VolumeProvider = ({ children }: { children: ReactNode }) => {
  // ✅ localStorage Lazy Initialization (react-useeffect skill)
  // Evita doble ejecución en dev mode y mejora performance
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const savedVolume = localStorage.getItem('playerVolume');
    return savedVolume !== null ? parseFloat(savedVolume) : 1;
  });

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('playerVolume') === null;
  });

  const [hasInteracted, setHasInteracted] = useState(false);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);
    localStorage.setItem('playerVolume', clamped.toString());
    if (clamped > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setHasInteracted(true);
    setIsMuted(prev => {
      const next = !prev;
      if (!next && volume <= 0.05) {
        setVolume(1.0);
      }
      return next;
    });
  }, [volume, setVolume]);

  const unmute = useCallback(() => {
    setHasInteracted(true);
    setIsMuted(false);
    if (volume <= 0.05) setVolume(1.0);
  }, [volume, setVolume]);

  return (
    <VolumeContext.Provider value={{ volume, setVolume, isMuted, hasInteracted, toggleMute, unmute }}>
      {children}
    </VolumeContext.Provider>
  );
};

export const useVolume = () => {
  const context = useContext(VolumeContext);
  if (context === undefined) {
    throw new Error('useVolume must be used within a VolumeProvider');
  }
  return context;
};