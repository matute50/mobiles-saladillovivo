'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

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
        setVolumeState(1.0);
        localStorage.setItem('playerVolume', '1');
      }
      return next;
    });
  }, [volume]);

  const unmute = useCallback(() => {
    setHasInteracted(true);
    setIsMuted(false);
    if (volume <= 0.05) {
      setVolumeState(1.0);
      localStorage.setItem('playerVolume', '1');
    }
  }, [volume]);

  const contextValue = useMemo(() => ({
    volume,
    setVolume,
    isMuted,
    hasInteracted,
    toggleMute,
    unmute
  }), [volume, setVolume, isMuted, hasInteracted, toggleMute, unmute]);

  return (
    <VolumeContext.Provider value={contextValue}>
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