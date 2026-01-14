'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
// CAMBIO 1: Importamos la librería general, es más estable que '/youtube'
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

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
  
  // Estado de montaje (Client-side check)
  const [hasMounted, setHasMounted] = useState(false);
  
  // Estados de interfaz
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Evitar renderizado hasta que el cliente esté listo
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Lógica de interacción (3 segundos)
  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    // Solo ocultamos automáticamente si el video se está reproduciendo
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Efecto: Cuando cambia el estado de reproducción, gestionamos los controles
  useEffect(() => {
    handleInteraction();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying, handleInteraction]);

  // 1. Si no estamos en el cliente, no renderizamos nada (Evita error de aplicación)
  if (!hasMounted) return <div className="w-full h-full bg-black" />;

  // 2. Si no hay video, mostramos cargando
  if (!currentVideo) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white text-xs">
        <p>Cargando video...</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden group"
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* CAPA DE VIDEO */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <ReactPlayer
          url={currentVideo.url}
          playing={isPlaying}
          muted={isMuted}
          width="100%"
          height="100%"
          controls={false} // IMPORTANTE: Sin controles nativos
          playsinline={true} // Importante para móviles (evita fullscreen forzado)
          config={{
            youtube: {
              playerVars: { showinfo: 0, modestbranding: 1, rel: 0, disablekb: 1, fs: 0 }
            }
          }}
          // CAMBIO CRÍTICO: Eliminamos onPlay para evitar el bucle infinito que rompía la app
          onEnded={() => setShowControls(true)}
        />
      </div>

      {/* BARRAS NEGRAS (Cine) */}
      <div className={cn("absolute top-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "-translate-y-full" : "translate-y-0")} />
      <div className={cn("absolute bottom-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "translate-y-full" : "translate-y-0")} />

      {/* CONTROLES PROPIOS */}
      <div className={cn("absolute inset-0 z-40 flex flex-col justify-between p-4 transition-opacity duration-300", showControls ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none")}>
        {/* Header Título */}
        <div className="flex justify-between items-start">
           <h2 className="text-white text-sm font-bold drop-shadow-md line-clamp-1 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
             {currentVideo.nombre}
           </h2>
        </div>

        {/* Botón Central Play/Pause */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <button 
             onClick={(e) => { e.stopPropagation(); togglePlay(); }} // Solo togglePlay manual
             className="pointer-events-auto bg-black/40 p-4 rounded-full backdrop-blur-sm border border-white/20 hover:scale-110 transition-transform shadow-xl active:scale-95"
           >
              {isPlaying ? <Pause fill="white" size={32} className="text-white"/> : <Play fill="white" size={32} className="text-white ml-1"/>}
           </button>
        </div>

        {/* Barra Inferior */}
        <div className="flex justify-between items-center bg-black/60 p-2 rounded-lg backdrop-blur-md border border-white/10">
           <div className="flex items-center gap-4">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                {isPlaying ? <Pause size={20} className="text-white"/> : <Play size={20} className="text-white"/>}
              </button>
              
              <button onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
                {isMuted ? <VolumeX size={20} className="text-red-500"/> : <Volume2 size={20} className="text-white"/>}
              </button>
              
              {currentVideo.es_vivo && (
                 <span className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>
                    <span className="text-[10px] font-bold text-red-500 uppercase">EN VIVO</span>
                 </span>
              )}
           </div>
           
           <div className="text-white/80 text-[10px] font-mono tracking-wider">
              SALADILLO VIVO
           </div>
        </div>
      </div>
    </div>
  );
}