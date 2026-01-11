'use client';

import React from 'react';
import { MediaPlayerProvider } from '@/context/MediaPlayerContext';
import { VolumeProvider } from '@/context/VolumeContext';
// Si tienes un NewsContext, probablemente también lo necesitemos aquí, 
// pero vamos a arreglar el error actual primero.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VolumeProvider>
      <MediaPlayerProvider>
        {children}
      </MediaPlayerProvider>
    </VolumeProvider>
  );
}