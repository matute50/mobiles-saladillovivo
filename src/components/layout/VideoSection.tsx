'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import VideoPlayer from '@/components/player/VideoPlayer';
import { ShareButton } from '@/components/ui/ShareButton';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, X, Cloud, Sun as SunIcon, CloudRain, CloudLightning, MapPin } from 'lucide-react';
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

export default function VideoSection({ isMobile, isDark = true }: { isMobile?: boolean, isDark?: boolean }) {
  const { state, handleIntroEnded, handleContentEnded, prepareNext, triggerTransition } = useMediaPlayer();
  const { currentContent, nextContent, currentIntroUrl, isIntroVisible, shouldPlayContent } = state;
  const { isMuted, toggleMute, unmute, hasInteracted } = useVolume();
  const { weather, isExtendedOpen, setIsExtendedOpen } = useWeather();

  // Auto-cierre del clima extendido tras 3 segundos
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

  // Estados para la línea de tiempo
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTimeReached, setMaxTimeReached] = useState(0);
  const [isIntroFadingOut, setIsIntroFadingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sistema de Doble Player (A/B) con Smart Slot Management
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

    const isNewsTransition = currentIntroUrl?.includes('/videos_intro/noticias.mp4') ?? false;

    if (isIntroVisible && currentIntroUrl) {
      // OPTIMIZACIÓN: Carga instantánea sobre nodo existente
      setIsIntroFadingOut(false);

      // Solo asignamos src si cambia para no interrumpir si ya estaba listo (opcional, pero seguro reiniciar en intro)
      v.src = currentIntroUrl;
      v.muted = !isNewsTransition; // Habilitar audio si es transición de noticias
      v.load(); // Forzar buffer refresh

      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Silencioso si falla sin interacción, es normal en navegadores
          // Fallback para transiciones con audio en navegadores estrictos (iOS Safari)
          if (!v.muted && error.name === 'NotAllowedError') {
            v.muted = true;
            v.play().catch(() => handleIntroEnded());
          } else {
            handleIntroEnded();
          }
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

    // Fade out 0.3s antes de los 4s (es decir, a los 3.7s del tiempo efectivo)
    if (!isIntroFadingOut && effectiveTime >= 3.7) {
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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Player A es slotAContent
  const contentA = slotAContent;
  const contentB = slotBContent;
  const activeContent = activeSlot === 'A' ? contentA : contentB;


  return (
    <div ref={containerRef} className="w-full h-full bg-black relative overflow-hidden select-none" onClick={handleInteraction}>
      <style jsx global>{`

        /* vShimmer Effect: Flash & Wait + Pulse */
        @keyframes shimmer-interval {
            0% { background-position: 0% 50%; transform: scale(1); }
            7.5% { transform: scale(1.05); } /* Peak Pulse */
            15% { background-position: 200% 50%; transform: scale(1); } /* End Flash */
            100% { background-position: 200% 50%; transform: scale(1); } /* Pause */
        }
        .animate-shimmer-news {
            animation: shimmer-interval 10s linear infinite;
        }
        .animate-shimmer-cat {
            animation: shimmer-interval 12s linear infinite;
        }
      `}</style>

      {/* PLAYER A */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-300 contain-layout will-change-[transform,opacity]",
        // OPTIMIZACIÓN: Permitir visibilidad lógica (aunque tapada por intro) para que el navegador no pause
        (activeSlot === 'A') ? "z-10 opacity-100" : "z-0 opacity-100"
      )} style={{ transform: 'translateZ(0)' }}>
        {contentA && (
          <VideoPlayer
            content={contentA}
            // MOD: En Daily Show, NO jugar mientras la intro está visible para evitar desincronización
            shouldPlay={activeSlot === 'A' ? (shouldPlayContent && (isUserPlaying || (isIntroVisible && !state.dailyShowSequence))) : false}
            // Nota: El 'Background Player' (B si A es activo) debe estar PAUSADO hasta que sea activo? 
            // NO! Si es Next, debe estar PRELOADED. Pero VideoPlayer no tiene modo 'Preload'.
            // Sin embargo, si triggerTransition ocurre, Active pasa a ser este slot.
            // Entonces, si activeSlot === 'A', shouldPlay es TRUE (incluso si isIntroVisible es true).
            // Si es Next (Inactivo), shouldPlay es FALSE (solo bufferea).

            onEnded={activeSlot === 'A' ? handleContentEnded : () => { }}
            onNearEnd={activeSlot === 'A' ? () => {
              const isNews = 'url_slide' in contentA;
              triggerTransition(isNews ? 300 : 0);
            } : undefined}
            onStart={activeSlot === 'A' ? handleStart : undefined}
            onProgress={activeSlot === 'A' ? onPlayerProgress : undefined}
            muted={activeSlot === 'A' ? (isMuted || (isIntroVisible && (currentIntroUrl?.includes('/videos_intro/noticias.mp4') ?? false))) : true}
          />
        )}
      </div>

      {/* PLAYER B */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-300 contain-layout will-change-[transform,opacity]",
        (activeSlot === 'B') ? "z-10 opacity-100" : "z-0 opacity-100"
      )} style={{ transform: 'translateZ(0)' }}>
        {contentB && (
          <VideoPlayer
            content={contentB}
            // MOD: En Daily Show, NO jugar mientras la intro está visible para evitar desincronización
            shouldPlay={activeSlot === 'B' ? (shouldPlayContent && (isUserPlaying || (isIntroVisible && !state.dailyShowSequence))) : false}
            onEnded={activeSlot === 'B' ? handleContentEnded : () => { }}
            onNearEnd={activeSlot === 'B' ? () => {
              const isNews = 'url_slide' in contentB;
              triggerTransition(isNews ? 300 : 0);
            } : undefined}
            onStart={activeSlot === 'B' ? handleStart : undefined}
            onProgress={activeSlot === 'B' ? onPlayerProgress : undefined}
            muted={activeSlot === 'B' ? (isMuted || (isIntroVisible && (currentIntroUrl?.includes('/videos_intro/noticias.mp4') ?? false))) : true}
          />
        )}
      </div>



      {/* INTRO VIDEO LAYER (CAPA 2) - Elevada a z-[999] para supremacía TOTAL */}
      <div className={cn(
        "absolute inset-0 z-[999] bg-black transition-opacity duration-300 will-change-[transform,opacity]",
        (isIntroVisible && !isIntroFadingOut) ? "opacity-100" : "opacity-0 pointer-events-none"
      )} style={{ transform: 'translateZ(0)' }}>
        {/* OPTIMIZACIÓN: Eliminamos 'key' para evitar re-mount. El nodo persiste. */}
        <video
          ref={introVideoRef}
          className="w-full h-full object-cover"
          playsInline
          muted={!(currentIntroUrl?.includes('/videos_intro/noticias.mp4') ?? false)}
          // No autoPlay here, we control it in useEffect
          onEnded={handleIntroEnded}
          onLoadedMetadata={handleIntroMetadata}
          onTimeUpdate={handleIntroTimeUpdate}
        />
      </div>

      {/* BOTÓN UNMUTE INICIAL / ESTADO MUTED */}
      {/* Lógica: Si está muteado, este botón es lo ÚNICO que se ve. Bloquea el resto. */}
      {isMuted && (
        <div className={cn(
          "absolute inset-0 z-[60] flex items-center justify-center transition-all duration-300",
          (showControls || !hasInteracted || isMuted) ? "opacity-100" : "opacity-0" // Siempre visible si está muteado y user interactúa o es inicio
        )}>
          {/* El botón en sí tiene stopPropagation para que el click no active los controles generales */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            className="w-28 h-28 bg-red-600/90 text-white rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(220,38,38,0.7)] active:scale-90 transition-all duration-300 animate-pulse border-4 border-white/40 backdrop-blur-sm"
          >
            <VolumeX size={56} strokeWidth={2.5} />
          </button>
        </div>
      )}




      {/* CONTROLES (Solo Video - Pausa, Mute, Share, Timeline) */}
      {/* Se ocultan TOTALMENTE si está Muted */}
      {!isMuted && (
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

            {/* PLAY / PAUSE */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsUserPlaying(!isUserPlaying); }}
              className={cn(
                "group flex items-center justify-center rounded-full border p-6 active:scale-90 transition-all duration-200",
                !isUserPlaying
                  ? "bg-red-600 border-white border-2 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]" // Pausa: Rojo Intermitente (animate-pulse)
                  : "bg-white/10 border-white/30 backdrop-blur-md"
              )}
            >
              {isUserPlaying ? <Pause size={36} stroke="white" strokeWidth={2.5} className="text-white" /> : <Play size={36} stroke="white" strokeWidth={2.5} className="text-white ml-1" />}
            </button>

            {/* MUTE TOGGLE (En barra de controles) */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className={cn(
                "group flex items-center justify-center rounded-full p-6 active:scale-90 transition-all duration-200 border",
                isMuted
                  ? "bg-red-600 border-white border-2" // Muted: Rojo Fijo (sin pulse, aunque acá sería raro ver este botón si ocultamos todo al estar muted, pero lo dejamos por consistencia de estado transition)
                  : "bg-white/10 border-white/30 backdrop-blur-md"
              )}
            >
              {isMuted ? <VolumeX size={36} stroke="white" strokeWidth={2.5} /> : <Volume2 size={36} stroke="white" strokeWidth={2.5} />}
            </button>

            {/* SHARE BUTTON (Integrado en controles para todo tipo de contenido) */}
            {activeContent && (
              <ShareButton
                content={activeContent}
                variant="player-control"
              // ShareButton interno ya maneja el check verde (ShareButton.tsx:79 -> text-green-400)
              />
            )}

          </div>
        </div>
      )}

      {/* ZÓCALO DE CLIMA EXTENDIDO - Superior y Ultra-Fino */}
      <div className={cn(
        "absolute inset-0 z-[120] bg-black/80 backdrop-blur-2xl transition-all duration-500 ease-out flex flex-col items-center justify-center pt-10 pb-16 px-6",
        isExtendedOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        <button
          onClick={() => setIsExtendedOpen(false)}
          className="absolute top-4 right-4 text-white/40 active:text-white bg-white/5 p-2 rounded-full transition-all border border-white/10 hover:bg-white/10"
        >
          <X size={24} />
        </button>

        {weather && (
          <div className="w-full max-w-lg animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-8">
              <span className="text-white/40 text-[10px] uppercase font-black tracking-[0.3em] block mb-2">Pronóstico Extendido</span>
              <h2 className="text-3xl font-black italic text-white flex items-center justify-center gap-3">
                <MapPin size={24} className="text-[#6699ff]" />
                {weather.location?.name || 'Saladillo'}
              </h2>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {weather.days.slice(1, 6).map((day: any) => (
                <div key={day.datetime} className="flex flex-col items-center gap-3 group">
                  <span className="text-[11px] font-black uppercase italic text-white/50 group-hover:text-[#6699ff] transition-colors">
                    {new Date(day.datetime + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                  </span>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 shadow-xl transition-transform active:scale-95">
                    {getWeatherIcon(day.icon, isDark, 42)}
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[18px] font-black italic text-white">{Math.round(day.tempmax)}°</span>
                    <div className="h-0.5 w-4 bg-white/10 rounded-full" />
                    <span className="text-[12px] font-bold text-white/30">{Math.round(day.tempmin)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
