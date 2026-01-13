'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import VideoPlayer from '@/components/player/VideoPlayer'; 
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function VideoSection({ isMobile }: { isMobile?: boolean }) {
  const { state, handleIntroProgress, handleIntroEnded, handleContentEnded } = useMediaPlayer();
  const { currentContent, currentIntroUrl, isIntroActive, isContentReadyToPlay } = state;
  
  const introVideoRef = useRef<HTMLVideoElement>(null);

  const [showControls, setShowControls] = useState(false);
  const [isUserMuted, setIsUserMuted] = useState(false); // Iniciar con sonido si el navegador deja, o mutear si falla
  const [introFading, setIntroFading] = useState(false);

  // --- EFECTO DE INTRO (HTML5 NATIVO) ---
  useEffect(() => {
    const videoEl = introVideoRef.current;
    if (isIntroActive && currentIntroUrl && videoEl) {
        videoEl.src = currentIntroUrl;
        videoEl.load();
        
        // Intentar reproducir
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay de intro bloqueado, intentando mute...", error);
                videoEl.muted = true;
                videoEl.play();
            });
        }
        setIntroFading(false);
    }
  }, [currentIntroUrl, isIntroActive]);

  // --- LOGICA DE TIEMPO DE INTRO ---
  const handleTimeUpdate = () => {
    const videoEl = introVideoRef.current;
    if (!videoEl) return;
    
    const remaining = videoEl.duration - videoEl.currentTime;
    
    // 1. Avisar al contexto para prender el de abajo (4 seg antes)
    handleIntroProgress(remaining);

    // 2. Fade Out visual en los últimos 0.5 seg
    if (remaining <= 0.5 && !introFading) {
        setIntroFading(true);
    }
  };

  const onIntroEnded = () => {
    handleIntroEnded();
    setIntroFading(false);
  };

  // --- CONTROLES DE USUARIO ---
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserMuted(!isUserMuted);
  };

  const handleInteraction = () => {
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div 
      className="w-full bg-black relative aspect-video overflow-hidden shadow-sm group select-none"
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
    >
       {/* === FONDO: Ruido Analógico (Si no hay nada cargado) === */}
       {(!currentContent && !isIntroActive) && (
         <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#1a1a1a]">
            <p className="text-white/20 font-mono animate-pulse">ESPERANDO DATOS...</p>
         </div>
       )}

       {/* === CAPA INFERIOR (Z-10): EL CONTENIDO (YouTube / Slide) === */}
       {/* Se monta siempre que haya currentContent, pero 'isActive' define si corre o no */}
       <div className="absolute inset-0 z-10"> 
          {currentContent && (
             <VideoPlayer 
                content={currentContent}
                // REGLA DE ORO: Arranca cuando la intro avisa (4s antes) O si ya no hay intro
                shouldPlay={isContentReadyToPlay || !isIntroActive} 
                onEnded={handleContentEnded}
                muted={isUserMuted} 
             />
          )}
       </div>

       {/* === CAPA SUPERIOR (Z-20): LA INTRO === */}
       <div 
         className={cn(
            "absolute inset-0 z-20 bg-black transition-opacity duration-500",
            isIntroActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            introFading && "opacity-0" // Fade out forzado al final
         )}
       >
         <video 
            ref={introVideoRef}
            className="w-full h-full object-cover"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={onIntroEnded}
            onError={onIntroEnded} // Si falla, quitamos la capa para ver el video de abajo
            muted={false} // Intentamos con sonido
         />
       </div>

       {/* === CAPA Z-50: CONTROLES === */}
       <div 
         className={cn(
           "absolute inset-0 z-50 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
           showControls ? "opacity-100" : "opacity-0"
         )}
       >
          <button 
            onClick={toggleMute} 
            className="pointer-events-auto p-3 rounded-full bg-black/50 text-white backdrop-blur border border-white/20"
          >
             {isUserMuted ? <VolumeX /> : <Volume2 />}
          </button>
       </div>
    </div>
  );
}