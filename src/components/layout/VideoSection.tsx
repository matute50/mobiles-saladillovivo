'use client';

import React from 'react';

export default function VideoSection({ isMobile }: { isMobile?: boolean }) {
  return (
    <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-white border-b border-gray-800">
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-yellow-500 mb-2">MODO SEGURO ACTIVO</h2>
        <p className="text-sm text-gray-300">
          Hemos deshabilitado el video temporalmente<br/>
          para recuperar el acceso a la aplicación.
        </p>
        <p className="text-xs text-gray-500 mt-4">
          Si puedes leer esto, la app funciona.
        </p>
      </div>
    </div>
  );
}