'use client';

import React, { useState, useEffect } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import VideoPlayer from '@/components/player/VideoPlayer'; 
import { cn } from '@/lib/utils';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

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
  const [isUserMuted, setIsUserMuted] = useState(true);

  // Estado para las barras negras
  const [showBars, setShowBars] = useState(true);

  // --- LÓGICA DE BARRAS DE CINE ---
  useEffect(() => {
    if (isIntroVisible) {
      setShowBars(true); 
    } else {
      // CAMBIO: Aumentado a 2000ms (2 segundos)
      // Esto da 1 segundo extra de cobertura y permite el fade-out final
      const timer = setTimeout(() => setShowBars(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isIntroVisible]);

  // Auto-ocultar controles
  useEffect(() => {
    if (!showControls || !isPlaying) return; 
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls, isPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsPlaying(!isPlaying);
    setShowControls(true);
    if (!isPlaying) setShowBars(false); 
    else setShowBars(true); 
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsUserMuted(!isUserMuted);
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
       {/* === CAPA 1: VIDEO YOUTUBE / SLIDE === */}
       <div className="absolute inset-0 z-10 pointer-events-none"> 
          <VideoPlayer 
            content={currentContent}
            isActive={true} 
            shouldPreload={true}
            onEnded={handleContentEnded}
            muted={isUserMuted || isIntroVisible} 
            isPlaying={isPlaying} 
          />
       </div>

       {/* === CAPA 2: ESCUDO TRANSPARENTE === */}
       <div 
         className="absolute inset-0 z-20 bg-transparent"
         onClick={handleInteraction}
       />

       {/* === CAPA 3: INTRO (CON FADE OUT) === */}
       {/* CAMBIO: Usamos opacity + pointer-events-none en lugar de 'hidden' para lograr el Fade Out */}
       <div 
         className={cn(
           "absolute inset-0 z-40 transition-opacity duration-500 ease-out", 
           isIntroVisible ? "opacity-100" : "opacity-0 pointer-events-none" 
         )}
       >
         {/* Renderizamos el player siempre que haya URL, lo ocultamos visualmente con CSS */}
         {currentIntro && (
            <ReactPlayer
              key={currentIntro} 
              url={currentIntro}
              playing={true}
              width="100%"
              height="100%"
              volume={1}
              muted={false} 
              playsinline
              style={{ backgroundColor: 'black' }} 
              onError={() => handleContentEnded()} 
              config={{
                file: { 
                  attributes: { 
                    style: { objectFit: 'cover', width: '100%', height: '100%' } 
                  } 
                }
              }}
            />
         )}
       </div>

       {/* === CAPA 4: BANDAS (CON FADE OUT) === */}
       {/* CAMBIO: Controlamos la opacidad con clases CSS en lugar de desmontar el componente */}
       <div className={cn("absolute top-0 left-0 right-0 h-[14%] bg-black z-30 transition-opacity duration-500", showBars ? "opacity-100" : "opacity-0 pointer-events-none")} />
       <div className={cn("absolute bottom-0 left-0 right-0 h-[14%] bg-black z-30 transition-opacity duration-500", showBars ? "opacity-100" : "opacity-0 pointer-events-none")} />

       {/* === CAPA 5: CONTROLES PROPIOS === */}
       <div 
         className={cn(
           "absolute inset-0 z-50 flex items-center justify-center bg-black/30 transition-opacity duration-300",
           showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
         )}
       >
          {/* BOTÓN MUTE */}
          <button 
            onClick={toggleMute}
            className="absolute top-3 left-3 p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 active:scale-95 transition-all"
          >
             {isUserMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* BOTÓN CHROMECAST */}
          <div className="absolute top-3 right-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
             <google-cast-launcher style={{ width: '40px', height: '40px', display: 'block' }}></google-cast-launcher>
          </div>

          {/* BOTÓN PLAY/PAUSE */}
          <button 
            onClick={togglePlay}
            className="p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-2xl scale-110 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
          </button>
       </div>
    </div>
  );
}