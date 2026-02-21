'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Article } from '@/lib/types';

const INTRO_VIDEOS = ['/videos_intro/intro1.mp4', '/videos_intro/intro2.mp4', '/videos_intro/intro3.mp4', '/videos_intro/intro4.mp4', '/videos_intro/intro5.mp4'];
const DAILY_SHOW_INTROS = [
  '/videos_intro/al tanto de todo.mp4',
  '/videos_intro/bien informado.mp4',
  '/videos_intro/en 10 minutos.mp4',
  '/videos_intro/en10minutos.mp4',
  '/videos_intro/estas son las noticias.mp4',
  '/videos_intro/estas son.mp4',
  '/videos_intro/informate mejor.mp4',
  '/videos_intro/lo que paso hoy.mp4',
  '/videos_intro/los hechos.mp4',
  '/videos_intro/rapido.mp4',
  '/videos_intro/resumen.mp4'
];
const NEWS_INTRO_VIDEO = '/videos_intro/noticias.mp4?v=2';
const FORBIDDEN_CATEGORY = 'HCD DE SALADILLO - Período 2025';
const BLOCKED_START_ID = '471';

interface MediaPlayerState {
  currentContent: Video | Article | null;
  nextContent: Video | Article | null;
  currentIntroUrl: string | null;
  introQueue: string[];
  introId: number;
  isIntroVisible: boolean;
  shouldPlayContent: boolean;
  dailyShowSequence: any[] | null;
  currentSequenceIndex: number;
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
  setVideoPool: (videos: Video[], initialTarget?: Video | Article) => void;
  playManual: (item: Video | Article) => void;
  prepareNext: () => void;
  triggerTransition: (delayMs?: number) => void;
  handleIntroEnded: () => void;
  handleContentEnded: () => void;
  loadDailyShow: (id: string) => Promise<void>;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoPool, setVideoPoolState] = useState<Video[]>([]);
  const isInitialVideoPicked = useRef(false);
  const wakeLockRef = useRef<any>(null);

  const [state, setState] = useState<MediaPlayerState>({
    currentContent: null,
    nextContent: null,
    currentIntroUrl: null,
    introQueue: [],
    introId: 0,
    isIntroVisible: true,
    shouldPlayContent: false,
    dailyShowSequence: null,
    currentSequenceIndex: -1,
  });

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) { }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
  }, []);

  useEffect(() => {
    if (state.shouldPlayContent) requestWakeLock(); else releaseWakeLock();
    const handleVisibility = () => { if (document.visibilityState === 'visible' && state.shouldPlayContent) requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { document.removeEventListener('visibilitychange', handleVisibility); releaseWakeLock(); };
  }, [state.shouldPlayContent, requestWakeLock, releaseWakeLock]);

  const introTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleIntroEnded = useCallback(() => {
    setState(prev => ({ ...prev, isIntroVisible: false }));
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
  }, []);

  const getNextIntroUrl = useCallback((isVideo: boolean, currentQueue: string[]) => {
    if (!isVideo) return { url: NEWS_INTRO_VIDEO, newQueue: currentQueue };

    let newQueue = [...currentQueue];
    if (newQueue.length === 0) {
      // Recargar y barajar
      newQueue = [...INTRO_VIDEOS].sort(() => Math.random() - 0.5);

      // Si la primera del nuevo ciclo es igual a la última del anterior, rotar
      const lastIntro = state.currentIntroUrl;
      if (lastIntro && newQueue[0] === lastIntro && newQueue.length > 1) {
        const first = newQueue.shift()!;
        newQueue.push(first);
      }
    }

    const url = newQueue.shift() || INTRO_VIDEOS[0];
    return { url, newQueue };
  }, [state.currentIntroUrl]);

  const startTransition = useCallback((nextContent: Video | Article) => {
    // Es video si tiene propiedad 'url'. 'Article' tiene 'url_slide'.
    const isVideo = 'url' in nextContent && typeof (nextContent as any).url === 'string';

    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    const { url: nextIntroUrl, newQueue } = getNextIntroUrl(isVideo, state.introQueue);

    setState(prev => ({
      ...prev,
      currentContent: nextContent,
      nextContent: null,
      currentIntroUrl: nextIntroUrl,
      introQueue: newQueue,
      introId: Date.now(),
      isIntroVisible: true,
      shouldPlayContent: true,
    }));

    introTimerRef.current = setTimeout(() => {
      handleIntroEnded();
    }, 4000);
  }, [handleIntroEnded, getNextIntroUrl, state.introQueue]);

  const candidates = React.useMemo(() => {
    return videoPool.filter(v => v.categoria !== FORBIDDEN_CATEGORY && String(v.id) !== BLOCKED_START_ID);
  }, [videoPool]);

  const getNextVideo = useCallback((excludeCategory?: string) => {
    if (candidates.length === 0) return null;

    let filtered = candidates.filter(v => v.categoria !== excludeCategory);

    if (filtered.length === 0) {
      filtered = candidates;
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [candidates]);

  const prepareNext = useCallback(() => {
    if (state.nextContent) return; // Ya hay uno preparado
    const next = getNextVideo(state.currentContent?.categoria);
    if (next) {
      setState(prev => ({ ...prev, nextContent: next }));
    }
  }, [getNextVideo, state.currentContent, state.nextContent]);

  const triggerTransition = useCallback((delayMs = 0) => {
    if (!state.nextContent || state.isIntroVisible) return;

    // Iniciar Intro inmediatamente
    const isVideo = 'url' in state.nextContent && typeof (state.nextContent as any).url === 'string';

    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    const { url: nextIntroUrl, newQueue } = getNextIntroUrl(isVideo, state.introQueue);

    // FASE 0: Definir Safety Delay (v23.0)
    // Regla: Nunca hacer swap instantáneo. Siempre dar tiempo a la intro para cubrir (800ms mínimo).
    const SAFETY_DELAY = 800;
    const effectiveDelay = Math.max(delayMs, SAFETY_DELAY);

    // FASE 1: Activar Intro Visualmente (Overlay) - INMEDIATO
    setState(prev => ({
      ...prev,
      // NO cambiamos currentContent todavía. Mantenemos el anterior sonando/viéndose.
      currentContent: prev.currentContent,
      nextContent: prev.nextContent,
      currentIntroUrl: nextIntroUrl,
      introQueue: newQueue,
      introId: Date.now(),
      isIntroVisible: true,
    }));

    // FASE 2: Swap Lógico - DIFERIDO (Cover First, Swap Later)
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentContent: prev.nextContent, // AHORA sí cambiamos (con intro encima)
        nextContent: null
      }));
    }, effectiveDelay);

    // FASE 3: Apagar Intro
    introTimerRef.current = setTimeout(() => {
      handleIntroEnded();
    }, 4000); // 4s total de intro
  }, [state.nextContent, state.isIntroVisible, handleIntroEnded, state.introQueue, getNextIntroUrl]);

  const setVideoPool = useCallback((videos: Video[], initialTarget?: Video | Article) => {
    setVideoPoolState(videos);
    if (initialTarget && !isInitialVideoPicked.current) {
      isInitialVideoPicked.current = true;
      startTransition(initialTarget);
    }
  }, [startTransition]);

  const handleContentEnded = useCallback(async () => {
    // Si estamos en un Daily Show, avanzamos al siguiente ítem
    if (state.dailyShowSequence && state.currentSequenceIndex !== -1 && state.currentSequenceIndex < state.dailyShowSequence.length - 1) {
      // Si el video de transición no está ya en cola, lo ponemos
      if (state.currentIntroUrl !== NEWS_INTRO_VIDEO) {
        setState(prev => ({
          ...prev,
          currentIntroUrl: NEWS_INTRO_VIDEO,
          introId: Date.now(),
          isIntroVisible: true
        }));

        // La intro se oculta sola por los timers de VideoSection, aquí no tocamos el content todavía
        return;
      }

      // Si ya terminó la transición (o no hubo), pasamos al siguiente contenido real
      const nextIdx = state.currentSequenceIndex + 1;
      const nextItem = state.dailyShowSequence[nextIdx];

      setState(prev => ({ ...prev, currentSequenceIndex: nextIdx, isIntroVisible: false }));

      if (nextItem.type === 'noticia') {
        const { getArticleById } = await import('@/lib/data');
        const art = await getArticleById(nextItem.id);
        if (art) {
          setState(prev => ({ ...prev, currentContent: art }));
          return;
        }
      } else {
        const { getVideoById } = await import('@/lib/data');
        const vid = await getVideoById(nextItem.id);
        if (vid) {
          setState(prev => ({ ...prev, currentContent: vid }));
          return;
        }
      }
    }

    // Detectamos si lo que terminó fue una Noticia (Article)
    const isNews = state.currentContent && ('url_slide' in state.currentContent || !('url' in state.currentContent));

    if (state.nextContent) {
      if (isNews) {
        triggerTransition();
      } else {
        setState(prev => ({
          ...prev,
          currentContent: prev.nextContent,
          nextContent: null
        }));
      }
    } else {
      const next = getNextVideo();
      if (next) startTransition(next);
    }
  }, [state.currentContent, state.nextContent, state.currentIntroUrl, getNextVideo, startTransition, triggerTransition, state.dailyShowSequence, state.currentSequenceIndex]);

  const loadDailyShow = useCallback(async (id: string) => {
    if (state.dailyShowSequence && state.currentSequenceIndex !== -1) {
      // Ya hay un resumen cargado y activo
      return;
    }

    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('resumenes')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error("Error loading daily show:", error);
        return;
      }

      const sequence = data.secuencia;
      if (!Array.isArray(sequence) || sequence.length === 0) return;

      // Play first item
      const first = sequence[0];
      let firstContent = null;

      if (first.type === 'noticia') {
        const { getArticleById } = await import('@/lib/data');
        firstContent = await getArticleById(first.id);
      } else {
        const { getVideoById } = await import('@/lib/data');
        firstContent = await getVideoById(first.id);
      }

      if (firstContent) {
        const randomIntro = DAILY_SHOW_INTROS[Math.floor(Math.random() * DAILY_SHOW_INTROS.length)];

        isInitialVideoPicked.current = true;

        if (introTimerRef.current) clearTimeout(introTimerRef.current);

        setState(prev => ({
          ...prev,
          dailyShowSequence: sequence,
          currentSequenceIndex: 0,
          currentContent: firstContent,
          currentIntroUrl: randomIntro,
          isIntroVisible: true,
          shouldPlayContent: true,
          introId: Date.now()
        }));

        introTimerRef.current = setTimeout(() => {
          handleIntroEnded();
        }, 4000);
      }
    } catch (err) {
      console.error("Exception in loadDailyShow:", err);
    }
  }, [handleIntroEnded]);

  const playManual = useCallback((item: Video | Article) => {
    isInitialVideoPicked.current = true; // Evitar que el efecto de carga pise la selección manual
    startTransition(item);
  }, [startTransition]);

  useEffect(() => {
    if (videoPool.length > 0 && !state.currentContent && !isInitialVideoPicked.current) {
      const first = getNextVideo();
      if (first) {
        isInitialVideoPicked.current = true;
        startTransition(first);
      }
    }
  }, [videoPool, state.currentContent, getNextVideo, startTransition]);

  return (
    <MediaPlayerContext.Provider value={{
      state, setVideoPool, playManual,
      prepareNext, triggerTransition,
      handleIntroEnded, handleContentEnded,
      loadDailyShow
    }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export const useMediaPlayer = () => {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error('useMediaPlayer error');
  return context;
};