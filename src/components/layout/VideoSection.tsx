'use client';

import React, { useState, useEffect } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import VideoPlayer from '@/components/player/VideoPlayer'; 
import { cn } from '@/lib/utils';
import ReactPlayer from 'react-player';
import { Play, Pause } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'google-cast-launcher': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export default function VideoSection({ isMobile }: { isMobile?: boolean }) {
  const { state, handleContentEnded } = useMediaPlayer();
  const { currentContent, currentIntro, isIntroVisible } = state;
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showBars, setShowBars] = useState(false);

  // Forzar arranque al cambiar contenido
  useEffect(() => {
    if (currentContent || isIntroVisible) {
      setIsPlaying(true);
      setShowBars(false); 
    }
  }, [currentContent, isIntroVisible]);

  useEffect(() => {
    if (!showControls || !isPlaying) return; 
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowBars(true);
    } else {
      const timer = setTimeout(() => {
        setShowBars(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  const handleInteraction = () => {
    setShowControls(true);
  };

  return (
    <div 
      className="w-full bg-black relative aspect-video overflow-hidden shadow-sm group select-none"
      onMouseEnter={handleInteraction}
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
    >
       {/* === CAPA INFERIOR: CONTENIDO PRINCIPAL === */}
       {/* El slide/video principal se mantiene visible debajo hasta que el intro lo tape visualmente */}
       <div className="absolute inset-0 z-10">
          <VideoPlayer 
            content={currentContent}
            isActive={true} 
            shouldPreload={false}
            onEnded={handleContentEnded}
            forceMute={isIntroVisible}
            isPlaying={isPlaying} 
          />
       </div>

       {/* === CAPA SUPERIOR: INTRO === */}
       <div 
         className={cn(
           // CORRECCIÓN 1: Quitamos 'bg-black'. Ahora es transparente para no tapar el slide mientras carga.
           // CORRECCIÓN 2: 'pointer-events-auto' para permitir dar Play manual si el navegador bloquea el audio.
           "absolute inset-0 z-40 transition-none", 
           isIntroVisible ? "block pointer-events-auto" : "hidden pointer-events-none" 
         )}
       >
         {isIntroVisible && currentIntro && (
            <ReactPlayer
              key={currentIntro} 
              url={currentIntro}
              playing={true} // Forzamos true ignorando estado global
              width="100%"
              height="100%"
              volume={1}
              muted={false}
              playsinline
              // CORRECCIÓN 3: El fondo negro lo tiene el player, así solo tapa cuando carga el video
              style={{ backgroundColor: 'black' }} 
              
              onReady={() => setIsPlaying(true)}
              onError={(e) => {
                console.error("Intro Error, saltando...", e);
                handleContentEnded(); 
              }}
              config={{
                file: { 
                  attributes: { 
                    autoPlay: true,
                    preload: 'auto',
                    style: { objectFit: 'cover', width: '100%', height: '100%' } 
                  } 
                }
              }}
              onEnded={handleContentEnded}
            />
         )}
       </div>

       {/* === BANDAS NEGRAS === */}
       {showBars && (
         <>
            <div className="absolute top-0 left-0 right-0 h-[16%] bg-black z-30 animate-in fade-in" />
            <div className="absolute bottom-0 left-0 right-0 h-[16%] bg-black z-30 animate-in fade-in" />
         </>
       )}

       {/* === CONTROLES === */}
       <div 
         className={cn(
           "absolute inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-300",
           showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
         )}
       >
          <button 
            onClick={togglePlay}
            className="p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 transition-transform active:scale-95 text-white shadow-xl"
          >
            {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
          </button>

          <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
             <google-cast-launcher style={{ width: '40px', height: '40px', display: 'block' }}></google-cast-launcher>
          </div>
       </div>
    </div>
  );
}