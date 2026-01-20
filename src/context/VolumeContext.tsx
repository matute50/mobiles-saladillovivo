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
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const savedVolume = localStorage.getItem('playerVolume');
    if (savedVolume) {
      setVolumeState(parseFloat(savedVolume));
      setIsMuted(false); 
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);
    localStorage.setItem('playerVolume', clamped.toString());
    if (clamped > 0 && isMuted) setIsMuted(false);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const unmute = useCallback(() => {
    setIsMuted(false);
  }, []);

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