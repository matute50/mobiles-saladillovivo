'use client';

// Solo importamos useState
import { useState } from 'react';

const useFader = (initialVolume: number) => {
  const [volume, setVolume] = useState(initialVolume);
  
  // 'ramp' y 'cancelRamp' han sido eliminados.
  // Retornamos 'setVolume' directamente de 'useState',
  // que es una función estable y no causará re-renders.
  return { volume, setVolume };
};

export default useFader;