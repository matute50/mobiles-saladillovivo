'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
// USAMOS LAZY LOAD PARA EVITAR EL CRASH INICIAL
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player/lazy'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-black flex items-center justify-center text-white/20">Cargando player...</div>
});

import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoSectionProps {
  isMobile?: boolean;
}

export default function VideoSection({ isMobile }: VideoSectionProps) {
  const { currentVideo, isPlaying, togglePlay } = useMediaPlayer();
  const { isMuted, toggleMute } = useVolume();
  
  // 1. CONTROL DE MONTAJE (CRÍTICO PARA EVITAR APPLICATION ERROR)
  const [isMounted, setIsMounted] = useState(false);
  
  // 2. ESTADO VISUAL DE CONTROLES
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lógica de interacción (3 segundos)
  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    // Solo ocultar si estamos reproduciendo
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Si no está montado en el cliente, devolvemos un div negro inerte (NO ROMPE LA APP)
  if (!isMounted) return <div className="w-full h-full bg-black" />;

  // Si no hay video
  if (!currentVideo) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white text-xs">
        <p>Seleccione un video</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden group select-none"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* CAPA DE VIDEO */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
        <ReactPlayer
          url={currentVideo.url}
          playing={isPlaying}
          muted={isMuted}
          width="100%"
          height="100%"
          controls={false} // IMPORTANTE: Sin controles nativos
          playsinline={true}
          style={{ pointerEvents: 'none' }} // El usuario no interactúa con el video, solo con nuestros botones
          config={{
            youtube: {
              playerVars: { showinfo: 0, modestbranding: 1, rel: 0, disablekb: 1, fs: 0, iv_load_policy: 3 }
            }
          }}
          // IMPORTANTE: NO usamos onPlay/onPause aquí para evitar bucles de estado.
          // Confiamos en el estado global 'isPlaying'.
        />
      </div>

      {/* BARRAS NEGRAS (CINE) */}
      <div className={cn("absolute top-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "-translate-y-full" : "translate-y-0")} />
      <div className={cn("absolute bottom-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "translate-y-full" : "translate-y-0")} />

      {/* CONTROLES */}
      <div className={cn("absolute inset-0 z-40 flex flex-col justify-between p-4 transition-opacity duration-300", showControls ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none")}>
        {/* Cabecera */}
        <div className="flex justify-between items-start">
           <h2 className="text-white text-sm font-bold drop-shadow-md line-clamp-1 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
             {currentVideo.nombre}
           </h2>
        </div>

        {/* Botón Central Play/Pause */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <button 
             onClick={(e) => { e.stopPropagation(); togglePlay(); handleInteraction(); }}
             className="pointer-events-auto bg-black/40 p-4 rounded-full backdrop-blur-sm border border-white/20 hover:scale-110 transition-transform shadow-xl active:scale-95"
           >
              {isPlaying ? <Pause fill="white" size={32} className="text-white"/> : <Play fill="white" size={32} className="text-white ml-1"/>}
           </button>
        </div>

        {/* Barra Inferior */}
        <div className="flex justify-between items-center bg-black/60 p-2 rounded-lg backdrop-blur-md border border-white/10">
           <div className="flex items-center gap-4">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); handleInteraction(); }}>
                {isPlaying ? <Pause size={20} className="text-white"/> : <Play size={20} className="text-white"/>}
              </button>
              
              <button onClick={(e) => { e.stopPropagation(); toggleMute(); handleInteraction(); }}>
                {isMuted ? <VolumeX size={20} className="text-red-500"/> : <Volume2 size={20} className="text-white"/>}
              </button>
              
              {currentVideo.es_vivo && (
                 <span className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>
                    <span className="text-[10px] font-bold text-red-500 uppercase">EN VIVO</span>
                 </span>
              )}
           </div>
           <div className="text-white/80 text-[10px] font-mono tracking-wider">SALADILLO VIVO</div>
        </div>
      </div>
    </div>
  );
}