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
  isSharingAction?: boolean;
}

export default function VideoPlayer({ content, shouldPlay, onEnded, onNearEnd, onStart, onProgress, muted, isSharingAction }: VideoPlayerProps) {
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

      // Timer para Near End (1s antes para Crossfade con Intro)
      const nearEndDuration = Math.max(0, duration - 1000);
      const nearEndTimer = setTimeout(() => {
        if (onNearEnd) onNearEnd();
      }, nearEndDuration);

      return () => {
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        clearTimeout(nearEndTimer);
        pauseAudio();
      };
    } else {
      pauseAudio();
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    }
  }, [isArticle, shouldPlay, isFadingOut, playAudio, pauseAudio, articleData, triggerEnd, onNearEnd]);

  const [slideHtml, setSlideHtml] = useState<string | null>(null);

  useEffect(() => {
    if (articleData?.url_slide) {
      const fetchAndProcess = async () => {
        try {
          const res = await fetch(articleData.url_slide!);
          if (!res.ok) throw new Error("Failed to load slide");
          const originalHtml = await res.text();

          const baseUrl = articleData.url_slide!.substring(0, articleData.url_slide!.lastIndexOf('/') + 1);

          // Inyección inteligente: Base URL + CSS Responsivo
          const responsiveStyles = `
            <base href="${baseUrl}">
            <style>
              @media (orientation: landscape) {
                h1, h2, .titulo, .title, [class*="titulo"], [class*="title"] {
                  font-size: 6vh !important;
                  line-height: 1.1 !important;
                  margin-bottom: 0.5rem !important;
                }
                p, .bajada, .description {
                  font-size: 3vh !important;
                  line-height: 1.4 !important;
                }
                /* Ajustar padding del contenedor si es necesario */
                body {
                  padding: 0 4vw !important;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                }
              }
            </style>
          `;

          // Insertar antes del cierre de head, o al principio si no hay head
          const modifiedHtml = originalHtml.includes('</head>')
            ? originalHtml.replace('</head>', `${responsiveStyles}</head>`)
            : responsiveStyles + originalHtml;

          setSlideHtml(modifiedHtml);
        } catch (err) {
          console.warn("Could not fetch slide content for styling, falling back to direct iframe", err);
          setSlideHtml(null);
        }
      };

      fetchAndProcess();
    }
  }, [articleData?.url_slide]);

  if (isArticle && articleData?.url_slide) {
    return (
      // v20.0: Eliminado fade-out visual (opacity permanece 100). La intro cubre esto.
      <div className="w-full h-full bg-black opacity-100">
        <iframe
          key={articleData.url_slide} // Force re-render on change
          src={!slideHtml ? articleData.url_slide : undefined}
          srcDoc={slideHtml || undefined}
          className="w-full h-full border-0"
          scrolling="no"
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-forms allow-presentation allow-same-origin"
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
      // v20.0: Eliminado fade-out visual. Opacity fija a 1.
      <div className="w-full h-full bg-black relative overflow-hidden" style={{ opacity: 1 }}>
        {/* ANTI-BRANDING 11.0 (Armored Zoom 125% + Heavy Cinema Bars) */}
        <div className={cn(
          "absolute left-0 right-0 bg-black z-50 pointer-events-none transition-all duration-500",
          isSharingAction ? "h-20" : "h-0", // 80px protection
          "top-0"
        )} />
        <div className={cn(
          "absolute left-0 right-0 bg-black z-50 pointer-events-none transition-all duration-500",
          isSharingAction ? "h-20" : "h-0",
          "bottom-0"
        )} />

        <div
          className={cn(
            "absolute inset-0 w-full h-full left-0 top-0 will-change-transform",
            isSharingAction ? "transition-none" : "transition-transform duration-500 ease-in-out"
          )}
          style={{ transform: isSharingAction ? 'scale(1.25)' : 'scale(1.0)' }}
        >
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
