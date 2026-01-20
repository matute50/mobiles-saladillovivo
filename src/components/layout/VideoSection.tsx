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
  const { isMuted, toggleMute, unmute } = useVolume();
  
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [isUserPlaying, setIsUserPlaying] = useState(true); 
  const [isContentStarted, setIsContentStarted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => { 
    setIsContentStarted(false); 
    setIsUserPlaying(true);
  }, [currentContent]);

  useEffect(() => {
    const v = introVideoRef.current;
    if (isIntroVisible && currentIntroUrl && v) {
      v.src = currentIntroUrl;
      v.muted = true;
      v.play().catch(() => {
        handleIntroEnded();
      });
    }
  }, [currentIntroUrl, isIntroVisible, handleIntroEnded]);

  const handleStart = () => { 
    setIsContentStarted(true); 
    handleIntroEnded(); 
  };
  
  const handleInteraction = () => { 
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div className="w-full h-full bg-black relative overflow-hidden select-none" onClick={handleInteraction}>
      <style jsx global>{`.analog-noise { background: repeating-radial-gradient(#000 0 0.0001%, #fff 0 0.0002%) 50% 0/2500px 2500px; opacity: 0.12; animation: shift .2s infinite alternate; } @keyframes shift { 100% { background-position: 50% 0, 51% 50%; } }`}</style>
      
      <div className="absolute inset-0 z-10">
        {currentContent && (
          <VideoPlayer 
            content={currentContent} 
            shouldPlay={shouldPlayContent && isUserPlaying} 
            onEnded={handleContentEnded} 
            onStart={handleStart} 
            muted={isMuted}
          />
        )}
      </div>

      {(!isContentStarted || !isUserPlaying) && <div className="absolute inset-0 z-[15] pointer-events-none analog-noise" />}

      {/* INTRO VIDEO LAYER */}
      <div className={cn(
        "absolute inset-0 z-40 bg-black transition-opacity duration-700", 
        isIntroVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <video 
          ref={introVideoRef} 
          className="w-full h-full object-cover" 
          onEnded={handleIntroEnded} 
          playsInline 
          muted
        />
      </div>

      {/* BOTÓN CIRCULAR ROJO CON ANIMACIÓN DE SALIDA */}
      <div className={cn(
        "absolute inset-0 z-[60] flex items-center justify-center pointer-events-none transition-all duration-500 ease-in-out",
        (isMuted && !isIntroVisible) ? "opacity-100 scale-100" : "opacity-0 scale-75"
      )}>
        <button 
          onClick={(e) => { e.stopPropagation(); unmute(); }}
          className={cn(
            "w-24 h-24 bg-red-600 text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.5)]",
            "pointer-events-auto active:scale-90 transition-transform duration-200",
            "animate-pulse border-4 border-white/20"
          )}
        >
          <VolumeX size={48} strokeWidth={2.5} />
        </button>
      </div>

      {/* CONTROLES ESTÁNDAR */}
      <div className={cn(
        "absolute inset-0 z-50 flex items-center justify-center gap-6 transition-opacity duration-300", 
        (showControls || !isUserPlaying) ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <button onClick={(e) => { e.stopPropagation(); setIsUserPlaying(!isUserPlaying); }} className="flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 active:scale-95">
          {isUserPlaying ? <Pause size={40} fill="white" className="text-white"/> : <Play size={40} fill="white" className="text-white ml-1"/>}
        </button>
        
        <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className={cn("flex items-center justify-center rounded-full border p-5 active:scale-95", isMuted ? "bg-red-600 border-red-500" : "bg-black/40 border-white/20 backdrop-blur-md")}>
          {isMuted ? <VolumeX size={40} fill="white" /> : <Volume2 size={40} fill="white" />}
        </button>
      </div>
    </div>
  );
}