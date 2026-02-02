// src/hooks/useAudioPlayer.ts corregido
import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayer = (audioUrl: string | null) => {
  const [state, setState] = useState<'playing' | 'paused' | 'stopped'>('stopped');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

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

    // Detener cualquier reproducción previa antes de cambiar la fuente
    audio.pause();
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
  }, [audioUrl, onPlaying, onPaused, onEnded]);

  const play = useCallback(async () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      // Si hay una promesa de reproducción en curso, esperamos o la ignoramos
      playPromiseRef.current = audioRef.current.play();
      await playPromiseRef.current;
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error("Error al reproducir audio:", e);
      }
    }
  }, [audioUrl]);

  const pause = useCallback(async () => {
    if (!audioRef.current) return;

    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
        audioRef.current.pause();
      } catch (e) {
        // Ignorar errores de interrupción durante la pausa
      } finally {
        playPromiseRef.current = null;
      }
    } else {
      audioRef.current.pause();
    }
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