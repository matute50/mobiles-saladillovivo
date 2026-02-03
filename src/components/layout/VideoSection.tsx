'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import VideoPlayer from '@/components/player/VideoPlayer';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, Share2, X, Cloud, Sun as SunIcon, CloudRain, CloudLightning, MapPin } from 'lucide-react';
import { useWeather } from '@/context/WeatherContext';

const getWeatherIcon = (iconName: string, isDark: boolean, size = 24, className = "") => {
  const name = iconName?.toLowerCase() || '';
  const sunColor = isDark ? "text-yellow-400" : "text-orange-500";
  if (name.includes('thunder')) return <CloudLightning size={size} className={cn("text-purple-500", className)} />;
  if (name.includes('rain')) return <CloudRain size={size} className={cn("text-blue-500", className)} />;
  if (name.includes('cloudy')) return <Cloud size={size} className={cn("text-blue-400", className)} />;
  if (name.includes('clear')) return <SunIcon size={size} className={cn(sunColor, className)} />;
  return <SunIcon size={size} className={cn(sunColor, className)} />;
};
import { handleShareContent } from '@/lib/share';

export default function VideoSection({ isMobile, isDark = true }: { isMobile?: boolean, isDark?: boolean }) {
  const { state, handleIntroEnded, handleContentEnded, prepareNext, triggerTransition } = useMediaPlayer();
  const { currentContent, nextContent, currentIntroUrl, isIntroVisible, shouldPlayContent } = state;
  const { isMuted, toggleMute, unmute, hasInteracted } = useVolume();
  const { weather, isExtendedOpen, setIsExtendedOpen } = useWeather();

  // Auto-cierre del clima extendido tras 3 segundos (v5.3)
  useEffect(() => {
    if (isExtendedOpen) {
      const timer = setTimeout(() => setIsExtendedOpen(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isExtendedOpen, setIsExtendedOpen]);

  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [isUserPlaying, setIsUserPlaying] = useState(true);
  const [isContentStarted, setIsContentStarted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Estados para la línea de tiempo (Restaurados v18.0)
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTimeReached, setMaxTimeReached] = useState(0);
  const [isIntroFadingOut, setIsIntroFadingOut] = useState(false);
  const [isSharingAction, setIsSharingAction] = useState(false);

  // Sistema de Doble Player (A/B) con Smart Slot Management (v18.0 - Persistent Slots)
  const [slotAContent, setSlotAContent] = useState<any>(null);
  const [slotBContent, setSlotBContent] = useState<any>(null);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');

  // Sincronización Inteligente: Detectar cambios y asignar slots sin destruir instancias
  useEffect(() => {
    // 1. Manejo del CURRENT Content
    if (currentContent) {
      if (slotAContent?.id === currentContent.id) {
        // Ya está en A -> Activar A
        if (activeSlot !== 'A') setActiveSlot('A');
      } else if (slotBContent?.id === currentContent.id) {
        // Ya está en B (Precargado!) -> Activar B
        if (activeSlot !== 'B') setActiveSlot('B');
      } else {
        // No está en ninguno (Cold Start o cambio brusco)
        // Cargar en el slot que correspondía al activo o forzar A
        if (activeSlot === 'A') setSlotAContent(currentContent);
        else setSlotBContent(currentContent);
      }
    }

    // 2. Manejo del NEXT Content (Precarga)
    if (nextContent) {
      // Identificar el slot INACTIVO (Target para precarga)
      // Nota: Si acabamos de cambiar activeSlot arriba, necesitamos saber cuál será el activo final.
      // Usamos lógica predictiva básica: si current está en A, next va a B.

      const targetIsB = (currentContent?.id === slotAContent?.id) || (activeSlot === 'A' && !slotBContent);

      if (targetIsB) {
        if (slotBContent?.id !== nextContent.id) setSlotBContent(nextContent);
      } else {
        if (slotAContent?.id !== nextContent.id) setSlotAContent(nextContent);
      }
    }
  }, [currentContent, nextContent, activeSlot, slotAContent, slotBContent]);

  // Efecto de Reset al cambiar de contenido real
  useEffect(() => {
    if (currentContent) {
      setIsContentStarted(false);
      setIsUserPlaying(true);
      setProgress(0);
      setCurrentTime(0);
      setMaxTimeReached(0);
    }
  }, [currentContent?.id]); // Solo si cambia el ID

  useEffect(() => {
    const v = introVideoRef.current;
    if (!v) return;

    if (isIntroVisible && currentIntroUrl) {
      // OPTIMIZACIÓN v16.0: Carga instantánea sobre nodo existente
      setIsIntroFadingOut(false);

      // Solo asignamos src si cambia para no interrumpir si ya estaba listo (opcional, pero seguro reiniciar en intro)
      v.src = currentIntroUrl;
      v.load(); // Forzar buffer refresh

      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.warn("Intro play failed, skipping");
          handleIntroEnded();
        });
      }
    } else {
      // Limpieza agresiva de recursos cuando no se usa
      v.pause();
      v.currentTime = 0;
      // No limpiamos src a "" inmediatamente para evitar flash si hay fade out tardío, 
      // pero el parent div tiene pointer-events-none y opacity-0.
    }
  }, [currentIntroUrl, isIntroVisible, handleIntroEnded]);

  const handleStart = () => {
    setIsContentStarted(true);
    prepareNext();
  };

  const handleIntroMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration > 0) {
      // Regla de Oro: La velocidad se ajusta para que el video dure EXACTAMENTE 4 segundos.
      video.playbackRate = video.duration / 4;
    }
  };

  const handleIntroTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    // La duración efectiva para el usuario siempre es 4s. 
    // Calculamos el progreso proporcional al tiempo real vs duración ajustada.
    const effectiveTime = video.currentTime / video.playbackRate;

    // Fade out 0.5s antes de los 4s (es decir, a los 3.5s del tiempo efectivo)
    if (!isIntroFadingOut && effectiveTime >= 3.5) {
      setIsIntroFadingOut(true);
    }
  };

  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 5000);
  };

  const onPlayerProgress = (data: { playedSeconds: number; duration: number }) => {
    setCurrentTime(data.playedSeconds);
    setDuration(data.duration);
    if (data.duration > 0) setProgress((data.playedSeconds / data.duration) * 100);
    if (data.playedSeconds > maxTimeReached) setMaxTimeReached(data.playedSeconds);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentContent) return;

    // v8.0: Dynamic Zoom + Safety Cover
    setIsSharingAction(true);
    handleShareContent(currentContent);

    // Revertir zoom después de 2 segundos (User Request)
    setTimeout(() => {
      setIsSharingAction(false);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Player A es slotAContent
  const contentA = slotAContent;
  const contentB = slotBContent;

  return (
    <div className="w-full h-full bg-black relative overflow-hidden select-none" onClick={handleInteraction}>
      <style jsx global>{`.analog-noise { background: repeating-radial-gradient(#000 0 0.0001%, #fff 0 0.0002%) 50% 0/2500px 2500px; opacity: 0.12; animation: shift .2s infinite alternate; } @keyframes shift { 100% { background-position: 50% 0, 51% 50%; } }`}</style>

      {/* PLAYER A */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        // OPTIMIZACIÓN v18.0: Permitir visibilidad lógica (aunque tapada por intro) para que el navegador no pause
        (activeSlot === 'A') ? "z-10 opacity-100" : "z-0 opacity-100"
      )}>
        {contentA && (
          <VideoPlayer
            content={contentA}
            shouldPlay={activeSlot === 'A' ? (shouldPlayContent && (isUserPlaying || isIntroVisible)) : false}
            // Nota: El 'Background Player' (B si A es activo) debe estar PAUSADO hasta que sea activo? 
            // NO! Si es Next, debe estar PRELOADED. Pero VideoPlayer no tiene modo 'Preload'.
            // Sin embargo, si triggerTransition ocurre, Active pasa a ser este slot.
            // Entonces, si activeSlot === 'A', shouldPlay es TRUE (incluso si isIntroVisible es true).
            // Si es Next (Inactivo), shouldPlay es FALSE (solo bufferea).

            onEnded={activeSlot === 'A' ? handleContentEnded : () => { }}
            onNearEnd={activeSlot === 'A' ? () => {
              const isNews = 'url_slide' in contentA;
              triggerTransition(isNews ? 1000 : 0);
            } : undefined}
            onStart={activeSlot === 'A' ? handleStart : undefined}
            onProgress={activeSlot === 'A' ? onPlayerProgress : undefined}
            muted={activeSlot === 'A' ? (isMuted || isIntroVisible) : true}
            isSharingAction={isSharingAction}
          />
        )}
      </div>

      {/* PLAYER B */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        (activeSlot === 'B') ? "z-10 opacity-100" : "z-0 opacity-100"
      )}>
        {contentB && (
          <VideoPlayer
            content={contentB}
            shouldPlay={activeSlot === 'B' ? (shouldPlayContent && (isUserPlaying || isIntroVisible)) : false}
            onEnded={activeSlot === 'B' ? handleContentEnded : () => { }}
            onNearEnd={activeSlot === 'B' ? () => {
              const isNews = 'url_slide' in contentB;
              triggerTransition(isNews ? 1000 : 0);
            } : undefined}
            onStart={activeSlot === 'B' ? handleStart : undefined}
            onProgress={activeSlot === 'B' ? onPlayerProgress : undefined}
            muted={activeSlot === 'B' ? (isMuted || isIntroVisible) : true}
            isSharingAction={isSharingAction}
          />
        )}
      </div>

      {/* BOTÓN COMPARTIR (ELIMINADO DE AQUÍ PARA MOVERLO A CONTROLES) */}

      {/* SAFETY COVER (v8.0) - Capa de seguridad durante el compartir */}
      <div className={cn(
        "absolute inset-0 z-[1001] bg-black/40 backdrop-blur-sm transition-opacity duration-300",
        isSharingAction ? "opacity-100" : "opacity-0 pointer-events-none"
      )} />

      {(!isContentStarted || !isUserPlaying) && <div className="absolute inset-0 z-[15] pointer-events-none analog-noise" />}

      {/* INTRO VIDEO LAYER (CAPA 2) - Elevada a z-[999] para supremacía TOTAL (v23.0) */}
      <div className={cn(
        "absolute inset-0 z-[999] bg-black transition-opacity duration-1000",
        (isIntroVisible && !isIntroFadingOut) ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* OPTIMIZACIÓN v16.0: Eliminamos 'key' para evitar re-mount. El nodo persiste. */}
        <video
          ref={introVideoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          // No autoPlay here, we control it in useEffect
          onEnded={handleIntroEnded}
          onLoadedMetadata={handleIntroMetadata}
          onTimeUpdate={handleIntroTimeUpdate}
        />
      </div>

      {/* BOTÓN UNMUTE INICIAL (Solo si no ha interactuado y está mutado) */}
      <div className={cn(
        "absolute inset-0 z-[60] flex items-center justify-center pointer-events-none transition-all duration-700 ease-in-out",
        (isMuted && !hasInteracted && !isIntroVisible) ? "opacity-100 scale-100" : "opacity-0 scale-125"
      )}>
        <button onClick={(e) => { e.stopPropagation(); unmute(); }} className="w-28 h-28 bg-red-600/90 text-white rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(220,38,38,0.7)] pointer-events-auto active:scale-90 transition-all duration-300 animate-pulse border-4 border-white/40 backdrop-blur-sm">
          <VolumeX size={56} strokeWidth={2.5} />
        </button>
      </div>

      {/* CONTROLES */}
      <div className={cn("absolute inset-x-0 bottom-0 z-50 p-6 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500", (showControls || !isUserPlaying) ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-[11px] font-bold text-white/70 tracking-tighter uppercase">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-y-0 left-0 bg-red-600 transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(220,38,38,0.8)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-center gap-8">
          <button onClick={(e) => { e.stopPropagation(); setIsUserPlaying(!isUserPlaying); }} className="group flex items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md p-6 active:scale-90 transition-all duration-200">
            {isUserPlaying ? <Pause size={36} fill="white" className="text-white" /> : <Play size={36} fill="white" className="text-white ml-1" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className={cn("group flex items-center justify-center rounded-full p-6 active:scale-90 transition-all duration-200 border", isMuted ? "bg-red-600 border-white border-2" : "bg-white/10 border-white/30 backdrop-blur-md")}>
            {isMuted ? <VolumeX size={36} fill="white" /> : <Volume2 size={36} fill="white" />}
          </button>
          <button onClick={handleShare} className="group flex items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md p-6 active:scale-90 transition-all duration-200 text-white">
            <Share2 size={36} />
          </button>
        </div>
      </div>

      {/* ZÓCALO DE CLIMA EXTENDIDO (v5.2) - Superior y Ultra-Fino */}
      <div className={cn(
        "absolute inset-x-0 top-0 z-[120] bg-black/50 backdrop-blur-xl border-b border-white/10 transition-all duration-500 ease-out px-4 py-2.5 rounded-b-[24px] transform shadow-[0_15px_40px_rgba(0,0,0,0.6)]",
        isExtendedOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <button
          onClick={() => setIsExtendedOpen(false)}
          className="absolute top-2 right-4 text-white/50 active:text-white transition-colors p-1"
        >
          <X size={18} />
        </button>

        {weather && (
          <div className="flex justify-around items-center h-full">
            {weather.days.slice(1, 5).map((day: any) => (
              <div key={day.datetime} className="flex flex-col items-center gap-1 min-w-[60px]">
                <span className="text-[9px] font-black uppercase italic text-white/60">
                  {new Date(day.datetime + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  {getWeatherIcon(day.icon, isDark, 18)}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[14px] font-black italic text-white">{Math.round(day.tempmax)}°</span>
                    <span className="text-[10px] font-bold text-white/50">{Math.round(day.tempmin)}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
