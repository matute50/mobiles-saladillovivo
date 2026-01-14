'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// IMPORTACIÓN SEGURA: Se carga solo cuando se necesita
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface VideoSectionProps {
  isMobile?: boolean;
}

export default function VideoSection({ isMobile }: VideoSectionProps) {
  // 1. ESTADO DE MONTAJE (La clave para evitar el error)
  const [isMounted, setIsMounted] = useState(false);

  // Hooks de contexto
  const { currentVideo, isPlaying, togglePlay } = useMediaPlayer();
  const { isMuted, toggleMute } = useVolume();
  
  // Estados visuales
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 2. EFECTO DE ACTIVACIÓN: Solo se activa cuando el navegador está listo
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lógica de 3 segundos
  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Sincronización
  useEffect(() => {
    if (isMounted) {
      handleInteraction();
    }
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isMounted, currentVideo, handleInteraction]);

  // --- PUNTO DE CONTROL CRÍTICO ---
  // Si no está montado (servidor) O no hay video, devolvemos un div negro simple.
  // ESTO EVITA QUE NEXT.JS LANCE EL ERROR.
  if (!isMounted || !currentVideo) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <span className="text-white/20 text-xs">Cargando...</span>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden group select-none"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* 1. REPRODUCTOR */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
        <ReactPlayer
          url={currentVideo.url}
          playing={isPlaying}
          muted={isMuted}
          width="100%"
          height="100%"
          controls={false}
          playsinline={true}
          style={{ pointerEvents: 'none' }}
          config={{
            youtube: {
              playerVars: { showinfo: 0, modestbranding: 1, rel: 0, disablekb: 1, fs: 0 }
            }
          }}
          // Eliminamos onPlay para seguridad máxima
        />
      </div>

      {/* 2. BARRAS DE CINE */}
      <div className={cn("absolute top-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "-translate-y-full" : "translate-y-0")} />
      <div className={cn("absolute bottom-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "translate-y-full" : "translate-y-0")} />

      {/* 3. CONTROLES */}
      <div className={cn("absolute inset-0 z-40 flex flex-col justify-between p-4 transition-opacity duration-300", showControls ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none")}>
        {/* Cabecera */}
        <div className="flex justify-between items-start">
           <h2 className="text-white text-sm font-bold drop-shadow-md line-clamp-1 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
             {currentVideo.nombre}
           </h2>
        </div>

        {/* Play Gigante */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <button 
             onClick={(e) => { e.stopPropagation(); togglePlay(); handleInteraction(); }}
             className="pointer-events-auto bg-black/40 p-4 rounded-full backdrop-blur-sm border border-white/20 hover:scale-110 transition-transform shadow-xl active:scale-95"
           >
              {isPlaying ? <Pause fill="white" size={32} className="text-white"/> : <Play fill="white" size={32} className="text-white ml-1"/>}
           </button>
        </div>

        {/* Pie */}
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