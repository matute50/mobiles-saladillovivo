'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showControls, setShowControls] = useState(false);
  const [isUserPlaying, setIsUserPlaying] = useState(true); 
  const [showCinemaBars, setShowCinemaBars] = useState(true);

  // --- 1. LÓGICA DE BARRAS DE CINE (Reactiva a Play/Pause) ---
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

  // --- 2. GESTIÓN DE INACTIVIDAD (0.5 SEGUNDOS) ---
  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  useEffect(() => {
    // Si los controles están visibles, iniciamos la cuenta regresiva de 0.5s
    // REGLA: Si está muteado, los controles NO desaparecen para forzar acción del usuario
    if (showControls && isUserPlaying && !isIntroVisible && !isMuted) {
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 500); // 0.5 segundos estrictos
    }
    return () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isUserPlaying, isIntroVisible, isMuted]);

  // --- 3. LÓGICA INTRO ---
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

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isUserPlaying;
    setIsUserPlaying(newState);
    if (newState) handleInteraction();
    else setShowControls(true);
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
      className="w-full h-full bg-black relative overflow-hidden shadow-sm group select-none"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
    >
       <style jsx>{`
            .static-noise {
                background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, #000 1px, transparent 2px, #333 3px);
                background-size: 4px 4px;
                animation: staticShift 0.2s infinite linear;
            }
            @keyframes staticShift { 0% {background-position: 0 0;} 100% {background-position: 10px 10px;} }
       `}</style>

       {/* CAPA Z-10: CONTENIDO */}
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

       {/* CAPA Z-20: ESCUDO */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* CAPA Z-30: BARRAS DE CINE */}
       {!isSlide && (
         <>
            <div className={cn("absolute top-0 h-[20%] w-full bg-black z-30 pointer-events-none transition-transform duration-500 ease-in-out", showCinemaBars ? "translate-y-0" : "-translate-y-full")} />
            <div className={cn("absolute bottom-0 h-[20%] w-full bg-black z-30 pointer-events-none transition-transform duration-500 ease-in-out", showCinemaBars ? "translate-y-0" : "translate-y-full")} />
         </>
       )}

       {/* CAPA Z-40: INTRO */}
       <div className={cn("absolute inset-0 z-40 bg-black transition-opacity duration-300", isIntroVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
         <video ref={introVideoRef} className="w-full h-full object-cover" playsInline onEnded={onIntroEnd} onError={onIntroEnd} />
       </div>

       {/* CAPA Z-50: CONTROLES GRUPALES */}
       <div className={cn(
           "absolute inset-0 z-50 flex flex-col justify-between p-4 transition-all duration-300 pointer-events-none",
           (isMuted || showControls) ? "opacity-100" : "opacity-0"
       )}>
          <div className="flex justify-end items-start w-full">
              <div className="pointer-events-auto w-10 h-10 opacity-80 hover:opacity-100 transition-opacity">
                 <google-cast-launcher style={{ width: '40px', height: '40px' }}></google-cast-launcher>
              </div>
          </div>

          {/* BOTONES CENTRALES LADO A LADO */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none gap-6">
             <button 
               onClick={togglePlay}
               className={cn(
                 "pointer-events-auto flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 transition-all duration-300",
                 (!showControls && !isMuted) ? "opacity-0 scale-90" : "opacity-100 scale-100"
               )}
             >
                {isUserPlaying ? <Pause size={40} fill="white" className="text-white" /> : <Play size={40} fill="white" className="text-white ml-1" />}
             </button>

             <button 
               onClick={handleToggleMute}
               className={cn(
                 "pointer-events-auto flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 transition-all duration-300",
                 isMuted && "bg-red-500/30 border-red-500",
                 (!showControls && !isMuted) ? "opacity-0 scale-90" : "opacity-100 scale-100"
               )}
             >
                {isMuted ? <VolumeX size={40} fill="white" className="text-white" /> : <Volume2 size={40} fill="white" className="text-white" />}
             </button>
          </div>
          <div className="w-full h-10" />
       </div>
    </div>
  );
}