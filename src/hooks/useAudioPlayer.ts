// src/hooks/useAudioPlayer.ts
import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayer = (audioUrl: string | null) => {
  const [state, setState] = useState<'playing' | 'paused' | 'stopped'>('stopped');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const onPlaying = useCallback(() => setState('playing'), []);
  const onPaused = useCallback(() => setState('paused'), []);
  const onEnded = useCallback(() => setState('stopped'), []);
  const onLoading = useCallback(() => console.log('Cargando audio...'), []);
  const onCanPlay = useCallback(() => console.log('Audio listo para reproducir.'), []);
  const onError = useCallback((e: Event) => {
    console.error("Error al cargar o reproducir el audio.", e);
    setState('stopped');
  }, []);

  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ''; // Limpiamos el src para liberar recursos
      }
      setState('stopped');
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    } else {
      audioRef.current.src = audioUrl;
      audioRef.current.load(); // Vuelve a cargar si el src ha cambiado
    }

    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = 1.13; // Mantenemos tu velocidad

      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('pause', onPaused);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.addEventListener('loadstart', onLoading);
      audio.addEventListener('canplaythrough', onCanPlay); // Agregamos un listener para 'canplaythrough'

      // Intentar cargar y reproducir solo si no está en stopped y tiene URL
      if (state !== 'stopped' && audioUrl) {
        audio.load();
        audio.play().catch(e => console.error("Error al reproducir automáticamente:", e));
      }
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('pause', onPaused);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('loadstart', onLoading);
        audio.removeEventListener('canplaythrough', onCanPlay); // Limpiamos el nuevo evento
      }
    };
  }, [audioUrl, state, onPlaying, onPaused, onEnded, onError, onLoading, onCanPlay]);

  const play = useCallback(() => {
    if (audioRef.current && (state === 'paused' || state === 'stopped')) {
      audioRef.current.play().catch(e => console.error("Error al reproducir:", e));
      setState('playing');
    }
  }, [state]);

  const pause = useCallback(() => {
    if (audioRef.current && state === 'playing') {
      audioRef.current.pause();
      setState('paused');
    }
  }, [state]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState('stopped');
    }
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  return { state, play, pause, stop, setPlaybackSpeed };
};
