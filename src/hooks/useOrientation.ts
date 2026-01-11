// src/hooks/useOrientation.ts
import { useState, useEffect } from 'react';

type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      if (window.matchMedia("(orientation: landscape)").matches) {
        setOrientation('landscape');
      } else {
        setOrientation('portrait');
      }
    };

    // Set initial orientation
    updateOrientation();

    // Listen for changes
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation); // For desktop browser resize testing

    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return orientation;
}
