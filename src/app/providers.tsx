'use client';

import React from 'react';
import { MediaPlayerProvider } from '@/context/MediaPlayerContext';
import { VolumeProvider } from '@/context/VolumeContext';
import { WeatherProvider } from '@/context/WeatherContext';
import { PWAProvider } from '@/context/PWAContext';
import { NewsProvider } from '@/context/NewsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VolumeProvider>
      <WeatherProvider>
        <PWAProvider>
          <NewsProvider>
            <MediaPlayerProvider>
              {children}
            </MediaPlayerProvider>
          </NewsProvider>
        </PWAProvider>
      </WeatherProvider>
    </VolumeProvider>
  );
}