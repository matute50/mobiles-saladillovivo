'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import VideoSection from './VideoSection';
import { PageData } from '@/lib/types'; 
import { cn } from '@/lib/utils';

function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isLandscape;
}

export default function MobileLayout({ data }: { data: PageData }) {
  const isLandscape = useOrientation();
  const { setVideoPool } = useMediaPlayer();

  useEffect(() => {
    if (data?.videos?.allVideos) setVideoPool(data.videos.allVideos);
  }, [data, setVideoPool]);

  return (
    <div className="fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden bg-black">
      {/* EL VIDEO SE TRANSFORMA SEGÚN ORIENTACIÓN */}
      <div className={cn(
        "transition-all duration-500",
        isLandscape 
          ? "fixed inset-0 z-[500] w-[100vw] h-[100dvh]" 
          : "relative z-40 w-full aspect-video"
      )}>
        <VideoSection isMobile={true} />
      </div>

      {/* RESTO DE LA APP (Oculto en Horizontal) */}
      {!isLandscape && (
        <div className="flex-1 overflow-y-auto bg-neutral-900 p-4">
          <h2 className="text-white font-bold text-xl mb-4 uppercase">Últimas Noticias</h2>
          {/* Aquí irían tus noticias y carruseles originales */}
        </div>
      )}
    </div>
  );
}