'use client';

import React, { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';

interface VideoPlayerProps {
  content: Video | Article | null;
  isActive: boolean;
  shouldPreload?: boolean;
  onEnded: () => void;
  muted?: boolean; // CAMBIO: Renombrado de forceMute a muted para ser más claro
  isPlaying: boolean;
}

export default function VideoPlayer({ 
  content, 
  isActive, 
  onEnded, 
  muted = true, // Por defecto true para autoplay
  isPlaying = true 
}: VideoPlayerProps) {
  
  const playerRef = useRef<ReactPlayer>(null);

  // --- LÓGICA DE TIEMPO PARA ARTÍCULOS (.html) ---
  useEffect(() => {
    const isArticle = content && !('url' in content && typeof (content as Video).url === 'string');
    
    if (!isArticle || !isPlaying || !isActive) return;

    const article = content as Article;
    const duration = (article.animation_duration || 15) * 1000;

    const timer = setTimeout(() => {
      onEnded();
    }, duration);

    return () => clearTimeout(timer);
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
          muted={muted} // AQUI SE APLICA EL MUTE CONTROLADO POR EL BOTÓN
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
        <iframe
            key={article.id} 
            src={slideUrl}
            className="w-full h-full border-0 pointer-events-none"
            scrolling="no"
            title={article.titulo}
            loading="eager"
            sandbox="allow-scripts allow-same-origin"
        />
    </div>
  );
}