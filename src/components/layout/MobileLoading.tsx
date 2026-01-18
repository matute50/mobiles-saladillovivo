'use client';

import { Skeleton } from "../ui/Skeleton";

export default function MobileLoading() {
  return (
    <div className="fixed inset-0 flex flex-col w-full h-[100dvh] bg-black overflow-hidden">
      {/* Header Skeleton */}
      <header className="shrink-0 h-11 flex items-center justify-between px-3 bg-neutral-900">
        <Skeleton className="w-32 h-6" />
        <div className="flex gap-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
      </header>

      {/* Video Section Skeleton (Mismo tamaño que el reproductor) */}
      <div className="relative w-full aspect-video bg-neutral-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
      </div>

      {/* Cuerpo de Noticias */}
      <div className="flex-1 px-3 pt-4 space-y-5">
        <div className="flex justify-center">
          <Skeleton className="w-48 h-7" />
        </div>
        
        {/* Noticia Principal (Card grande) */}
        <Skeleton className="w-full h-44 rounded-xl" />

        {/* Carrusel de Categorías Inferior */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="w-44 h-6" />
            <Skeleton className="w-8 h-8" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="w-40 h-28 shrink-0" />
            <Skeleton className="w-40 h-28 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}