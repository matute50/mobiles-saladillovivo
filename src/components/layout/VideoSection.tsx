'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext'; 
import VideoPlayer from '@/components/player/VideoPlayer'; 
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'google-cast-launcher': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export default function VideoSection({ isMobile }: { isMobile?: boolean }) {
  const { state, handleIntroEnded, handleContentEnded } = useMediaPlayer();
  const { currentContent, currentIntroUrl, isIntroVisible, shouldPlayContent } = state;
  
  const { isMuted, toggleMute } = useVolume(); 
  
  const introVideoRef = useRef<HTMLVideoElement>(null);
  
  const [showControls, setShowControls] = useState(false);
  const [isUserPlaying, setIsUserPlaying] = useState(true); 
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showCinemaBars, setShowCinemaBars] = useState(true);

  // --- LÓGICA BARRAS DE CINE ---
  useEffect(() => {
    if (isIntroVisible) { setShowCinemaBars(true); return; }
    if (currentContent && 'url_slide' in currentContent) { setShowCinemaBars(false); return; }

    if (!isUserPlaying) {
        setShowCinemaBars(true);
    } else {
        const timer = setTimeout(() => setShowCinemaBars(false), 1000);
        return () => clearTimeout(timer);
    }
  }, [isIntroVisible, currentContent, isUserPlaying]);

  // --- LÓGICA INTRO ---
  useEffect(() => {
    const videoEl = introVideoRef.current;
    if (isIntroVisible && currentIntroUrl && videoEl) {
        videoEl.src = currentIntroUrl;
        videoEl.load();
        videoEl.muted = isMuted;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => { videoEl.muted = true; videoEl.play(); });
        }
        setIsUserPlaying(true); 
    }
  }, [currentIntroUrl, isIntroVisible, isMuted]);

  const onIntroEnd = () => handleIntroEnded();

  // --- INTERACCIÓN Y TIMEOUTS ---
  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    // Ocultar tras 0.5s si está reproduciendo y hay sonido
    if (isUserPlaying && !isIntroVisible && !isMuted) {
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 500);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isUserPlaying;
    setIsUserPlaying(newState);
    if (newState) handleInteraction();
    else {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        setShowControls(true); 
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute(); 
    handleInteraction();
  };

  const isVideoActive = shouldPlayContent && isUserPlaying;
  const isSlide = currentContent && 'url_slide' in currentContent;

  return (
    <div 
      className="w-full bg-black relative aspect-video overflow-hidden shadow-sm group select-none"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
    >
       {/* FONDO SIN SEÑAL */}
       <style jsx>{`
            .static-noise {
                background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, #000 1px, transparent 2px, #333 3px);
                background-size: 4px 4px;
                animation: staticShift 0.2s infinite linear;
            }
            @keyframes staticShift { 0% {background-position: 0 0;} 100% {background-position: 10px 10px;} }
       `}</style>
       {(!currentContent && !isIntroVisible) && (
         <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#101010] static-noise">
            <p className="text-white/40 font-mono text-xl animate-pulse font-bold tracking-widest">SIN SEÑAL</p>
         </div>
       )}

       {/* CONTENIDO */}
       <div className="absolute inset-0 z-10 pointer-events-none"> 
          {currentContent && (
             <VideoPlayer 
                content={currentContent}
                shouldPlay={isVideoActive} 
                onEnded={handleContentEnded}
                muted={isMuted} 
             />
          )}
       </div>

       {/* ESCUDO */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* BARRAS DE CINE */}
       {!isSlide && (
         <>
            <div className={cn("absolute top-0 h-[20%] w-full bg-black z-30 pointer-events-none transition-transform duration-500 ease-in-out", showCinemaBars ? "translate-y-0" : "-translate-y-full")} />
            <div className={cn("absolute bottom-0 h-[20%] w-full bg-black z-30 pointer-events-none transition-transform duration-500 ease-in-out", showCinemaBars ? "translate-y-0" : "translate-y-full")} />
         </>
       )}

       {/* INTRO */}
       <div className={cn("absolute inset-0 z-40 bg-black transition-opacity duration-300", isIntroVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
         <video ref={introVideoRef} className="w-full h-full object-cover" playsInline onEnded={onIntroEnd} onError={onIntroEnd} />
       </div>

       {/* CAPA DE CONTROLES (Z-50) */}
       <div className={cn(
           "absolute inset-0 z-50 flex flex-col justify-between p-4 transition-all duration-300 pointer-events-none",
           (isMuted || showControls) ? "opacity-100" : "opacity-0"
       )}>
          
          {/* HEADER (Solo Cast, Mute se movió al centro) */}
          <div className="flex justify-end items-start w-full">
              <div className="pointer-events-auto w-10 h-10 opacity-80 hover:opacity-100 transition-opacity">
                 <google-cast-launcher style={{ width: '100%', height: '100%' }}></google-cast-launcher>
              </div>
          </div>

          {/* === CENTER UI: BOTONES LADO A LADO === */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none gap-8 md:gap-12">
             
             {/* 1. BOTÓN PLAY/PAUSE */}
             <button 
               onClick={togglePlay}
               className={cn(
                 "pointer-events-auto group flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 shadow-2xl transition-all duration-300 ease-out",
                 "hover:bg-black/50 hover:scale-110 active:scale-95",
                 // Visibilidad específica para Play: Oculto si no hay interacción y no está muteado
                 (!showControls && !isMuted) ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
               )}
             >
                {isUserPlaying ? (
                  <Pause size={42} fill="white" className="text-white drop-shadow-md" />
                ) : (
                  <Play size={42} fill="white" className="text-white ml-1 drop-shadow-md" />
                )}
             </button>

             {/* 2. BOTÓN MUTE/UNMUTE */}
             <button 
               onClick={handleToggleMute}
               className={cn(
                 "pointer-events-auto group flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 shadow-2xl transition-all duration-300 ease-out",
                 "hover:bg-black/50 hover:scale-110 active:scale-95",
                 // Si está Muted, este botón destaca más (pulsando o rojo)
                 isMuted && "bg-red-500/20 border-red-500/50 animate-pulse",
                 (!showControls && !isMuted) ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
               )}
             >
                {isMuted ? (
                  <VolumeX size={42} fill="white" className="text-white drop-shadow-md" />
                ) : (
                  <Volume2 size={42} fill="white" className="text-white drop-shadow-md" />
                )}
             </button>

          </div>

          <div className="w-full h-10" />
       </div>
    </div>
  );
}