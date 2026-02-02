'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useVolume } from '@/context/VolumeContext';

interface VideoPlayerProps {
  content: Video | Article | null;
  shouldPlay: boolean;
  onEnded: () => void;
  onNearEnd?: () => void;
  onStart?: () => void;
  onProgress?: (data: { playedSeconds: number; duration: number }) => void;
  muted: boolean;
}

export default function VideoPlayer({ content, shouldPlay, onEnded, onNearEnd, onStart, onProgress, muted }: VideoPlayerProps) {
  const [targetVolume, setTargetVolume] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { volume: globalVolume } = useVolume();
  const playerRef = useRef<ReactPlayer>(null);
  const internalPlayerRef = useRef<any>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayCheckRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  if (!content) return <div className="w-full h-full bg-black" />;

  const isArticle = 'url_slide' in content || !('url' in content);
  const articleData = isArticle ? (content as Article) : null;
  const videoData = !isArticle ? (content as Video) : null;

  const { play: playAudio, pause: pauseAudio } = useAudioPlayer(articleData?.audio_url || null);

  const triggerEnd = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => onEnded(), 500); // 0.5s para fade out (Skill v4.0)
  }, [onEnded]);

  useEffect(() => {
    setIsFadingOut(false);
    setIsPlayerReady(false);
    setTargetVolume(0);
    startTimeRef.current = Date.now();

    if (autoplayCheckRef.current) clearInterval(autoplayCheckRef.current);
  }, [content]);

  // REINTENTO AGRESIVO DE AUTOPLAY (Skill Rule)
  useEffect(() => {
    if (shouldPlay && isPlayerReady && !isArticle && videoData) {
      autoplayCheckRef.current = setInterval(() => {
        if (!internalPlayerRef.current) return;

        try {
          const state = internalPlayerRef.current.getPlayerState();
          const elapsed = (Date.now() - startTimeRef.current) / 1000;

          // PAUSED (2), CUED (5), UNSTARTED (-1) -> Force Play
          if ([2, 5, -1].includes(state)) {
            internalPlayerRef.current.playVideo();
          }

          // Bloqueador de Pausas en los primeros 10 segundos
          if (state === 2 && elapsed < 10) {
            internalPlayerRef.current.playVideo();
          }
        } catch (e) { }
      }, 1000);
    }
    return () => { if (autoplayCheckRef.current) clearInterval(autoplayCheckRef.current); };
  }, [shouldPlay, isPlayerReady, isArticle, videoData]);

  // Gestión de FADE-IN y FADE-OUT de Audio (Ajustado a v4.4: Sin reinicios de efecto)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    interval = setInterval(() => {
      setTargetVolume(prev => {
        if (shouldPlay && !muted && !isArticle && isPlayerReady && !isFadingOut) {
          // Fade In
          if (prev >= globalVolume) return globalVolume;
          return Math.min(globalVolume, prev + 0.05);
        } else {
          // Fade Out (si está mutado, en fade out, o no debe sonar)
          if (prev <= 0) return 0;
          return Math.max(0, prev - 0.05);
        }
      });
    }, 20);

    return () => { if (interval) clearInterval(interval); };
  }, [shouldPlay, muted, isArticle, isPlayerReady, isFadingOut, globalVolume]);

  const handleProgress = (progress: { playedSeconds: number; loadedSeconds: number }) => {
    if (playerRef.current) {
      const duration = playerRef.current.getDuration();
      if (onProgress) onProgress({ playedSeconds: progress.playedSeconds, duration });

      // Regla de Oro v4.2: Detección anticipada robusta (1.5s antes del fin)
      // Usamos 1.5s como margen de seguridad para asegurar que la intro cubra el final.
      if (!isFadingOut && duration > 0 && (duration - progress.playedSeconds) < 1.5) {
        setIsFadingOut(true);
        if (onNearEnd) onNearEnd();
      }
    }
  };

  const handleReady = (player: any) => {
    setIsPlayerReady(true);
    internalPlayerRef.current = player.getInternalPlayer();
  };

  useEffect(() => {
    if (isArticle && shouldPlay && !isFadingOut && articleData?.audio_url) {
      playAudio();
      const duration = (articleData?.animation_duration || 45) * 1000;
      fadeTimerRef.current = setTimeout(() => triggerEnd(), duration);
    } else {
      pauseAudio();
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    }
    return () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current); };
  }, [isArticle, shouldPlay, isFadingOut, playAudio, pauseAudio, articleData, triggerEnd]);

  if (isArticle && articleData?.url_slide) {
    return (
      <div className={cn("w-full h-full bg-black transition-opacity duration-700", isFadingOut ? "opacity-0" : "opacity-100")}>
        <iframe
          src={articleData.url_slide}
          className="w-full h-full border-0"
          scrolling="no"
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-forms allow-presentation"
          onLoad={onStart}
        />
        {!isPlayerReady && articleData.imagen && (
          <div className="absolute inset-0 bg-black">
            {/* Optimización LCP: priority={true} para evitar el warning de Largest Contentful Paint */}
            <img
              src={articleData.imagen}
              alt="Poster"
              className="w-full h-full object-cover opacity-50"
              onLoad={() => setIsPlayerReady(true)}
              loading="eager"
              {...({ fetchPriority: "high" } as any)}
            />
          </div>
        )}
      </div>
    );
  }

  if (videoData) {
    return (
      <div className="w-full h-full bg-black relative overflow-hidden transition-opacity duration-700" style={{ opacity: isFadingOut ? 0 : 1 }}>
        {/* ANTI-BRANDING 5.2 (Escala Original 100%) */}
        <div className="absolute inset-0 w-full h-full left-0 top-0">
          <ReactPlayer
            ref={playerRef}
            url={videoData.url}
            width="100%"
            height="100%"
            playing={shouldPlay}
            volume={targetVolume}
            muted={muted}
            onEnded={triggerEnd}
            onStart={onStart}
            onReady={handleReady}
            onProgress={handleProgress}
            progressInterval={200} // Mayor precisión de reporte (Skill Rule)
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  controls: 0,
                  showinfo: 0,
                  rel: 0,
                  iv_load_policy: 3,
                  disablekb: 1,
                  fs: 0,
                  autohide: 1,
                  enablejsapi: 1,
                  origin: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : ''
                }
              }
            }}
          />
        </div>

        {/* BLOQUEO TOTAL DE INTERACCIÓN NATIVA (Anti-Share, Anti-YouTube branding) */}
        <div className="absolute inset-0 z-20 bg-transparent cursor-default pointer-events-auto" />
      </div>
    );
  }

  return <div className="w-full h-full bg-black" />;
}
