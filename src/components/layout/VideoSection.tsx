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
      const timer = setTimeout(() => setIsExtendedOpen(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isExtendedOpen, setIsExtendedOpen]);

  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [isUserPlaying, setIsUserPlaying] = useState(true);
  const [isContentStarted, setIsContentStarted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Sistema de Doble Player (A/B) para Precarga Real
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');

  // Estados para la línea de tiempo
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTimeReached, setMaxTimeReached] = useState(0);
  const [isIntroFadingOut, setIsIntroFadingOut] = useState(false);

  // Sincronizar el intercambio de players al cambiar currentContent
  useEffect(() => {
    if (currentContent) {
      setActivePlayer(prev => prev === 'A' ? 'B' : 'A');
      setIsContentStarted(false);
      setIsUserPlaying(true);
      setProgress(0);
      setCurrentTime(0);
      setMaxTimeReached(0);
    }
  }, [currentContent]);

  useEffect(() => {
    const v = introVideoRef.current;
    if (isIntroVisible && currentIntroUrl && v) {
      // Regla de Oro: Resetear fade INMEDIATAMENTE al hacer visible la intro
      setIsIntroFadingOut(false);
      v.src = currentIntroUrl;
      v.load(); // Asegurar carga limpia
      v.play().catch(() => handleIntroEnded());
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
    handleShareContent(currentContent);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Player A es el "otro" si activePlayer es 'B'
  const contentA = activePlayer === 'A' ? currentContent : nextContent;
  const contentB = activePlayer === 'B' ? currentContent : nextContent;

  return (
    <div className="w-full h-full bg-black relative overflow-hidden select-none" onClick={handleInteraction}>
      <style jsx global>{`.analog-noise { background: repeating-radial-gradient(#000 0 0.0001%, #fff 0 0.0002%) 50% 0/2500px 2500px; opacity: 0.12; animation: shift .2s infinite alternate; } @keyframes shift { 100% { background-position: 50% 0, 51% 50%; } }`}</style>

      {/* PLAYER A */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        (activePlayer === 'A' && !isIntroVisible) ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
      )}>
        {contentA && (
          <VideoPlayer
            content={contentA}
            shouldPlay={activePlayer === 'A' ? (shouldPlayContent && isUserPlaying) : (shouldPlayContent && isIntroVisible)}
            onEnded={activePlayer === 'A' ? handleContentEnded : () => { }}
            onNearEnd={activePlayer === 'A' ? triggerTransition : undefined}
            onStart={activePlayer === 'A' ? handleStart : undefined}
            onProgress={activePlayer === 'A' ? onPlayerProgress : undefined}
            muted={activePlayer === 'A' ? (isMuted || isIntroVisible) : true}
          />
        )}
      </div>

      {/* PLAYER B */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        (activePlayer === 'B' && !isIntroVisible) ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
      )}>
        {contentB && (
          <VideoPlayer
            content={contentB}
            shouldPlay={activePlayer === 'B' ? (shouldPlayContent && isUserPlaying) : (shouldPlayContent && isIntroVisible)}
            onEnded={activePlayer === 'B' ? handleContentEnded : () => { }}
            onNearEnd={activePlayer === 'B' ? triggerTransition : undefined}
            onStart={activePlayer === 'B' ? handleStart : undefined}
            onProgress={activePlayer === 'B' ? onPlayerProgress : undefined}
            muted={activePlayer === 'B' ? (isMuted || isIntroVisible) : true}
          />
        )}
      </div>

      {/* BOTÓN COMPARTIR (ELIMINADO DE AQUÍ PARA MOVERLO A CONTROLES) */}

      {(!isContentStarted || !isUserPlaying) && <div className="absolute inset-0 z-[15] pointer-events-none analog-noise" />}

      {/* INTRO VIDEO LAYER (CAPA 2) - Elevada a z-[100] para visibilidad garantizada */}
      <div className={cn(
        "absolute inset-0 z-[100] bg-black transition-opacity duration-500",
        (isIntroVisible && !isIntroFadingOut) ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <video
          key={state.introId}
          ref={introVideoRef}
          className="w-full h-full object-cover"
          src={currentIntroUrl || undefined}
          autoPlay
          muted
          playsInline
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
