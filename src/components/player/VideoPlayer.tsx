'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OnProgressProps } from 'react-player/base';

interface VideoPlayerProps {
  content: Video | Article;
  shouldPlay: boolean; // Controlado por la lógica Z-index (4s rule)
  onEnded: () => void;
  muted: boolean;
}

export default function VideoPlayer({ 
  content, 
  shouldPlay, 
  onEnded, 
  muted
}: VideoPlayerProps) {
  
  const playerRef = useRef<ReactPlayer>(null);
  const [internalVolume, setInternalVolume] = useState(0); // Arrancamos en 0 para el Fade In
  const [isReady, setIsReady] = useState(false);
  
  const isArticle = 'url_slide' in content || !('url' in content);
  const articleData = isArticle ? (content as Article) : null;
  const videoData = !isArticle ? (content as Video) : null;

  // --- REGLA: Fade In de volumen al iniciar (0 a 100% en 0.5s) ---
  useEffect(() => {
    if (shouldPlay && !muted) {
        // Simular Fade In
        let vol = 0;
        const interval = setInterval(() => {
            vol += 0.1;
            if (vol >= 1) {
                vol = 1;
                clearInterval(interval);
            }
            setInternalVolume(vol);
        }, 50); // 10 pasos de 50ms = 500ms
        return () => clearInterval(interval);
    } else if (muted) {
        setInternalVolume(0);
    }
  }, [shouldPlay, muted]);

  // --- REGLA: Recordar volumen anterior (Implementación simple por ahora) ---
  // Nota: Para la regla de "igual volumen que tenía 10s antes", idealmente
  // el contexto pasaría un prop `initialVolume`. Por ahora usamos 100% tras fade.

  // --- LOGICA NOTICIAS (Slides) ---
  useEffect(() => {
    if (isArticle && shouldPlay) {
        const durationSec = articleData?.animation_duration || 15;
        const timer = setTimeout(() => {
            onEnded();
        }, durationSec * 1000);
        return () => clearTimeout(timer);
    }
  }, [isArticle, shouldPlay, articleData, onEnded]);


  if (isArticle) {
     if (!articleData?.url_slide) return null;
     return (
        <iframe 
           src={articleData.url_slide}
           className="w-full h-full border-0 bg-black"
           scrolling="no"
           // El slide carga inmediatamente, pero está oculto por la Capa Z-20 hasta que termina la intro
        />
     );
  }

  if (videoData) {
     return (
        <ReactPlayer
            ref={playerRef}
            url={videoData.url}
            width="100%"
            height="100%"
            playing={shouldPlay} // Aquí ocurre la magia: playing={true} mientras está tapado por la intro
            muted={muted} // O el usuario lo muteó
            volume={internalVolume} // Controlado por el Fade In
            onEnded={onEnded}
            onReady={() => setIsReady(true)}
            playsinline
            config={{
                youtube: {
                    playerVars: {
                        controls: 0, 
                        modestbranding: 1, 
                        showinfo: 0, 
                        rel: 0,
                        iv_load_policy: 3,
                        disablekb: 1
                    }
                }
            }}
            style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.5s' }}
        />
     );
  }

  return null;
}