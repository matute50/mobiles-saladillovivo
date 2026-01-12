'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';

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
  
  // Estado para controlar el Fade Out final
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // NUEVO: Estado para controlar el Fade In inicial (evita parpadeos)
  const [isLoaded, setIsLoaded] = useState(false);

  // --- LÓGICA DE TIEMPO PARA ARTÍCULOS (.html) ---
  useEffect(() => {
    const isArticle = content && !('url' in content && typeof (content as Video).url === 'string');
    
    // Reseteamos estados visuales al cambiar de contenido
    setIsFadingOut(false);
    setIsLoaded(false); // <--- Importante: Ocultamos hasta que cargue el nuevo

    if (!isArticle || !isPlaying || !isActive) return;

    const article = content as Article;
    const totalDuration = (article.animation_duration || 15) * 1000;
    const fadeDuration = 500; 

    // Timer para iniciar el desvanecimiento final
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, totalDuration - fadeDuration);

    // Timer para terminar y cambiar de video
    const endTimer = setTimeout(() => {
      onEnded();
    }, totalDuration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [content, isPlaying, isActive, onEnded]);


  // --- RENDERIZADO ---
  if (!content) return <div className="w-full h-full bg-black" />;

  // 1. ES UN VIDEO (YouTube / Mp4)
  if ('url' in content && typeof (content as any).url === 'string' && !('url_slide' in content)) {
    const video = content as Video;
    return (
      <div className="w-full h-full bg-black">
        <ReactPlayer
          ref={playerRef}
          url={video.url}
          width="100%"
          height="100%"
          playing={isActive && isPlaying}
          muted={muted} 
          volume={1}
          onEnded={onEnded}
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
    );
  }

  // 2. ES UN ARTÍCULO (SLIDE .HTML)
  const article = content as Article;
  
  const slideUrl = article.url_slide 
    ? `${article.url_slide}?t=${new Date().getTime()}` 
    : null;

  if (!slideUrl) {
     return <div className="w-full h-full bg-black flex items-center justify-center text-white">Sin slide disponible</div>;
  }

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
        {/* LÓGICA DE VISIBILIDAD:
            - isLoaded && !isFadingOut -> Opacity 100 (Visible)
            - !isLoaded (Cargando) -> Opacity 0 (Invisible/Negro)
            - isFadingOut (Terminando) -> Opacity 0 (Invisible/Negro)
        */}
        <div 
          className={cn(
            "w-full h-full transition-opacity duration-700 ease-in-out", // Aumenté a 700ms para mayor suavidad
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
              // ESTO ES CLAVE: Cuando el HTML termina de cargar, hacemos visible el contenedor
              onLoad={() => setIsLoaded(true)}
          />
        </div>
        
        {/* Loader opcional (mientras está en negro) */}
        {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
               {/* Puedes poner un spinner aquí si quieres, o dejarlo negro limpio */}
            </div>
        )}
    </div>
  );
}