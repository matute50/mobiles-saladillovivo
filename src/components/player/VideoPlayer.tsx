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

export default function VideoPlayer({
  content,
  shouldPlay,
  onEnded,
  onNearEnd,
  onStart,
  onProgress,
  muted,
  isSharingAction
}: VideoPlayerProps) {
  const [targetVolume, setTargetVolume] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { volume: globalVolume } = useVolume();

  const playerRef = useRef<ReactPlayer>(null);
  const internalPlayerRef = useRef<any>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayCheckRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Determinar tipo de contenido
  const isArticle = content ? ('url_slide' in content || !('url' in content)) : false;
  const articleData = isArticle ? (content as Article) : null;
  const videoData = !isArticle ? (content as Video) : null;

  const { play: playAudio, pause: pauseAudio } = useAudioPlayer(articleData?.audio_url || null);

  const triggerEnd = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => onEnded(), 200);
  }, [onEnded]);

  const handleProgress = useCallback((progress: { playedSeconds: number; loadedSeconds: number }) => {
    if (playerRef.current) {
      const duration = playerRef.current.getDuration();
      if (onProgress) onProgress({ playedSeconds: progress.playedSeconds, duration });

      if (!isFadingOut && duration > 0 && (duration - progress.playedSeconds) < 1.5) {
        setIsFadingOut(true);
        if (onNearEnd) onNearEnd();
      }
    }
  }, [isFadingOut, onNearEnd, onProgress]);

  const handleReady = useCallback((player: any) => {
    setIsPlayerReady(true);
    internalPlayerRef.current = player.getInternalPlayer();
  }, []);

  // Inicialización en cambio de contenido
  useEffect(() => {
    setIsFadingOut(false);
    setIsPlayerReady(false);
    setTargetVolume(0);
    startTimeRef.current = Date.now();

    return () => {
      if (autoplayCheckRef.current) clearInterval(autoplayCheckRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [content]);

  // Autoplay Loop (v24.2 - Optimized interval)
  useEffect(() => {
    if (!shouldPlay || isArticle || !isPlayerReady) return;

    // Reducido CPU usage: 3000ms es suficiente para recovery, reduce wake-ups en 50%
    autoplayCheckRef.current = setInterval(() => {
      if (!internalPlayerRef.current) return;
      try {
        const p = internalPlayerRef.current;
        if (p) {
          const state = p.getPlayerState();
          if ([2, 5, -1].includes(state)) {
            p.playVideo();
          }
          if (typeof p.setVolume === 'function') p.setVolume(targetVolume * 100);
          if (muted && typeof p.mute === 'function') p.mute();
          else if (!muted && typeof p.unMute === 'function') p.unMute();
        }
      } catch (e) { }
    }, 3000);

    return () => {
      if (autoplayCheckRef.current) clearInterval(autoplayCheckRef.current);
    };
  }, [shouldPlay, isArticle, isPlayerReady, muted, targetVolume]);

  // Volume Loop (v24.2 - RAF Optimization)
  // ✅ Optimización CPU -> GPU sync
  useEffect(() => {
    let rafId: number;

    const updateVolume = () => {
      setTargetVolume(prev => {
        const multiplier = (videoData && videoData.volumen_extra) ? videoData.volumen_extra : 1;
        if (shouldPlay && !muted && !isArticle && isPlayerReady && !isFadingOut) {
          const finalGoal = Math.min(1, globalVolume * multiplier);
          if (prev >= finalGoal) return finalGoal;
          // Ajustado para 60fps: 0.14 cada ~16ms ≈ mismo rate que 150ms interval
          return Math.min(finalGoal, prev + 0.00233);
        } else {
          if (prev <= 0) return 0;
          return Math.max(0, prev - 0.00133);
        }
      });
      rafId = requestAnimationFrame(updateVolume);
    };

    rafId = requestAnimationFrame(updateVolume);
    return () => cancelAnimationFrame(rafId);
  }, [globalVolume, isArticle, isFadingOut, isPlayerReady, muted, shouldPlay, videoData]);

  // Audio Side Effect (Articles)
  useEffect(() => {
    if (isArticle && shouldPlay && !isFadingOut && articleData?.audio_url) {
      playAudio();
      const duration = (articleData.animation_duration || 45) * 1000;

      if (!fadeTimerRef.current) {
        fadeTimerRef.current = setTimeout(() => triggerEnd(), duration);
      }

      const nearEndTimer = setTimeout(() => {
        if (onNearEnd) onNearEnd();
      }, Math.max(0, duration - 1000));

      return () => {
        clearTimeout(nearEndTimer);
        if (!shouldPlay) {
          if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = null;
          }
          pauseAudio();
        }
      };
    } else {
      pauseAudio();
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    }
  }, [isArticle, shouldPlay, isFadingOut, articleData, playAudio, pauseAudio, triggerEnd, onNearEnd]);

  // Fetch HTML Slide content (v25.0 - With simple cache)
  const [slideHtml, setSlideHtml] = useState<string | null>(null);
  const slideCacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (articleData?.url_slide) {
      if (slideCacheRef.current[articleData.url_slide]) {
        setSlideHtml(slideCacheRef.current[articleData.url_slide]);
        return;
      }
      const fetchAndProcess = async () => {
        try {
          const res = await fetch(articleData.url_slide!);
          if (!res.ok) throw new Error("Failed to load slide");
          const originalHtml = await res.text();
          const baseUrl = articleData.url_slide!.substring(0, articleData.url_slide!.lastIndexOf('/') + 1);
          const responsiveStyles = `
            <base href="${baseUrl}">
            <style>
              @media (orientation: landscape) {
                h1, h2, .titulo, .title, [class*="titulo"], [class*="title"] {
                  font-size: 6vh !important;
                  line-height: 1.1 !important;
                  max-width: 90vw !important;
                  box-sizing: border-box !important;
                }
                p, .bajada, .description {
                  font-size: 3.5vh !important;
                  line-height: 1.3 !important;
                  max-width: 90vw !important;
                }
              }
            </style>
          `;
          const modifiedHtml = originalHtml.includes('</head>')
            ? originalHtml.replace('</head>', `${responsiveStyles}</head>`)
            : responsiveStyles + originalHtml;

          slideCacheRef.current[articleData.url_slide!] = modifiedHtml;
          setSlideHtml(modifiedHtml);
        } catch (err) {
          setSlideHtml(null);
        }
      };
      fetchAndProcess();
    }
  }, [articleData?.url_slide]);

  if (!content) return <div className="w-full h-full bg-black" />;

  // RENDER ARTICLE
  if (isArticle && articleData?.url_slide) {
    return (
      <div className="w-full h-full bg-black relative">
        <iframe
          key={articleData.url_slide}
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
            <img
              src={articleData.imagen}
              alt="Poster"
              className="w-full h-full object-cover opacity-50"
              onLoad={() => setIsPlayerReady(true)}
              loading="eager"
            />
          </div>
        )}
      </div>
    );
  }

  // RENDER VIDEO
  if (videoData) {
    return (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <div className={cn(
          "absolute left-0 right-0 bg-black z-50 pointer-events-none transition-all duration-500",
          isSharingAction ? "h-20" : "h-0",
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
            isSharingAction ? "transform scale(1.25)" : "transform scale(1.0) transition-transform duration-500 ease-in-out"
          )}
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
            progressInterval={200}
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
        <div className="absolute inset-0 z-20 bg-transparent cursor-default pointer-events-auto" />
      </div>
    );
  }

  return <div className="w-full h-full bg-black" />;
}
