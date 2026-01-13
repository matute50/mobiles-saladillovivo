'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
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
  
  const introVideoRef = useRef<HTMLVideoElement>(null);
  
  // Estados de Interfaz
  const [showControls, setShowControls] = useState(false);
  const [isUserPlaying, setIsUserPlaying] = useState(true); // Usuario quiere reproducir por defecto
  const [isUserMuted, setIsUserMuted] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. LÓGICA REPRODUCTOR INTRO (HTML5 Nativo) ---
  useEffect(() => {
    const videoEl = introVideoRef.current;
    if (isIntroVisible && currentIntroUrl && videoEl) {
        videoEl.src = currentIntroUrl;
        videoEl.load();
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                console.warn("Autoplay intro bloqueado, intentando mute...");
                videoEl.muted = true;
                videoEl.play();
            });
        }
        // Al iniciar intro, aseguramos que el usuario "quiere" ver video
        setIsUserPlaying(true); 
    }
  }, [currentIntroUrl, isIntroVisible]);

  const onIntroEnd = () => {
    handleIntroEnded(); // Dispara el Handshake hacia el contexto
  };

  // --- 2. GESTIÓN DE INTERACCIÓN (Escudo Fantasma) ---
  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    // Solo ocultar automáticamente si el video está corriendo
    if (isUserPlaying && !isIntroVisible) {
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isUserPlaying;
    setIsUserPlaying(newState);
    
    if (newState) {
        handleInteraction();
    } else {
        // En pausa, los controles se quedan fijos
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        setShowControls(true); 
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserMuted(!isUserMuted);
    handleInteraction();
  };

  // Lógica combinada: El video corre SI (Intro terminó) Y (Usuario dio Play)
  const isVideoActive = shouldPlayContent && isUserPlaying;

  return (
    <div 
      className="w-full bg-black relative aspect-video overflow-hidden shadow-sm group select-none"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
    >
       {/* === FONDO: SIN SEÑAL (TV Static) === */}
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

       {/* === CAPA Z-10: CONTENIDO (Protegido: pointer-events-none) === */}
       <div className="absolute inset-0 z-10 pointer-events-none"> 
          {currentContent && (
             <VideoPlayer 
                content={currentContent}
                shouldPlay={isVideoActive} 
                onEnded={handleContentEnded}
                muted={isUserMuted} 
             />
          )}
       </div>

       {/* === CAPA Z-20: ESCUDO FANTASMA (Captura Clicks) === */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* === CAPA Z-30: BARRAS DE CINE (Anti-Branding Físico) === */}
       {/* 19% height tapa exactamente el Header y Footer nativos de YouTube */}
       <div className="absolute top-0 h-[19%] w-full bg-black z-30 pointer-events-none" />
       <div className="absolute bottom-0 h-[19%] w-full bg-black z-30 pointer-events-none" />

       {/* === CAPA Z-40: VIDEO INTRO (Tapa todo durante carga) === */}
       <div 
         className={cn(
            "absolute inset-0 z-40 bg-black transition-opacity duration-300",
            isIntroVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
         )}
       >
         <video 
            ref={introVideoRef}
            className="w-full h-full object-cover"
            playsInline
            onEnded={onIntroEnd}
            onError={onIntroEnd}
            muted={false}
         />
       </div>

       {/* === CAPA Z-50: CONTROLES WHITELISTED (UI Propia) === */}
       <div 
         className={cn(
           "absolute inset-0 z-50 flex flex-col justify-between p-4 transition-opacity duration-300 pointer-events-none",
           showControls ? "opacity-100" : "opacity-0"
         )}
       >
          {/* HEADER UI */}
          <div className="flex justify-between items-start w-full">
              <button 
                onClick={toggleMute} 
                className={cn(
                  "pointer-events-auto p-3 rounded-full backdrop-blur border transition-all hover:scale-105",
                  isUserMuted 
                    ? "bg-red-500/80 text-white border-red-400 animate-pulse shadow-lg" // Alerta visual
                    : "bg-black/60 text-white border-white/20 hover:bg-black/80"
                )}
              >
                {isUserMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>

              <div className="pointer-events-auto w-10 h-10 opacity-80 hover:opacity-100 transition-opacity">
                 <google-cast-launcher style={{ width: '100%', height: '100%' }}></google-cast-launcher>
              </div>
          </div>

          {/* CENTER UI */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <button 
               onClick={togglePlay}
               className="pointer-events-auto p-6 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 hover:scale-110 active:scale-95 transition-all shadow-2xl"
             >
                {isUserPlaying ? (
                    <Pause size={48} fill="currentColor" className="opacity-90" />
                ) : (
                    <Play size={48} fill="currentColor" className="opacity-90 ml-1" />
                )}
             </button>
          </div>

          <div className="w-full h-10" /> {/* Spacer */}
       </div>
    </div>
  );
}