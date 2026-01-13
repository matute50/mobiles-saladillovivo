'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import VideoSection from './VideoSection';
import { PageData, Video } from '@/lib/types'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import { Controller } from 'swiper/modules';
import { Play, ChevronLeft, ChevronRight, X, Sun, Moon, Share2, Search, HelpCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';

// ... (MANTENER AQUÍ TUS CONSTANTES: STOP_WORDS, MOCK_DATA, CATEGORY_MAP) ...
// ... (MANTENER AQUÍ TUS FUNCIONES AUXILIARES: getDisplayCategory, getYouTubeThumbnail, hooks) ...

// ... (MANTENER COMPONENTES: MobileNewsCard, VideoCarouselBlock) ...

// NOTA AL DESARROLLADOR: Copia y pega las constantes y componentes auxiliares que ya tenías
// en este archivo. Solo estoy modificando la lógica principal del componente MobileLayout
// para incluir el Wake Lock.

export default function MobileLayout({ data, isMobile }: { data: PageData; isMobile: boolean }) {
  const safeData = data; // Asumiendo data segura o mock
  const { articles, videos, ads } = safeData as PageData;
  // ... (Hooks de tema y orientación que ya tenías) ...
  const { playManual, setVideoPool } = useMediaPlayer(); 
  
  // ... (Estados de Swiper, Modal, Search, DeferredPrompt que ya tenías) ...

  // === NUEVO: SCREEN WAKE LOCK API (Evitar apagado de pantalla) ===
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('💡 Pantalla bloqueada (Wake Lock activo)');
        } catch (err) {
          console.warn('⚠️ Error al solicitar Wake Lock:', err);
        }
      }
    };

    requestWakeLock(); // Solicitar al inicio

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock(); // Re-solicitar si volvemos a la app
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) wakeLock.release();
    };
  }, []);

  // Cargar videos al pool
  useEffect(() => {
    if (videos?.allVideos?.length > 0) {
       setVideoPool(videos.allVideos);
    }
  }, [videos, setVideoPool]);

  // ... (Resto de tu lógica de renderizado: Search, Share, Modal, etc.) ...

  // MANTENER TU RENDERIZADO VISUAL EXACTO, ASEGURANDO QUE VideoSection SE LLAME ASÍ:
  // <VideoSection isMobile={true} />

  // (Simulación de retorno para contexto)
  return (
      // ... Tu JSX original ...
      <div className="fixed inset-0 z-[100] flex flex-col w-full h-[100dvh] overflow-hidden transition-colors duration-300 bg-neutral-50 text-neutral-900">
         {/* ... Header ... */}
         
         <div className="shrink-0 sticky top-11 z-30 w-full shadow-xl border-b transition-colors bg-white border-neutral-200">
            {/* AQUÍ ESTÁ LA CLAVE */}
            <VideoSection isMobile={true} />
         </div>

         {/* ... Resto del body (Noticias, Carrusel, Ads) ... */}
      </div>
  );
}