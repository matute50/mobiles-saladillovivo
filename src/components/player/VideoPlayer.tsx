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
  onStart?: () => void;
  onProgress?: (data: { playedSeconds: number; duration: number }) => void;
  muted: boolean;
}

export default function VideoPlayer({ content, shouldPlay, onEnded, onStart, onProgress, muted }: VideoPlayerProps) {
  const [targetVolume, setTargetVolume] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { volume: globalVolume } = useVolume();
  const playerRef = useRef<ReactPlayer>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (!content) return <div className="w-full h-full bg-black" />;

  const isArticle = 'url_slide' in content || !('url' in content);
  const articleData = isArticle ? (content as Article) : null;
  const videoData = !isArticle ? (content as Video) : null;

  const { play: playAudio, pause: pauseAudio } = useAudioPlayer(articleData?.audio_url || null);

  const triggerEnd = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => onEnded(), 800);
  }, [onEnded]);

  useEffect(() => {
    setIsFadingOut(false);
    setIsPlayerReady(false);
    setTargetVolume(0);
  }, [content]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (shouldPlay && !muted && !isArticle && isPlayerReady && !isFadingOut) {
      let currentVol = 0;
      interval = setInterval(() => {
        currentVol += 0.02;
        if (currentVol >= globalVolume) {
          currentVol = globalVolume;
          if (interval) clearInterval(interval);
        }
        setTargetVolume(currentVol);
      }, 20);
    } else if (muted || isFadingOut) {
      let currentVol = targetVolume;
      interval = setInterval(() => {
        currentVol -= 0.05;
        if (currentVol <= 0) {
          currentVol = 0;
          if (interval) clearInterval(interval);
        }
        setTargetVolume(currentVol);
      }, 20);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [shouldPlay, muted, isArticle, isPlayerReady, isFadingOut, globalVolume, targetVolume]);

  const handleProgress = (progress: { playedSeconds: number; loadedSeconds: number }) => {
    if (playerRef.current) {
      const duration = playerRef.current.getDuration();
      if (onProgress) onProgress({ playedSeconds: progress.playedSeconds, duration });

      if (!isFadingOut && duration > 0 && duration - progress.playedSeconds < 1.2) {
        setIsFadingOut(true);
      }
    }
  };

  useEffect(() => {
    if (isArticle && shouldPlay && !isFadingOut) {
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
            <img src={articleData.imagen} alt="Poster" className="w-full h-full object-cover opacity-50" onLoad={() => setIsPlayerReady(true)} />
          </div>
        )}
      </div>
    );
  }

  if (videoData) {
    return (
      <div className="w-full h-full bg-black relative overflow-hidden transition-opacity duration-700" style={{ opacity: isFadingOut ? 0 : 1 }}>
        <div className="absolute inset-0 w-full h-[110%] -top-[5%] pointer-events-none">
          <ReactPlayer
            ref={playerRef}
            url={videoData.url}
            width="100%"
            height="100%"
            playing={shouldPlay && !isFadingOut}
            volume={targetVolume}
            muted={muted}
            onEnded={triggerEnd}
            onStart={onStart}
            onReady={() => setIsPlayerReady(true)}
            onProgress={handleProgress}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  controls: 0,
                  showinfo: 0,
                  rel: 0,
                  iv_load_policy: 3,
                  origin: typeof window !== 'undefined' ? window.location.origin : ''
                }
              }
            }}
          />
        </div>
        <div className="absolute inset-0 z-10 pointer-events-none bg-transparent" />
      </div>
    );
  }

  return <div className="w-full h-full bg-black" />;
}
