'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  content: Video | Article;
  shouldPlay: boolean; 
  onEnded: () => void;
  onStart?: () => void;
  muted: boolean;
}

export default function VideoPlayer({ content, shouldPlay, onEnded, onStart, muted }: VideoPlayerProps) {
  const [volume, setVolume] = useState(0); 
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isArticle = 'url_slide' in content || !('url' in content);
  const articleData = isArticle ? (content as Article) : null;
  const videoData = !isArticle ? (content as Video) : null;

  const triggerEnd = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => onEnded(), 500);
  }, [onEnded]);

  const scheduleTimers = useCallback((seconds: number) => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    const ms = seconds * 1000;
    fadeTimerRef.current = setTimeout(() => setIsFadingOut(true), Math.max(0, ms - 500));
    endTimerRef.current = setTimeout(() => onEnded(), ms);
  }, [onEnded]);

  useEffect(() => {
    if (!isArticle || !shouldPlay) return;
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SET_SLIDE_DURATION') scheduleTimers(e.data.durationSeconds);
      if (e.data?.type === 'SLIDE_ENDED') triggerEnd();
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isArticle, shouldPlay, scheduleTimers, triggerEnd]);

  useEffect(() => {
    if (isArticle && shouldPlay) {
      setIsFadingOut(false);
      scheduleTimers(articleData?.animation_duration || 15);
    }
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, [isArticle, shouldPlay, articleData, scheduleTimers]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (shouldPlay && !muted && !isArticle) {
      setVolume(0); 
      let currentVol = 0;
      interval = setInterval(() => {
        currentVol += 0.05; 
        if (currentVol >= 1) { currentVol = 1; if(interval) clearInterval(interval); }
        setVolume(currentVol);
      }, 50); 
    } else if (muted) setVolume(0);
    return () => { if (interval) clearInterval(interval); };
  }, [shouldPlay, muted, isArticle]);

  if (isArticle && articleData?.url_slide) {
    return (
      <div className={cn("w-full h-full bg-black transition-opacity duration-500", isFadingOut ? "opacity-0" : "opacity-100")}>
        <iframe src={articleData.url_slide} className="w-full h-full border-0" scrolling="no" allow="autoplay; fullscreen" sandbox="allow-scripts allow-forms allow-presentation" onLoad={onStart} />
      </div>
    );
  }

  if (videoData) {
    return (
      <ReactPlayer
        url={videoData.url} width="100%" height="100%" playing={shouldPlay} muted={muted} volume={volume}
        onEnded={onEnded} onStart={onStart} playsinline
        config={{ youtube: { playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, fs: 0, disablekb: 1 } } }}
      />
    );
  }
  return null;
}