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
        {/* ESTILOS ANALÓGICOS (TV SNOW / STATIC) */}
        <style jsx>{`
            .analog-wrapper {
                position: absolute;
                inset: 0;
                background-color: #0a0a0a;
                overflow: hidden;
            }

            .analog-static {
                position: absolute;
                top: -100%; left: -100%; right: -100%; bottom: -100%;
                background-image: 
                    repeating-radial-gradient(circle at 50% 50%, transparent 0, #000 1px, transparent 2px, rgba(255,255,255,0.3) 3px),
                    repeating-linear-gradient(to right, rgba(100,100,100,0.1) 0, transparent 2px, rgba(200,200,200,0.1) 4px);
                background-size: 8px 8px, 100% 100%;
                animation: noise-shift 0.2s steps(4) infinite alternate-reverse;
                opacity: 0.8;
            }

            .scanlines {
                position: absolute;
                inset: 0;
                background: linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.8) 50%);
                background-size: 100% 3px;
                pointer-events: none;
                z-index: 5;
                opacity: 0.6;
            }

            .tracking-distortion {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 20%;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(8px) contrast(1.5);
                box-shadow: 0 0 20px rgba(255,255,255,0.2);
                animation: tracking-scroll 4s linear infinite;
                z-index: 4;
            }

            .crt-vignette {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,1) 130%);
                z-index: 6;
            }

            @keyframes noise-shift {
                0% { transform: translate(0,0); }
                25% { transform: translate(-10px, 10px); }
                50% { transform: translate(5px, -5px); }
                75% { transform: translate(15px, 5px); }
                100% { transform: translate(-5px, -15px); }
            }
            @keyframes tracking-scroll {
                0% { top: -30%; opacity: 0; }
                10% { opacity: 0.7; }
                90% { opacity: 0.7; }
                100% { top: 120%; opacity: 0; }
            }
        `}</style>

       {/* === CAPA 1: VIDEO YOUTUBE / SLIDE === */}
       <div className="absolute inset-0 z-10 pointer-events-none"> 
          <VideoPlayer 
            content={currentContent}
            // --- CORRECCIÓN CRÍTICA ---
            // Solo activamos el video de fondo si el INTRO NO ES VISIBLE.
            // Esto evita que suene antes de tiempo y que congele el intro por carga de CPU.
            isActive={!isIntroVisible} 
            // ---------------------------
            onEnded={handleContentEnded}
            muted={isUserMuted} 
            volume={1}
            isPlaying={isPlaying} 
          />
       </div>

       {/* === CAPA 2: ESCUDO TRANSPARENTE === */}
       <div className="absolute inset-0 z-20 bg-transparent" onClick={handleInteraction} />

       {/* === CAPA 3: PUENTE DE CARGA (DEFECTO ANALÓGICO) === */}
       {isIntroVisible && !isIntroReady && (
         <div className="analog-wrapper z-30 flex items-center justify-center">
            <div className="analog-static" />
            <div className="tracking-distortion" />
            <div className="scanlines" />
            <div className="crt-vignette" />
            <div className="relative z-40 p-2 bg-black/20 backdrop-blur-[2px]">
                <p className="text-white/40 font-mono text-xs md:text-sm tracking-[0.3em] animate-pulse drop-shadow-md">
                    SIN SEÑAL
                </p>
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