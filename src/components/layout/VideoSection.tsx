'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// VOLVEMOS AL MOTOR ESPECÍFICO DE YOUTUBE (Mejor estética)
const ReactPlayer = dynamic(() => import('react-player/youtube'), { ssr: false });

// VIDEO DE RESPALDO (Por seguridad)
const INTERNAL_BACKUP = {
  nombre: 'Saladillo Vivo',
  url: 'https://www.youtube.com/watch?v=ysz5S6P_bsI',
  es_vivo: true
};

interface VideoSectionProps {
  isMobile?: boolean;
}

export default function VideoSection({ isMobile }: VideoSectionProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { currentVideo, isPlaying, togglePlay } = useMediaPlayer();
  const { isMuted, toggleMute } = useVolume();
  
  // Usamos el video actual o el respaldo si está cargando
  const activeVideo = currentVideo || INTERNAL_BACKUP;
  
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    // Solo ocultamos si está reproduciendo
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isMounted) handleInteraction();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isMounted, activeVideo, handleInteraction]);

  if (!isMounted) return <div className="w-full h-full bg-black" />;

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden group select-none"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* 1. CAPA DE VIDEO (Fondo) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black pointer-events-none">
        <ReactPlayer
          url={activeVideo.url}
          playing={isPlaying}
          muted={isMuted}
          width="100%"
          height="100%"
          controls={false} // IMPORTANTE: Apagar controles nativos
          playsinline={true}
          config={{
            youtube: {
              playerVars: { 
                showinfo: 0, 
                modestbranding: 1, 
                rel: 0, 
                disablekb: 1, 
                fs: 0, 
                controls: 0, // Doble seguridad para ocultar controles nativos
                iv_load_policy: 3 
              }
            }
          }}
        />
      </div>

      {/* 2. BARRAS DE CINE (Anti-Branding) - Z-30 */}
      <div className={cn("absolute top-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "-translate-y-full" : "translate-y-0")} />
      <div className={cn("absolute bottom-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "translate-y-full" : "translate-y-0")} />

      {/* 3. TUS CONTROLES PERSONALIZADOS - Z-40 */}
      <div className={cn("absolute inset-0 z-40 flex flex-col justify-between p-4 transition-opacity duration-300", showControls ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none")}>
        {/* Cabecera: Título */}
        <div className="flex justify-between items-start">
           <h2 className="text-white text-sm font-bold drop-shadow-md line-clamp-1 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
             {activeVideo.nombre}
           </h2>
        </div>

        {/* Centro: Play Gigante */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <button 
             onClick={(e) => { e.stopPropagation(); togglePlay(); handleInteraction(); }}
             className="pointer-events-auto bg-black/40 p-4 rounded-full backdrop-blur-sm border border-white/20 hover:scale-110 transition-transform shadow-xl active:scale-95"
           >
              {isPlaying ? <Pause fill="white" size={32} className="text-white"/> : <Play fill="white" size={32} className="text-white ml-1"/>}
           </button>
        </div>

        {/* Pie: Botonera inferior */}
        <div className="flex justify-between items-center bg-black/60 p-2 rounded-lg backdrop-blur-md border border-white/10">
           <div className="flex items-center gap-4">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); handleInteraction(); }}>
                {isPlaying ? <Pause size={20} className="text-white"/> : <Play size={20} className="text-white"/>}
              </button>
              
              <button onClick={(e) => { e.stopPropagation(); toggleMute(); handleInteraction(); }}>
                {isMuted ? <VolumeX size={20} className="text-red-500"/> : <Volume2 size={20} className="text-white"/>}
              </button>
              
              {/* Indicador EN VIVO */}
              {((activeVideo as any).es_vivo || activeVideo.url === INTERNAL_BACKUP.url) && (
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