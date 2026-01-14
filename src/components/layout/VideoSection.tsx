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
  
  // Consumimos el contexto global de volumen
  const { isMuted, toggleMute } = useVolume(); 
  
  const introVideoRef = useRef<HTMLVideoElement>(null);
  
  // Estados de Interfaz
  const [showControls, setShowControls] = useState(false);
  const [isUserPlaying, setIsUserPlaying] = useState(true); 
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estado para Barras de Cine
  const [showCinemaBars, setShowCinemaBars] = useState(true);

  // --- LÓGICA DE BARRAS DE CINE (Reactiva a Play/Pause) ---
  useEffect(() => {
    // 1. Si es Intro: Barras SIEMPRE visibles
    if (isIntroVisible) {
        setShowCinemaBars(true);
        return;
    }

    // 2. Si es Slide (.html): Barras NUNCA visibles
    if (currentContent && 'url_slide' in currentContent) {
        setShowCinemaBars(false);
        return;
    }

    // 3. Lógica Video YouTube (Play vs Pause)
    if (!isUserPlaying) {
        // AL PAUSAR: Aparecen inmediatamente
        setShowCinemaBars(true);
    } else {
        // AL DAR PLAY: Desaparecen 1 segundo después
        const timer = setTimeout(() => {
            setShowCinemaBars(false);
        }, 1000);
        return () => clearTimeout(timer);
    }

  }, [isIntroVisible, currentContent, isUserPlaying]);


  // --- LÓGICA REPRODUCTOR INTRO ---
  useEffect(() => {
    const videoEl = introVideoRef.current;
    if (isIntroVisible && currentIntroUrl && videoEl) {
        videoEl.src = currentIntroUrl;
        videoEl.load();
        videoEl.muted = isMuted;

        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                videoEl.muted = true;
                videoEl.play();
            });
        }
        setIsUserPlaying(true); 
    }
  }, [currentIntroUrl, isIntroVisible, isMuted]);

  const onIntroEnd = () => {
    handleIntroEnded(); 
  };

  // --- GESTIÓN DE INTERACCIÓN (Controles Fugaces) ---
  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    // Ocultar controles automáticamente tras 0.5 SEGUNDOS (500ms)
    // Excepción: Si está muteado, mantenemos los controles para invitar a desmutear
    if (isUserPlaying && !isIntroVisible && !isMuted) {
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 500); // <--- TIEMPO REDUCIDO A 0.5s
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isUserPlaying;
    setIsUserPlaying(newState);
    
    // Al cambiar estado, gestionamos la visibilidad de controles
    if (newState) {
        // Si dio Play -> Iniciar timer de ocultamiento rápido
        handleInteraction();
    } else {
        // Si dio Pause -> Mantener controles fijos
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
       {/* === FONDO: SIN SEÑAL === */}
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

       {/* === CAPA Z-10: CONTENIDO === */}
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

       {/* === CAPA Z-20: ESCUDO FANTASMA === */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* === CAPA Z-30: BARRAS DE CINE (REACTIVAS) === */}
       {!isSlide && (
         <>
            {/* Barra Superior */}
            <div 
              className={cn(
                "absolute top-0 h-[20%] w-full bg-black z-30 pointer-events-none transition-transform duration-500 ease-in-out",
                showCinemaBars ? "translate-y-0" : "-translate-y-full"
              )} 
            />
            {/* Barra Inferior */}
            <div 
              className={cn(
                "absolute bottom-0 h-[20%] w-full bg-black z-30 pointer-events-none transition-transform duration-500 ease-in-out",
                showCinemaBars ? "translate-y-0" : "translate-y-full"
              )} 
            />
         </>
       )}

       {/* === CAPA Z-40: VIDEO INTRO === */}
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
         />
       </div>

       {/* === CAPA Z-50: CONTROLES PROPIOS === */}
       <div 
         className={cn(
           "absolute inset-0 z-50 flex flex-col justify-between p-4 transition-all duration-300 pointer-events-none",
           // VISIBILIDAD: Muteado O ShowControls (ahora dura 0.5s)
           (isMuted || showControls) ? "opacity-100" : "opacity-0"
         )}
       >
          {/* HEADER UI */}
          <div className="flex justify-between items-start w-full">
              <button 
                onClick={handleToggleMute} 
                className={cn(
                  "pointer-events-auto p-3 rounded-full backdrop-blur border transition-all hover:scale-105",
                  isMuted 
                    ? "bg-red-500/80 text-white border-red-400 animate-pulse shadow-lg"
                    : "bg-black/60 text-white border-white/20 hover:bg-black/80"
                )}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>

              <div className="pointer-events-auto w-10 h-10 opacity-80 hover:opacity-100 transition-opacity">
                 <google-cast-launcher style={{ width: '100%', height: '100%' }}></google-cast-launcher>
              </div>
          </div>

          {/* CENTER UI */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <button 
               onClick={(e) => {
                  e.stopPropagation();
                  if (isMuted) {
                    handleToggleMute(e);
                  } else {
                    togglePlay(e);
                  }
               }}
               className={cn(
                 "pointer-events-auto group flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-5 shadow-2xl transition-all duration-300 ease-out",
                 "hover:bg-black/50 hover:scale-110 active:scale-95",
                 (!showControls && !isMuted) ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
               )}
             >
                {isMuted ? (
                  <VolumeX size={48} fill="white" className="text-white drop-shadow-md" />
                ) : isUserPlaying ? (
                  <Pause size={48} fill="white" className="text-white drop-shadow-md" />
                ) : (
                  <Play size={48} fill="white" className="text-white ml-1 drop-shadow-md" />
                )}
             </button>
          </div>

          <div className="w-full h-10" />
       </div>
    </div>
  );
}