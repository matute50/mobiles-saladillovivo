'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Usamos el player de YouTube
const ReactPlayer = dynamic(() => import('react-player/youtube'), { ssr: false });

const INTERNAL_BACKUP = {
  nombre: 'Saladillo Vivo',
  url: 'https://www.youtube.com/watch?v=ysz5S6P_bsI',
  es_vivo: true
};

interface VideoSectionProps {
  isMobile?: boolean;
}

export default function VideoSection({ isMobile }: VideoSectionProps) {
  // 1. ESTADO PARA EL ORIGEN (La clave de seguridad)
  const [appOrigin, setAppOrigin] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { currentVideo, isPlaying, togglePlay } = useMediaPlayer();
  const { isMuted, toggleMute } = useVolume();
  
  const activeVideo = currentVideo || INTERNAL_BACKUP;
  
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 2. CAPTURA DEL ORIGEN AL INICIAR
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      // Capturamos la URL exacta donde está corriendo la app (localhost o vercel)
      setAppOrigin(window.location.origin);
    }
  }, []);

  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
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

  // 3. BLOQUEO TOTAL: Si no hay origen, no renderizamos NADA.
  // Esto evita que el player cargue con la configuración incorrecta.
  if (!isMounted || !appOrigin) return <div className="w-full h-full bg-black" />;

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden group select-none"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* CAPA DE VIDEO */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black pointer-events-none">
        <ReactPlayer
          // EL TRUCO MAESTRO: Usar el origen como key fuerza a React a recrear el componente
          // con la configuración correcta si algo cambia.
          key={appOrigin} 
          url={activeVideo.url}
          playing={isPlaying}
          muted={isMuted}
          width="100%"
          height="100%"
          controls={false}
          playsinline={true}
          config={{
            youtube: {
              playerVars: { 
                origin: appOrigin, // Aquí inyectamos la URL validada
                enablejsapi: 1, 
                showinfo: 0, 
                modestbranding: 1, 
                rel: 0, 
                disablekb: 1, 
                fs: 0, 
                controls: 0,
                iv_load_policy: 3,
                autohide: 1
              }
            }
          }}
        />
      </div>

      {/* BARRAS DE CINE */}
      <div className={cn("absolute top-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "-translate-y-full" : "translate-y-0")} />
      <div className={cn("absolute bottom-0 left-0 right-0 bg-black z-30 h-[20%] transition-transform duration-500 ease-in-out pointer-events-none", showControls ? "translate-y-full" : "translate-y-0")} />

      {/* CONTROLES */}
      <div className={cn("absolute inset-0 z-40 flex flex-col justify-between p-4 transition-opacity duration-300", showControls ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none")}>
        {/* Cabecera */}
        <div className="flex justify-between items-start">
           <h2 className="text-white text-sm font-bold drop-shadow-md line-clamp-1 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
             {activeVideo.nombre}
           </h2>
        </div>

        {/* Play Gigante */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <button 
             onClick={(e) => { 
                e.stopPropagation(); 
                if(togglePlay) togglePlay(); 
                handleInteraction(); 
             }}
             className="pointer-events-auto bg-black/40 p-4 rounded-full backdrop-blur-sm border border-white/20 hover:scale-110 transition-transform shadow-xl active:scale-95"
           >
              {isPlaying ? <Pause fill="white" size={32} className="text-white"/> : <Play fill="white" size={32} className="text-white ml-1"/>}
           </button>
        </div>

        {/* Pie */}
        <div className="flex justify-between items-center bg-black/60 p-2 rounded-lg backdrop-blur-md border border-white/10">
           <div className="flex items-center gap-4">
              <button onClick={(e) => { 
                 e.stopPropagation(); 
                 if(togglePlay) togglePlay(); 
                 handleInteraction(); 
              }}>
                {isPlaying ? <Pause size={20} className="text-white"/> : <Play size={20} className="text-white"/>}
              </button>
              
              <button onClick={(e) => { 
                 e.stopPropagation(); 
                 if(toggleMute) toggleMute(); 
                 handleInteraction(); 
              }}>
                {isMuted ? <VolumeX size={20} className="text-red-500"/> : <Volume2 size={20} className="text-white"/>}
              </button>
              
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