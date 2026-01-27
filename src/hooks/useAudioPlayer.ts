// src/hooks/useAudioPlayer.ts corregido
import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayer = (audioUrl: string | null) => {
  const [state, setState] = useState<'playing' | 'paused' | 'stopped'>('stopped');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar el objeto Audio solo una vez
  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
  }

  const onPlaying = useCallback(() => setState('playing'), []);
  const onPaused = useCallback(() => setState('paused'), []);
  const onEnded = useCallback(() => setState('stopped'), []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Configurar el audio solo cuando cambie la URL
    audio.src = audioUrl;
    audio.playbackRate = 1.13;
    audio.load();

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPaused);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPaused);
      audio.removeEventListener('ended', onEnded);
    };
    // ELIMINAMOS 'state' de las dependencias para evitar el bucle
  }, [audioUrl, onPlaying, onPaused, onEnded]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Error al reproducir:", e));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState('stopped');
    }
  }, []);

  return { state, play, pause, stop };
};