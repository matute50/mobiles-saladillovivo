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

  // Reiniciar estado cuando cambia el contenido
  useEffect(() => { 
    setIsContentStarted(false); 
    setIsUserPlaying(true);
  }, [currentContent]);

  // Manejo de la Intro Video
  useEffect(() => {
    const v = introVideoRef.current;
    if (isIntroVisible && currentIntroUrl && v) {
      v.src = currentIntroUrl;
      v.muted = isMuted;
      v.play().catch(() => {
        // Fallback: si el navegador bloquea el autoplay, silenciamos para que juegue sí o sí
        v.muted = true;
        v.play();
      });
    }
  }, [currentIntroUrl, isIntroVisible, isMuted]);

  // Cuando el Video Real empieza, quitamos la intro definitivamente
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
      
      {/* CAPA DE VIDEO REAL */}
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

      {/* RUIDO ANALÓGICO (Solo si no empezó o está pausado) */}
      {(!isContentStarted || !isUserPlaying) && <div className="absolute inset-0 z-[15] pointer-events-none analog-noise" />}

      {/* CAPA DE INTRO (VIDEO) */}
      <div className={cn(
        "absolute inset-0 z-40 bg-black transition-opacity duration-700", 
        isIntroVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <video 
          ref={introVideoRef} 
          className="w-full h-full object-cover" 
          onEnded={handleIntroEnded} // Por seguridad, si termina la intro y no hubo señal de VideoPlayer, cerramos intro
          playsInline 
        />
      </div>

      {/* BOTÓN FLOTANTE: "ACTIVAR SONIDO" (Solo aparece si el usuario entra por link y está muteado) */}
      {isMuted && !isIntroVisible && (
        <button 
          onClick={(e) => { e.stopPropagation(); unmute(); }}
          className="absolute top-4 left-4 z-[60] flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-bold animate-pulse shadow-lg"
        >
          <VolumeX size={20} /> TOCAR PARA ACTIVAR SONIDO
        </button>
      )}

      {/* CONTROLES DE REPRODUCCIÓN */}
      <div className={cn(
        "absolute inset-0 z-50 flex items-center justify-center gap-6 transition-opacity duration-300", 
        (showControls || !isUserPlaying) ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsUserPlaying(!isUserPlaying); }} 
          className="flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 active:scale-95"
        >
          {isUserPlaying ? <Pause size={40} fill="white" className="text-white"/> : <Play size={40} fill="white" className="text-white ml-1"/>}
        </button>
        
        <button 
          onClick={(e) => { e.stopPropagation(); toggleMute(); }} 
          className={cn(
            "flex items-center justify-center rounded-full border p-5 active:scale-95", 
            isMuted ? "bg-red-600 border-red-500" : "bg-black/40 border-white/20 backdrop-blur-md"
          )}
        >
          {isMuted ? <VolumeX size={40} fill="white" /> : <Volume2 size={40} fill="white" />}
        </button>
      </div>
    </div>
  );
}