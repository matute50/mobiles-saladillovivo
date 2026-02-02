'use client';

import React from 'react';
import { MediaPlayerProvider } from '@/context/MediaPlayerContext';
import { VolumeProvider } from '@/context/VolumeContext';
import { WeatherProvider } from '@/context/WeatherContext';
import { PWAProvider } from '@/context/PWAContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VolumeProvider>
      <WeatherProvider>
        <PWAProvider>
          <MediaPlayerProvider>
            {children}
          </MediaPlayerProvider>
        </PWAProvider>
      </WeatherProvider>
    </VolumeProvider>
  );
}