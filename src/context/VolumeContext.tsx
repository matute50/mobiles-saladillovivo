'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const savedVolume = localStorage.getItem('playerVolume');
    if (savedVolume !== null) {
      setVolumeState(parseFloat(savedVolume));
      setIsMuted(false);
    }
  }, []);

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