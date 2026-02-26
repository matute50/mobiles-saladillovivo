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
  const [isOverlapping, setIsOverlapping] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const preloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sistema Anti-Branding (Cinematic Shields)
  const [areCinematicBarsActive, setAreCinematicBarsActive] = useState(false);
  const cinematicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isContentPlaying } = state;

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
      setDuration(0);

      // Trigger Shield on change
      setAreCinematicBarsActive(true);
      if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
      cinematicTimerRef.current = setTimeout(() => {
        setAreCinematicBarsActive(false);
      }, 5000);
    }
  }, [currentContent?.id]); // Solo si cambia el ID

  useEffect(() => {
    const v = introVideoRef.current;
    if (!v) return;

    const isNewsTransition = currentIntroUrl?.includes('/videos_intro/noticias.mp4') ?? false;

    if (isIntroVisible && currentIntroUrl) {
      // OPTIMIZACIÓN: Carga instantánea sobre nodo existente
      setIsIntroFadingOut(false);
      setIsOverlapping(false);
      setIsPreloading(false); // Reset antes de nuevo timer

      if (preloadTimerRef.current) clearTimeout(preloadTimerRef.current);
      preloadTimerRef.current = setTimeout(() => {
        setIsPreloading(true);
      }, 2000); // v25.7: Retrasado a 2s para asegurar opacidad total del intro

      v.volume = 1; // Resetear volumen al 100% antes de cada intro

      v.src = currentIntroUrl;
      // Habilitar audio solo en la transición de noticias
      v.muted = !isNewsTransition;
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
    setIsPreloading(false);
    prepareNext();
  };

  const INTRO_DURATION_S = 8; // Duración efectiva del intro principal
  const NEWS_DURATION_S = 4; // Duración para transición de noticias

  const handleIntroMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration > 0) {
      const isNewsTransition = currentIntroUrl?.includes('noticias.mp4');
      const targetDuration = isNewsTransition ? NEWS_DURATION_S : INTRO_DURATION_S;

      // Ajustar velocidad para que el video dure EXACTAMENTE la duración objetivo.
      video.playbackRate = video.duration / targetDuration;
      video.volume = isNewsTransition ? 0 : 1; // Noticias inicia en 0 para fade in
    }
  };

  const handleIntroTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const isNewsTransition = currentIntroUrl?.includes('noticias.mp4');
    const targetDuration = isNewsTransition ? NEWS_DURATION_S : INTRO_DURATION_S;

    // La duración efectiva para el usuario siempre es targetDuration.
    const effectiveTime = video.currentTime / video.playbackRate;

    // Fade in en el primer segundo (solo noticias.mp4)
    if (isNewsTransition) {
      if (effectiveTime <= 1) {
        video.volume = Math.max(0, Math.min(1, effectiveTime));
      } else if (effectiveTime < targetDuration - 1) {
        video.volume = 1;
      }
    }

    // Solapamiento "Regla de Oro": 3 segundos antes del final permitimos que el contenido inferior inicie
    const OVERLAP_START = targetDuration - 3;
    if (effectiveTime >= OVERLAP_START) {
      if (!isOverlapping) setIsOverlapping(true);
    }

    // Fade out en los últimos 0.75 segundos (Rule of Gold)
    const FADE_START = targetDuration - 0.75;
    if (effectiveTime >= FADE_START) {
      // Progreso del fade: 0 al inicio del fade, 1 al final
      const fadeProgress = Math.min((effectiveTime - FADE_START) / 0.75, 1);
      // Fade de audio: volumen cae de 1 a 0
      video.volume = Math.max(0, 1 - fadeProgress);
      // Activar fade visual (CSS opacity)
      if (!isIntroFadingOut) {
        setIsIntroFadingOut(true);
      }
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
        // OPTIMIZACIÓN: Ocultar visualmente la instancia inactiva para evitar GPU rendering excesivo
        (activeSlot === 'A') ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
      )} style={{ transform: 'translateZ(0)' }}>
        {contentA && (
          <VideoPlayer
            content={contentA}
            shouldPlay={activeSlot === 'A' ? (shouldPlayContent && isUserPlaying && (isContentPlaying || isOverlapping || isPreloading)) : false}
            onEnded={activeSlot === 'A' ? handleContentEnded : () => { }}
            onNearEnd={activeSlot === 'A' ? () => {
              const isNews = contentA && (!('url' in contentA) || (contentA as any).url_slide);
              triggerTransition(isNews ? 100 : 300);
            } : undefined}
            onStart={activeSlot === 'A' ? handleStart : undefined}
            onProgress={activeSlot === 'A' ? onPlayerProgress : undefined}
            // El mute sigue la misma logica: muteamos si el intro actual es noticias.mp4 (para que suene su foley)
            // EXCEPCIÓN: Si estamos en modo overlap (3s finales), desmuteamos YouTube para fade-in
            // v25.5: Forzar mute si esIntroVisible y NO estamos en overlap (evita audio de YouTube durante precarga)
            muted={activeSlot === 'A' ? (isMuted || (!isOverlapping && isIntroVisible)) : true}
          />
        )}
      </div>

      {/* PLAYER B */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-300 contain-layout will-change-[transform,opacity]",
        (activeSlot === 'B') ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
      )} style={{ transform: 'translateZ(0)' }}>
        {contentB && (
          <VideoPlayer
            content={contentB}
            shouldPlay={activeSlot === 'B' ? (shouldPlayContent && isUserPlaying && (isContentPlaying || isOverlapping || isPreloading)) : false}
            onEnded={activeSlot === 'B' ? handleContentEnded : () => { }}
            onNearEnd={activeSlot === 'B' ? () => {
              const isNews = contentB && (!('url' in contentB) || (contentB as any).url_slide);
              triggerTransition(isNews ? 100 : 300);
            } : undefined}
            onStart={activeSlot === 'B' ? handleStart : undefined}
            onProgress={activeSlot === 'B' ? onPlayerProgress : undefined}
            // v25.5: Sincronización de mute para Slot B
            muted={activeSlot === 'B' ? (isMuted || (!isOverlapping && isIntroVisible)) : true}
          />
        )}
      </div>



      {/* INTRO VIDEO LAYER (CAPA 2) - Elevada a z-[999] para supremacía TOTAL */}
      <div className={cn(
        "absolute inset-0 z-[999] bg-black transition-opacity will-change-[transform,opacity]",
        "duration-[750ms]", // Duración del fade out (0.75s)
        (isIntroVisible && !isIntroFadingOut) ? "opacity-100" : "opacity-0 pointer-events-none"
      )} style={{ transform: 'translateZ(0)' }}>
        {/* OPTIMIZACIÓN: Eliminamos 'key' para evitar re-mount. El nodo persiste. */}
        <video
          ref={introVideoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay
          muted={!hasInteracted || (!(currentIntroUrl?.includes('/videos_intro/noticias.mp4') ?? false) && !(currentIntroUrl?.includes('/videos_intro/') && !currentIntroUrl.includes('noticias.mp4')))}
          onEnded={handleIntroEnded}
          onLoadedMetadata={handleIntroMetadata}
          onTimeUpdate={handleIntroTimeUpdate}
        />
      </div>

      {/* CINEMATIC BARS (Mobile) - Protección Anti-Branding */}
      {areCinematicBarsActive && !currentIntroUrl?.includes('noticias.mp4') && (
        <>
          <div className="absolute top-0 left-0 right-0 h-[12%] bg-black z-[990] pointer-events-auto transition-opacity duration-300" />
          <div className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-black via-black/80 to-transparent z-[989] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black via-black/80 to-transparent z-[989] pointer-events-none" />
        </>
      )}

      {/* BOTÓN UNMUTE INICIAL / ESTADO MUTED */}
      {/* Lógica: Si está muteado, este botón es lo ÚNICO que se ve. Bloquea el resto. */}
      {isMuted && (
        <div className={cn(
          "absolute inset-0 z-[1000] flex items-center justify-center transition-all duration-300",
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
