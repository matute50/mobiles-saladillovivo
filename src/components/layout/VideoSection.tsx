'use client';

import React, { useState, useEffect } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import VideoPlayer from '@/components/player/VideoPlayer'; 
import { cn } from '@/lib/utils';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Video } from '@/lib/types'; 

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'google-cast-launcher': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export default function VideoSection({ isMobile }: { isMobile?: boolean }) {
  const { state, handleContentEnded, dismissIntro } = useMediaPlayer();
  const { currentContent, currentIntro, isIntroVisible } = state;
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isUserMuted, setIsUserMuted] = useState(true);
  const [showBars, setShowBars] = useState(true);

  const [isIntroReady, setIsIntroReady] = useState(false);

  const isVideo = currentContent && 'url' in currentContent && typeof (currentContent as any).url === 'string' && !('url_slide' in currentContent);

  useEffect(() => {
    setIsIntroReady(false);
  }, [currentIntro]);

  useEffect(() => {
    if (isIntroVisible) {
      setShowBars(true); 
    } else {
      const timer = setTimeout(() => setShowBars(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isIntroVisible]);

  useEffect(() => {
    if (!showControls || !isPlaying) return; 
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls, isPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    const willPlay = !isPlaying; 
    setIsPlaying(willPlay);
    setShowControls(true);
    if (willPlay) setTimeout(() => setShowBars(false), 500);
    else setShowBars(true); 
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsUserMuted(!isUserMuted);
    setShowControls(true); 
  };

  const handleInteraction = () => {
    setShowControls(true);
  };

  return (
    <div 
      className="w-full bg-black relative aspect-video overflow-hidden shadow-sm group select-none"
      onMouseEnter={handleInteraction}
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
    >
        {/* ESTILOS CAÓTICOS (DIGITAL GLITCH) */}
        <style jsx>{`
            /* COLORES DE SALADILLO VIVO - AJUSTA AQUI TUS CODIGOS HEX */
            :root {
                --brand-primary: #0088ff;  /* Azul (Ejemplo) */
                --brand-secondary: #ff4400; /* Naranja/Rojo (Ejemplo) */
                --brand-light: #ffffff;
            }

            .glitch-wrapper {
                position: relative;
                color: var(--brand-light);
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                animation: glitch-skew 1s infinite linear alternate-reverse;
            }
            .glitch-wrapper::before,
            .glitch-wrapper::after {
                content: attr(data-text);
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            .glitch-wrapper::before {
                left: 2px;
                text-shadow: -2px 0 var(--brand-secondary);
                clip-path: inset(0 0 0 0);
                animation: glitch-anim-1 2s infinite linear alternate-reverse;
            }
            .glitch-wrapper::after {
                left: -2px;
                text-shadow: -2px 0 var(--brand-primary);
                clip-path: inset(0 0 0 0);
                animation: glitch-anim-2 3s infinite linear alternate-reverse;
            }

            @keyframes glitch-anim-1 {
                0% { clip-path: inset(20% 0 80% 0); }
                20% { clip-path: inset(60% 0 10% 0); }
                40% { clip-path: inset(40% 0 50% 0); }
                60% { clip-path: inset(80% 0 5% 0); }
                80% { clip-path: inset(10% 0 70% 0); }
                100% { clip-path: inset(30% 0 20% 0); }
            }
            @keyframes glitch-anim-2 {
                0% { clip-path: inset(10% 0 60% 0); }
                20% { clip-path: inset(80% 0 5% 0); }
                40% { clip-path: inset(30% 0 20% 0); }
                60% { clip-path: inset(10% 0 80% 0); }
                80% { clip-path: inset(50% 0 30% 0); }
                100% { clip-path: inset(70% 0 10% 0); }
            }
            @keyframes glitch-skew {
                0% { transform: skew(0deg); }
                20% { transform: skew(-2deg); }
                40% { transform: skew(2deg); }
                60% { transform: skew(-1deg); }
                80% { transform: skew(3deg); }
                100% { transform: skew(0deg); }
            }
        `}</style>

       {/* === CAPA 1: VIDEO YOUTUBE / SLIDE === */}
       <div className="absolute inset-0 z-10 pointer-events-none"> 
          <VideoPlayer 
            content={currentContent}
            isActive={true} 
            onEnded={handleContentEnded}
            muted={isUserMuted} 
            volume={1}
            isPlaying={isPlaying} 
          />
       </div>

       {/* === CAPA 2: ESCUDO TRANSPARENTE === */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* === CAPA 3: PUENTE DE CARGA (CAÓTICO) === */}
       {isIntroVisible && !isIntroReady && (
         <div className="absolute inset-0 z-30 flex items-center justify-center bg-black overflow-hidden">
            
            {/* 1. Fondo Caótico (Parpadeos rápidos) */}
            <div className="absolute inset-0 bg-white opacity-5 animate-[pulse_0.1s_ease-in-out_infinite]" />
            
            {/* 2. Barras de Color Aleatorias (Marca) */}
            <div className="absolute top-[10%] left-0 w-full h-2 bg-[var(--brand-primary)] opacity-60 animate-[pulse_0.2s_infinite]" />
            <div className="absolute bottom-[20%] left-0 w-full h-8 bg-[var(--brand-secondary)] opacity-40 animate-[pulse_0.15s_infinite]" />
            <div className="absolute top-[50%] left-0 w-full h-1 bg-white opacity-80 animate-[ping_0.5s_infinite]" />

            {/* 3. Texto Glitch Principal */}
            <div className="relative z-40 p-4 bg-black/50 backdrop-blur-sm">
                <h1 className="glitch-wrapper text-4xl md:text-6xl font-black" data-text="SINTONIZANDO...">
                    SINTONIZANDO...
                </h1>
            </div>
         </div>
       )}

       {/* === CAPA 4: INTRO === */}
       <div className={cn(
          "absolute inset-0 z-40 transition-opacity duration-300 ease-out", 
          (isIntroVisible && isIntroReady) ? "opacity-100" : "opacity-0 pointer-events-none"
       )}>
         {currentIntro && (
            <ReactPlayer
              key={currentIntro} 
              url={currentIntro} 
              playing={true} 
              width="100%" 
              height="100%" 
              volume={1} 
              muted={false} 
              playsinline 
              loop={false} 
              onStart={() => setIsIntroReady(true)} 
              onEnded={dismissIntro}
              onError={dismissIntro}
              style={{ backgroundColor: 'black' }} 
              config={{ file: { attributes: { style: { objectFit: 'cover', width: '100%', height: '100%' } } } }}
            />
         )}
       </div>

       {/* === CAPA 5: BARRAS Y CONTROLES === */}
       {isVideo && (
         <>
           <div className={cn("absolute top-0 left-0 right-0 h-[19%] bg-black z-30 transition-transform duration-500 ease-in-out", showBars ? "translate-y-0" : "-translate-y-full")} />
           <div className={cn("absolute bottom-0 left-0 right-0 h-[19%] bg-black z-30 transition-transform duration-500 ease-in-out", showBars ? "translate-y-0" : "translate-y-full")} />
         </>
       )}

       {isUserMuted && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
              <button 
                onClick={toggleMute}
                className="pointer-events-auto p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-red-500 shadow-2xl scale-110 active:scale-95 transition-all animate-in zoom-in duration-300"
              >
                <VolumeX size={48} fill="currentColor" />
              </button>
          </div>
       )}

       <div 
         className={cn(
           "absolute inset-0 z-50 flex items-center justify-center bg-black/30 transition-opacity duration-300",
           showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
         )}
       >
          <button onClick={toggleMute} className="absolute top-3 left-3 p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 active:scale-95 transition-all">
             {isUserMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <div className="absolute top-3 right-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
             <google-cast-launcher style={{ width: '40px', height: '40px', display: 'block' }}></google-cast-launcher>
          </div>

          {!isUserMuted && (
            <button onClick={togglePlay} className="p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-2xl scale-110 active:scale-95 transition-all">
              {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
            </button>
          )}
       </div>
    </div>
  );
}