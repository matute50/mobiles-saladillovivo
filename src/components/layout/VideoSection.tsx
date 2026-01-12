'use client';

import React, { useState, useEffect } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import VideoPlayer from '@/components/player/VideoPlayer'; 
import { cn } from '@/lib/utils';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Video } from '@/lib/types'; 

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
  const [showBars, setShowBars] = useState(true);

  const isVideo = currentContent && 'url' in currentContent && typeof (currentContent as any).url === 'string' && !('url_slide' in currentContent);

  // --- LÓGICA DE BARRAS DE CINE ---
  useEffect(() => {
    if (isIntroVisible) {
      setShowBars(true); 
    } else {
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
    const willPlay = !isPlaying; 
    setIsPlaying(willPlay);
    setShowControls(true);

    if (willPlay) {
      setTimeout(() => setShowBars(false), 500);
    } else {
      setShowBars(true); 
    }
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

       {/* === CAPA 2: ESCUDO TRANSPARENT === */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* === CAPA 3: INTRO === */}
       <div className={cn("absolute inset-0 z-40 transition-opacity duration-500 ease-out", isIntroVisible ? "opacity-100" : "opacity-0 pointer-events-none")}>
         {currentIntro && (
            <ReactPlayer
              key={currentIntro} url={currentIntro} playing={true} width="100%" height="100%" volume={1} muted={false} playsinline style={{ backgroundColor: 'black' }} 
              onError={() => handleContentEnded()} 
              config={{ file: { attributes: { style: { objectFit: 'cover', width: '100%', height: '100%' } } } }}
            />
         )}
       </div>

       {/* === CAPA 4: BARRAS DE CINE === */}
       {isVideo && (
         <>
           <div className={cn("absolute top-0 left-0 right-0 h-[19%] bg-black z-30 transition-transform duration-500 ease-in-out", showBars ? "translate-y-0" : "-translate-y-full")} />
           <div className={cn("absolute bottom-0 left-0 right-0 h-[19%] bg-black z-30 transition-transform duration-500 ease-in-out", showBars ? "translate-y-0" : "translate-y-full")} />
         </>
       )}

       {/* === CAPA 5: BOTÓN MUTE PERSISTENTE (SIEMPRE VISIBLE SI ESTÁ MUTEADO) === */}
       {isUserMuted && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
              <button 
                onClick={toggleMute}
                className="pointer-events-auto p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-red-500 shadow-2xl scale-110 active:scale-95 transition-all animate-in zoom-in duration-300"
              >
                <VolumeX size={48} fill="currentColor" />
              </button>
          </div>
       )}

       {/* === CAPA 6: CONTROLES ESTÁNDAR (AUTO-HIDE) === */}
       <div 
         className={cn(
           "absolute inset-0 z-50 flex items-center justify-center bg-black/30 transition-opacity duration-300",
           showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
         )}
       >
          {/* Botón Mute Pequeño (Esquina) - Opcional, útil si el usuario prefiere controles clásicos */}
          <button 
            onClick={toggleMute}
            className="absolute top-3 left-3 p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 active:scale-95 transition-all"
          >
             {isUserMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <div className="absolute top-3 right-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
             <google-cast-launcher style={{ width: '40px', height: '40px', display: 'block' }}></google-cast-launcher>
          </div>

          {/* Botón Play Central (SOLO VISIBLE SI NO ESTÁ MUTEADO) */}
          {/* Esto evita que se superponga con el botón rojo grande */}
          {!isUserMuted && (
            <button 
              onClick={togglePlay}
              className="p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-2xl scale-110 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
            </button>
          )}
       </div>
    </div>
  );
}