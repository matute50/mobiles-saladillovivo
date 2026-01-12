'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OnProgressProps } from 'react-player/base';

interface VideoPlayerProps {
  content: Video | Article | null;
  isActive: boolean;
  shouldPreload?: boolean;
  onEnded: () => void;
  muted?: boolean; 
  isPlaying: boolean;
}

export default function VideoPlayer({ 
  content, 
  isActive, 
  onEnded, 
  muted = true, 
  isPlaying = true 
}: VideoPlayerProps) {
  
  const playerRef = useRef<ReactPlayer>(null);
  
  // Estado para controlar el Fade Out (Salida)
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Estado para controlar el Fade In (Entrada suave)
  const [isLoaded, setIsLoaded] = useState(false);

  // Referencia para guardar la duración total del video YouTube
  const durationRef = useRef<number>(0);

  // --- 1. LÓGICA DE RESETEO AL CAMBIAR CONTENIDO ---
  useEffect(() => {
    // Cada vez que entra un video nuevo, reseteamos visuales
    setIsFadingOut(false);
    setIsLoaded(false); 
    durationRef.current = 0;
  }, [content]);

  // --- 2. LÓGICA PARA ARTÍCULOS (.html) ---
  useEffect(() => {
    const isArticle = content && !('url' in content && typeof (content as Video).url === 'string');
    
    if (!isArticle || !isPlaying || !isActive) return;

    const article = content as Article;
    const totalDuration = (article.animation_duration || 15) * 1000;
    const fadeDuration = 500; // 0.5 seg de fade out

    // Timer para iniciar el desvanecimiento final
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, totalDuration - fadeDuration);

    // Timer para terminar
    const endTimer = setTimeout(() => {
      onEnded();
    }, totalDuration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [content, isPlaying, isActive, onEnded]);

  // --- 3. LÓGICA PARA VIDEOS YOUTUBE (Corte Anticipado) ---
  const handleDuration = (duration: number) => {
    durationRef.current = duration;
  };

  const handleProgress = (state: OnProgressProps) => {
    if (!durationRef.current || durationRef.current === 0) return;

    // Calculamos cuánto falta para terminar
    const timeLeft = durationRef.current - state.playedSeconds;

    // FADE OUT: Si falta menos de 0.6 segundos, empezamos a desvanecer
    // (Usamos 0.6 para asegurar que la animación de 0.5s se vea completa)
    if (timeLeft < 0.6 && !isFadingOut) {
      setIsFadingOut(true);
    }

    // KILL SWITCH: Si falta menos de 0.2 segundos, cortamos YA.
    // Esto evita que llegue al segundo 0.0 y muestre la grilla de YouTube.
    if (timeLeft < 0.2) {
      onEnded();
    }
  };


  // --- RENDERIZADO ---
  if (!content) return <div className="w-full h-full bg-black" />;

  // A. ES UN VIDEO (YouTube / Mp4)
  if ('url' in content && typeof (content as any).url === 'string' && !('url_slide' in content)) {
    const video = content as Video;
    return (
      <div className="w-full h-full bg-black overflow-hidden relative">
        <div 
          className={cn(
            "w-full h-full transition-opacity duration-500 ease-in-out",
            // Se ve solo si cargó Y no se está yendo
            (isLoaded && !isFadingOut) ? "opacity-100" : "opacity-0"
          )}
        >
            <ReactPlayer
              ref={playerRef}
              url={video.url}
              width="100%"
              height="100%"
              playing={isActive && isPlaying}
              muted={muted} 
              volume={1}
              
              // EVENTOS CRÍTICOS
              onReady={() => setIsLoaded(true)} // Fade In al cargar
              onDuration={handleDuration}       // Guardamos duración total
              onProgress={handleProgress}       // Monitoreamos el final
              onEnded={onEnded}                 // Fallback por si acaso
              
              playsinline={true} 
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 1,
                    controls: 0,        
                    modestbranding: 1,  
                    rel: 0,             
                    showinfo: 0,
                    iv_load_policy: 3,  
                    fs: 0,              
                    disablekb: 1,       
                  }
                }
              }}
            />
        </div>
      </div>
    );
  }

  // B. ES UN ARTÍCULO (SLIDE .HTML)
  const article = content as Article;
  
  const slideUrl = article.url_slide 
    ? `${article.url_slide}?t=${new Date().getTime()}` 
    : null;

  if (!slideUrl) {
     return <div className="w-full h-full bg-black flex items-center justify-center text-white">Sin slide disponible</div>;
  }

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
        {/* Contenedor del Slide con doble transición: Entrada (Load) y Salida (End) */}
        <div 
          className={cn(
            "w-full h-full transition-opacity duration-700 ease-in-out", 
            (isLoaded && !isFadingOut) ? "opacity-100" : "opacity-0"
          )}
        >
          <iframe
              key={article.id} 
              src={slideUrl}
              className="w-full h-full border-0 pointer-events-none"
              scrolling="no"
              title={article.titulo}
              loading="eager"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setIsLoaded(true)}
          />
        </div>
    </div>
  );
}