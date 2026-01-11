'use client';

import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player'; 
import { Video, Article } from '@/lib/types';

interface VideoPlayerProps {
  content: Video | Article | null;
  isActive: boolean;
  shouldPreload: boolean;
  onEnded: () => void;
  onProgress?: (state: { playedSeconds: number; loadedSeconds: number; played: number }) => void;
  forceMute?: boolean;
  isPlaying?: boolean; 
}

export default function VideoPlayer({ 
  content, 
  isActive, 
  shouldPreload, 
  onEnded, 
  onProgress, 
  forceMute = false,
  isPlaying = true 
}: VideoPlayerProps) {
  const [hasWindow, setHasWindow] = useState(false);

  useEffect(() => {
    setHasWindow(true);
  }, []);

  if (!content || (!isActive && !shouldPreload)) return null;

  // 1. GESTIÓN DE NOTICIAS (SLIDES .HTML)
  if ('url_slide' in content && content.url_slide) {
    if (!isActive) return null;
    
    const c = content as any;
    const dbValue = c.animation_duration || c.duration || c.duracion;
    const durationSec = Number(dbValue); 
    
    // Sin buffers, tiempo estricto
    const DEFAULT_DURATION = 45000; 
    const strictDurationMs = durationSec > 0 ? durationSec * 1000 : DEFAULT_DURATION;

    return (
      <div className="absolute inset-0 w-full h-full z-20 bg-black">
        <iframe 
          src={content.url_slide} 
          className="w-full h-full border-0"
          allow="autoplay"
          title={content.titulo}
          style={{ pointerEvents: 'none' }}
        />
        <TimerOnEnd duration={strictDurationMs} onEnded={onEnded} /> 
      </div>
    );
  }

  // 2. GESTIÓN DE VIDEOS
  const videoUrl = (content as Video).url;
  const volume = (forceMute || !isActive) ? 0 : 1;
  const shouldPlay = isActive ? (forceMute ? true : isPlaying) : false;

  if (!hasWindow) return null;

  return (
    <div className={`absolute inset-0 w-full h-full ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
      <ReactPlayer
        url={videoUrl}
        width="100%"
        height="100%"
        playing={shouldPlay}
        volume={volume}
        muted={volume === 0} 
        onEnded={onEnded}
        onProgress={onProgress}
        onError={(e) => console.error("❌ Error reproduciendo:", videoUrl, e)}
        playsinline={true}
        style={{ pointerEvents: 'none', objectFit: 'cover' }} 
        config={{ 
          youtube: { 
            playerVars: { 
              autoplay: 1,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              disablekb: 1,
              fs: 0,
              iv_load_policy: 3,
              playsinline: 1,
              origin: typeof window !== 'undefined' ? window.location.origin : undefined
            } 
          },
          file: { 
            attributes: { 
              style: { objectFit: 'cover', width: '100%', height: '100%' },
              autoPlay: true,
              muted: volume === 0,
              playsInline: true,
              crossOrigin: "anonymous"
            },
            forceVideo: true 
          }
        }}
      />
    </div>
  );
}

function TimerOnEnd({ duration, onEnded }: { duration: number, onEnded: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onEnded, duration);
    return () => clearTimeout(timer);
  }, [duration, onEnded]);
  return null;
}