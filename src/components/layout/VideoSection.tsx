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
  const [isContentStarted, setIsContentStarted] = useState(false);

  useEffect(() => { setIsContentStarted(false); }, [currentContent]);

  // MODIFICACIÓN: Barras de cine ahora permanecen 2 segundos (2000ms)
  useEffect(() => {
    if (isIntroVisible) { setShowCinemaBars(true); return; }
    if (currentContent && 'url_slide' in currentContent) { setShowCinemaBars(false); return; }
    if (!isUserPlaying) setShowCinemaBars(true);
    else {
      const t = setTimeout(() => setShowCinemaBars(false), 2000); 
      return () => clearTimeout(t);
    }
  }, [isIntroVisible, currentContent, isUserPlaying]);

  useEffect(() => {
    const v = introVideoRef.current;
    if (isIntroVisible && currentIntroUrl && v) {
      v.src = currentIntroUrl; v.load(); v.muted = isMuted;
      v.play().catch(() => { v.muted = true; v.play(); });
      setIsUserPlaying(true);
    }
  }, [currentIntroUrl, isIntroVisible, isMuted]);

  // MODIFICACIÓN: Controles desaparecen tras 0.5 segundos (500ms)
  useEffect(() => {
    if (showControls && isUserPlaying && !isIntroVisible) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 500);
    }
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [showControls, isUserPlaying, isIntroVisible]);

  const handleStart = () => { setIsContentStarted(true); setTimeout(handleIntroEnded, 200); };
  
  const handleInteraction = () => { 
    setShowControls(true); 
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); 
  };

  return (
    /* MODIFICACIÓN: Eliminado shadow y border del contenedor principal */
    <div className="w-full h-full bg-black relative overflow-hidden select-none" onMouseMove={handleInteraction} onClick={handleInteraction}>
      <style jsx global>{`.analog-noise { background: repeating-radial-gradient(#000 0 0.0001%, #fff 0 0.0002%) 50% 0/2500px 2500px; opacity: 0.12; animation: shift .2s infinite alternate; } @keyframes shift { 100% { background-position: 50% 0, 51% 50%; } }`}</style>
      
      <div className="absolute inset-0 z-10 pointer-events-none">
        {currentContent && <VideoPlayer content={currentContent} shouldPlay={shouldPlayContent && isUserPlaying} onEnded={handleContentEnded} onStart={handleStart} muted={isMuted} />}
      </div>

      {(!isContentStarted || !isUserPlaying) && <div className="absolute inset-0 z-[15] pointer-events-none analog-noise" />}
      <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

      {!(currentContent && 'url_slide' in currentContent) && (
        <>
          <div className={cn("absolute top-0 h-[20%] w-full bg-black z-30 transition-transform duration-500", showCinemaBars ? "translate-y-0" : "-translate-y-full")} />
          <div className={cn("absolute bottom-0 h-[20%] w-full bg-black z-30 transition-transform duration-500", showCinemaBars ? "translate-y-0" : "translate-y-full")} />
        </>
      )}

      <div className={cn("absolute inset-0 z-40 bg-black transition-opacity duration-500", isIntroVisible ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <video ref={introVideoRef} className="w-full h-full object-cover" playsInline />
      </div>

      {/* CONTROLES: La transición de opacidad ahora es más rápida (duration-200) para acompañar los 0.5s */}
      <div className={cn("absolute inset-0 z-50 flex flex-col justify-between p-4 transition-opacity duration-200 pointer-events-none", (showControls || !isUserPlaying) ? "opacity-100" : "opacity-0")}>
        <div className="flex justify-end w-full"><div className="pointer-events-auto w-10 h-10"><google-cast-launcher style={{width:'40px', height:'40px'}} /></div></div>
        <div className="absolute inset-0 flex items-center justify-center gap-6 pointer-events-none">
          <button onClick={(e) => { e.stopPropagation(); setIsUserPlaying(!isUserPlaying); handleInteraction(); }} className="pointer-events-auto flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 transition-all active:scale-95">
            {isUserPlaying ? <Pause size={40} fill="white" className="text-white"/> : <Play size={40} fill="white" className="text-white ml-1"/>}
          </button>
          <button onClick={(e) => { e.stopPropagation(); toggleMute(); handleInteraction(); }} className={cn("pointer-events-auto flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 transition-all active:scale-95", isMuted && "bg-red-500/30 border-red-500")}>
            {isMuted ? <VolumeX size={40} fill="white" className="text-white"/> : <Volume2 size={40} fill="white" className="text-white"/>}
          </button>
        </div>
        <div className="h-10 w-full" />
      </div>
    </div>
  );
}