'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface VolumeContextType {
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  unmute: () => void;
}

const VolumeContext = createContext<VolumeContextType | undefined>(undefined);

export const VolumeProvider = ({ children }: { children: ReactNode }) => {
  const [volume, setVolumeState] = useState(1); // Inicial al 100%
  const [isMuted, setIsMuted] = useState(true);

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
    setIsMuted(prev => {
      const next = !prev;
      if (!next && volume === 0) {
        // Si desmutear y el volumen es 0, poner al 5%
        setVolume(0.05);
      }
      return next;
    });
  }, [volume, setVolume]);

  const unmute = useCallback(() => {
    setIsMuted(false);
    if (volume === 0) setVolume(0.05);
  }, [volume, setVolume]);

  return (
    <VolumeContext.Provider value={{ volume, setVolume, isMuted, toggleMute, unmute }}>
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