'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Video, Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OnProgressProps } from 'react-player/base';

interface VideoPlayerProps {
  content: Video | Article | null;
  isActive: boolean;
  shouldPreload?: boolean;
  onEnded: () => void;
  muted?: boolean; 
  isPlaying: boolean;
}

export default function VideoPlayer({ 
  content, 
  isActive, 
  onEnded, 
  muted = true, 
  isPlaying = true 
}: VideoPlayerProps) {
  
  const playerRef = useRef<ReactPlayer>(null);
  
  // Estados de carga y finalización
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // NUEVO: Estado para saber si YouTube está "pensando" (ruedita de carga)
  const [isBuffering, setIsBuffering] = useState(false);

  const durationRef = useRef<number>(0);

  // CONFIGURACIÓN DE FILTROS
  const ENABLE_FILTERS = true; 

  // --- 1. LÓGICA DE RESETEO ---
  useEffect(() => {
    setIsFadingOut(false);
    setIsLoaded(false); 
    setIsBuffering(false); // Reseteamos buffer al cambiar video
    durationRef.current = 0;
  }, [content]);

  // --- 2. LÓGICA PARA ARTÍCULOS ---
  useEffect(() => {
    const isArticle = content && !('url' in content && typeof (content as Video).url === 'string');
    
    if (!isArticle || !isPlaying || !isActive) return;

    const article = content as Article;
    const totalDuration = (article.animation_duration || 15) * 1000;
    const fadeDuration = 500; 

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, totalDuration - fadeDuration);

    const endTimer = setTimeout(() => {
      onEnded();
    }, totalDuration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [content, isPlaying, isActive, onEnded]);

  // --- 3. LÓGICA PARA VIDEOS ---
  const handleDuration = (duration: number) => {
    durationRef.current = duration;
  };

  const handleProgress = (state: OnProgressProps) => {
    // Si estamos reproduciendo, seguro no estamos buferizando
    if (state.playedSeconds > 0 && isBuffering) setIsBuffering(false);

    if (!durationRef.current || durationRef.current === 0) return;
    const timeLeft = durationRef.current - state.playedSeconds;

    if (timeLeft < 0.6 && !isFadingOut) setIsFadingOut(true);
    if (timeLeft < 0.2) onEnded();
  };


  // --- COMPONENTE DE FILTROS (DINÁMICO) ---
  // Recibe 'isHeavy' para saber si debe tapar todo o ser sutil
  const RetroFilters = ({ isHeavy }: { isHeavy: boolean }) => (
    <div 
      className={cn(
        "absolute inset-0 z-[15] pointer-events-none transition-opacity duration-300",
        // Si es Heavy (Cargando/Buffer) -> Opacidad 100% (Tapa el video)
        // Si no es Heavy (Reproduciendo) -> Opacidad 20% (Efecto sutil) o 0% si prefieres limpio
        isHeavy ? "opacity-100 bg-black" : "opacity-20"
      )}
    >
      {/* 1. Viñeta */}
      <div className="tv-vignette" />
      
      {/* 2. Scanlines */}
      <div className="tv-scanlines opacity-50" />
      
      {/* 3. Ruido/Estática */}
      <div className="absolute inset-0 overflow-hidden">
         {/* Si es Heavy, aumentamos la opacidad del ruido css */}
         <div className={cn("tv-noise", isHeavy ? "opacity-30" : "opacity-10")} />
      </div>
      
      {/* Texto opcional "CARGANDO SEÑAL..." si está en modo Heavy */}
      {isHeavy && (
        <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/50 font-mono text-xs animate-pulse tracking-widest">SINTONIZANDO...</p>
        </div>
      )}
    </div>
  );


  // --- RENDERIZADO ---
  if (!content) return <div className="w-full h-full bg-black" />;

  // A. ES UN VIDEO (YouTube / Mp4)
  if ('url' in content && typeof (content as any).url === 'string' && !('url_slide' in content)) {
    const video = content as Video;
    
    // CALCULAMOS CUÁNDO MOSTRAR ESTÁTICA FUERTE:
    // 1. Si no ha cargado el inicio (!isLoaded)
    // 2. Si está buferizando (isBuffering)
    // 3. Si está saliendo (isFadingOut) - Opcional, para transición suave
    const showStatic = !isLoaded || isBuffering;

    return (
      <div className="w-full h-full bg-black overflow-hidden relative">
        <div 
          className={cn(
            "w-full h-full transition-opacity duration-500 ease-in-out relative",
            (isLoaded && !isFadingOut) ? "opacity-100" : "opacity-0"
          )}
        >
            {/* CAPA DE FILTROS INTELIGENTE */}
            {ENABLE_FILTERS && <RetroFilters isHeavy={showStatic} />}

            <ReactPlayer
              ref={playerRef}
              url={video.url}
              width="100%"
              height="100%"
              playing={isActive && isPlaying}
              muted={muted} 
              volume={1}
              
              // EVENTOS DE BUFFERING (CLAVE PARA TU PEDIDO)
              onReady={() => setIsLoaded(true)} 
              onBuffer={() => setIsBuffering(true)}      // Empieza a cargar -> Muestra estática
              onBufferEnd={() => setIsBuffering(false)}  // Termina de cargar -> Muestra video
              
              onDuration={handleDuration}       
              onProgress={handleProgress}       
              onEnded={onEnded}                 
              playsinline={true} 
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 1,
                    controls: 0,        
                    modestbranding: 1,  
                    rel: 0,             
                    showinfo: 0,
                    iv_load_policy: 3,  
                    fs: 0,              
                    disablekb: 1,       
                  }
                }
              }}
            />
        </div>
      </div>
    );
  }

  // B. ES UN ARTÍCULO (SLIDE .HTML)
  const article = content as Article;
  const slideUrl = article.url_slide 
    ? `${article.url_slide}?t=${new Date().getTime()}` 
    : null;

  if (!slideUrl) {
     return <div className="w-full h-full bg-black flex items-center justify-center text-white">Sin slide disponible</div>;
  }

  // Para los slides, mostramos estática mientras carga el iframe (isLoaded es false)
  const showSlideStatic = !isLoaded;

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
        <div 
          className={cn(
            "w-full h-full transition-opacity duration-700 ease-in-out relative", 
            // En slides no usamos opacity 0 para ocultar, usamos la estática encima
            "opacity-100" 
          )}
        >
          {/* CAPA DE FILTROS EN SLIDES */}
          {ENABLE_FILTERS && <RetroFilters isHeavy={showSlideStatic} />}

          <iframe
              key={article.id} 
              src={slideUrl}
              className="w-full h-full border-0 pointer-events-none"
              scrolling="no"
              title={article.titulo}
              loading="eager"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setIsLoaded(true)}
          />
        </div>
    </div>
  );
}