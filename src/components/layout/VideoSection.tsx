'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext'; 
import VideoPlayer from '@/components/player/VideoPlayer'; 
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function VideoSection({ isMobile }: { isMobile?: boolean }) {
  const { state, handleIntroEnded, handleContentEnded } = useMediaPlayer();
  const { currentContent, currentIntroUrl, isIntroVisible, shouldPlayContent } = state;
  const { isMuted, toggleMute } = useVolume(); 
  
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(false);
  const [isUserPlaying, setIsUserPlaying] = useState(true); 
  const [showCinemaBars, setShowCinemaBars] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- EFECTO DE RUIDO ANALÓGICO ---
  const StaticEffect = () => (
    <div className="absolute inset-0 z-[15] pointer-events-none opacity-20 mix-blend-screen overflow-hidden">
      <div className="absolute inset-0 static-noise" />
    </div>
  );

  // Barras de Cine Temporales (3s al inicio o fijas en pausa)
  useEffect(() => {
    if (isIntroVisible) { setShowCinemaBars(true); return; }
    if (currentContent && 'url_slide' in currentContent) { setShowCinemaBars(false); return; }
    if (!isUserPlaying) { setShowCinemaBars(true); } 
    else {
      const timer = setTimeout(() => setShowCinemaBars(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isIntroVisible, currentContent, isUserPlaying]);

  // Manejo del Video Intro
  useEffect(() => {
    const videoEl = introVideoRef.current;
    if (isIntroVisible && currentIntroUrl && videoEl) {
        videoEl.src = currentIntroUrl;
        videoEl.load();
        videoEl.muted = isMuted;
        videoEl.play().catch(() => { videoEl.muted = true; videoEl.play(); });
    }
  }, [currentIntroUrl, isIntroVisible, isMuted]);

  // Controles Fugaces (0.5s)
  useEffect(() => {
    if (showControls && isUserPlaying && !isIntroVisible && !isMuted) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 500);
    }
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [showControls, isUserPlaying, isIntroVisible, isMuted]);

  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const isVideoActive = shouldPlayContent && isUserPlaying;
  const isSlide = currentContent && 'url_slide' in currentContent;

  return (
    <div className="w-full h-full bg-black relative overflow-hidden select-none" onMouseMove={handleInteraction} onClick={handleInteraction}>
       <style jsx global>{`
            .static-noise {
                background-image: url("https://media.giphy.com/media/oEI9uWUicLpSc/giphy.gif");
                background-size: cover;
                opacity: 0.15;
            }
       `}</style>

       {/* CAPA Z-10: CONTENIDO (BUFFER ACTIVO) */}
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

       {/* CAPA Z-15: INTERFERENCIA ANALÓGICA */}
       {(isIntroVisible || !isUserPlaying) && <StaticEffect />}

       {/* CAPA Z-20: ESCUDO */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* CAPA Z-30: BARRAS DE CINE */}
       {!isSlide && (
         <>
            <div className={cn("absolute top-0 h-[20%] w-full bg-black z-30 transition-transform duration-500", showCinemaBars ? "translate-y-0" : "-translate-y-full")} />
            <div className={cn("absolute bottom-0 h-[20%] w-full bg-black z-30 transition-transform duration-500", showCinemaBars ? "translate-y-0" : "translate-y-full")} />
         </>
       )}

       {/* CAPA Z-40: VIDEO INTRO (TELÓN) */}
       <div className={cn("absolute inset-0 z-40 bg-black transition-opacity duration-700", isIntroVisible ? "opacity-100" : "opacity-0 pointer-events-none")}>
         <video 
            ref={introVideoRef} 
            className="w-full h-full object-cover" 
            playsInline 
            onEnded={() => handleIntroEnded()} 
         />
       </div>

       {/* CAPA Z-50: CONTROLES */}
       <div className={cn("absolute inset-0 z-50 flex flex-col justify-between p-4 transition-all duration-300 pointer-events-none", (isMuted || showControls) ? "opacity-100" : "opacity-0")}>
          <div className="flex justify-end w-full">
            <div className="pointer-events-auto w-10 h-10"><google-cast-launcher style={{width:'40px', height:'40px'}} /></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none gap-6">
             <button onClick={(e) => { e.stopPropagation(); setIsUserPlaying(!isUserPlaying); handleInteraction(); }} className="pointer-events-auto flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 transition-all">
                {isUserPlaying ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" className="ml-1" />}
             </button>
             <button onClick={(e) => { e.stopPropagation(); toggleMute(); handleInteraction(); }} className={cn("pointer-events-auto flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 transition-all", isMuted && "bg-red-500/30 border-red-500")}>
                {isMuted ? <VolumeX size={40} fill="white" /> : <Volume2 size={40} fill="white" />}
             </button>
          </div>
       </div>
    </div>
  );
}