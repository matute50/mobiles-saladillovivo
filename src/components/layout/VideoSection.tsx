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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showControls, setShowControls] = useState(false);
  const [isUserPlaying, setIsUserPlaying] = useState(true); 
  const [showCinemaBars, setShowCinemaBars] = useState(true);
  const [isContentReady, setIsContentReady] = useState(false);

  // --- EFECTO RUIDO ANALÓGICO (Static) ---
  const StaticEffect = () => (
    <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden opacity-20 mix-blend-screen">
      <div className="absolute inset-0 static-noise" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scanline" />
    </div>
  );

  // Reiniciar Ready cuando cambia el contenido
  useEffect(() => {
    setIsContentReady(false);
  }, [currentContent]);

  useEffect(() => {
    if (isIntroVisible) { setShowCinemaBars(true); return; }
    if (currentContent && 'url_slide' in currentContent) { setShowCinemaBars(false); return; }
    if (!isUserPlaying) { setShowCinemaBars(true); } 
    else {
      const timer = setTimeout(() => setShowCinemaBars(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isIntroVisible, currentContent, isUserPlaying]);

  useEffect(() => {
    const videoEl = introVideoRef.current;
    if (isIntroVisible && currentIntroUrl && videoEl) {
        videoEl.src = currentIntroUrl;
        videoEl.load();
        videoEl.muted = isMuted;
        videoEl.play().catch(() => { videoEl.muted = true; videoEl.play(); });
        setIsUserPlaying(true); 
    }
  }, [currentIntroUrl, isIntroVisible, isMuted]);

  // Handshake: Se oculta intro solo cuando YouTube dice READY
  const handleContentReady = () => {
    setIsContentReady(true);
    // Pequeño delay de seguridad para que el primer frame renderice
    setTimeout(() => handleIntroEnded(), 300);
  };

  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  useEffect(() => {
    if (showControls && isUserPlaying && !isIntroVisible && !isMuted) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 500);
    }
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [showControls, isUserPlaying, isIntroVisible, isMuted]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserPlaying(!isUserPlaying);
    if (!isUserPlaying) handleInteraction();
    else setShowControls(true);
  };

  return (
    <div className="w-full h-full bg-black relative overflow-hidden select-none" onMouseMove={handleInteraction} onClick={handleInteraction}>
       <style jsx global>{`
            .static-noise {
                background-image: url("https://media.giphy.com/media/oEI9uWUicLpSc/giphy.gif");
                background-size: cover;
                opacity: 0.15;
            }
            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }
            .animate-scanline { animation: scanline 4s linear infinite; }
       `}</style>

       {/* CAPA Z-10: CONTENIDO (Solo Play si el intro está por terminar) */}
       <div className="absolute inset-0 z-10 pointer-events-none"> 
          {currentContent && (
             <VideoPlayer 
                content={currentContent}
                shouldPlay={shouldPlayContent && isUserPlaying} 
                onEnded={handleContentEnded}
                onReady={handleContentReady}
                muted={isMuted} 
             />
          )}
       </div>

       {/* CAPA Z-15: RUIDO ANALÓGICO (Cubre fallas de YouTube) */}
       {(!isContentReady || !isUserPlaying) && <StaticEffect />}

       {/* CAPA Z-20: ESCUDO */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* CAPA Z-30: BARRAS */}
       {!(currentContent && 'url_slide' in currentContent) && (
         <>
            <div className={cn("absolute top-0 h-[20%] w-full bg-black z-30 transition-transform duration-500", showCinemaBars ? "translate-y-0" : "-translate-y-full")} />
            <div className={cn("absolute bottom-0 h-[20%] w-full bg-black z-30 transition-transform duration-500", showCinemaBars ? "translate-y-0" : "translate-y-full")} />
         </>
       )}

       {/* CAPA Z-40: INTRO (Fade Out al estar Ready) */}
       <div className={cn("absolute inset-0 z-40 bg-black transition-opacity duration-700", isIntroVisible ? "opacity-100" : "opacity-0 pointer-events-none")}>
         <video ref={introVideoRef} className="w-full h-full object-cover" playsInline onEnded={() => {}} />
       </div>

       {/* CAPA Z-50: CONTROLES */}
       <div className={cn("absolute inset-0 z-50 flex flex-col justify-between p-4 transition-all duration-300 pointer-events-none", (isMuted || showControls) ? "opacity-100" : "opacity-0")}>
          <div className="flex justify-end w-full" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none gap-6">
             <button onClick={togglePlay} className="pointer-events-auto flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 transition-all">
                {isUserPlaying ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" className="ml-1" />}
             </button>
             <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className={cn("pointer-events-auto flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 transition-all", isMuted && "bg-red-500/30 border-red-500")}>
                {isMuted ? <VolumeX size={40} fill="white" /> : <Volume2 size={40} fill="white" />}
             </button>
          </div>
       </div>
    </div>
  );
}