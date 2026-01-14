'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [isUserPlaying, setIsUserPlaying] = useState(true); 
  const [isUserMuted, setIsUserMuted] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- LÓGICA DE EXISTENCIA DE BARRAS (Renderizado) ---
  const shouldRenderCinemaBars = useMemo(() => {
    // 1. Si es Slide (.html), NO renderizar barras nunca (necesitamos 100% pantalla)
    if (currentContent && 'url_slide' in currentContent) {
        return false;
    }
    // 2. Si es YouTube (o carga/intro), SÍ renderizar barras
    return true;
  }, [currentContent]);

  // --- LÓGICA REPRODUCTOR INTRO ---
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
        setIsUserPlaying(true); 
    }
  }, [currentIntroUrl, isIntroVisible]);

  const onIntroEnd = () => {
    handleIntroEnded(); 
  };

  // --- GESTIÓN DE INTERACCIÓN (Sincronización Controles + Barras) ---
  const handleInteraction = () => {
    setShowControls(true); // Activa Controles Y Retira Barras
    
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    // Temporizador de 3 segundos
    // Oculta controles Y Restaura Barras automáticamente
    if (isUserPlaying && !isIntroVisible && !isUserMuted) {
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
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        setShowControls(true); 
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserMuted(!isUserMuted);
    handleInteraction();
  };

  const isVideoActive = shouldPlayContent && isUserPlaying;

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
                muted={isUserMuted} 
             />
          )}
       </div>

       {/* === CAPA Z-20: ESCUDO FANTASMA === */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* === CAPA Z-30: BARRAS DE CINE (DINÁMICAS) === */}
       {shouldRenderCinemaBars && (
         <>
            {/* Barra Superior: Sube (-translate-y-full) si showControls es TRUE */}
            <div 
              className={cn(
                "absolute top-0 h-[19%] w-full bg-black z-30 pointer-events-none transition-transform duration-500 ease-in-out",
                showControls ? "-translate-y-full" : "translate-y-0"
              )} 
            />
            
            {/* Barra Inferior: Baja (translate-y-full) si showControls es TRUE */}
            <div 
              className={cn(
                "absolute bottom-0 h-[19%] w-full bg-black z-30 pointer-events-none transition-transform duration-500 ease-in-out",
                showControls ? "translate-y-full" : "translate-y-0"
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
            muted={false}
         />
       </div>

       {/* === CAPA Z-50: CONTROLES PROPIOS === */}
       <div 
         className={cn(
           "absolute inset-0 z-50 flex flex-col justify-between p-4 transition-all duration-500 pointer-events-none",
           (isUserMuted || showControls) ? "opacity-100" : "opacity-0"
         )}
       >
          {/* HEADER UI */}
          <div className="flex justify-between items-start w-full">
              <button 
                onClick={toggleMute} 
                className={cn(
                  "pointer-events-auto p-3 rounded-full backdrop-blur border transition-all hover:scale-105",
                  isUserMuted 
                    ? "bg-red-500/80 text-white border-red-400 animate-pulse shadow-lg"
                    : "bg-black/60 text-white border-white/20 hover:bg-black/80"
                )}
              >
                {isUserMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>

              <div className="pointer-events-auto w-10 h-10 opacity-80 hover:opacity-100 transition-opacity">
                 <google-cast-launcher style={{ width: '100%', height: '100%' }}></google-cast-launcher>
              </div>
          </div>

          {/* CENTER UI: BOTÓN HÍBRIDO */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <button 
               onClick={(e) => {
                  e.stopPropagation();
                  if (isUserMuted) {
                    toggleMute(e);
                  } else {
                    togglePlay(e);
                  }
               }}
               className={cn(
                 "pointer-events-auto group flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md p-6 transition-all duration-300 ease-out shadow-2xl",
                 "hover:bg-black/50 hover:scale-105 active:scale-95",
                 (!showControls && !isUserMuted) ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
               )}
             >
                {isUserMuted ? (
                  <VolumeX size={48} className="text-white fill-white/10" strokeWidth={1.5} />
                ) : isUserPlaying ? (
                  <Pause size={48} className="text-white fill-white" strokeWidth={0} />
                ) : (
                  <Play size={48} className="text-white fill-white ml-1" strokeWidth={0} />
                )}
             </button>
          </div>

          <div className="w-full h-10" />
       </div>
    </div>
  );
}