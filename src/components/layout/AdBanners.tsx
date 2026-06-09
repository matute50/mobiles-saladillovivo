'use client';
import React from 'react';
import { Ad } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AdBannersProps {
    ads: Ad[];
    isDark?: boolean;
    startIndex?: number;
}

export function AdBanners({ ads, isDark = true, startIndex = 0 }: AdBannersProps) {
    const activeAds = ads?.filter(ad => ad.activo) || [];
    if (activeAds.length === 0) return null;

    // Queremos mostrar 3 banners (izquierda, centro, derecha)
    const displayAds = [];
    for (let i = 0; i < 3; i++) {
        displayAds.push(activeAds[(startIndex + i) % activeAds.length]);
    }

    return (
        <div className="flex w-full justify-between items-center gap-2 py-1 shrink-0 px-2">
            {displayAds.map((ad, i) => (
                <a 
                    key={`${ad.id}-${i}`} 
                    href={ad.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "relative flex-1 aspect-[2/1] rounded-md overflow-hidden border shadow-sm flex items-center justify-center transition-transform active:scale-95",
                        isDark ? "bg-neutral-800 border-neutral-700" : "bg-neutral-100 border-neutral-200"
                    )}
                >
                    {ad.imagen_url ? (
                        <Image 
                            src={ad.imagen_url} 
                            fill 
                            sizes="(max-width: 768px) 33vw, 20vw"
                            alt={ad.cliente || "Publicidad"} 
                            className="object-cover" 
                            unoptimized
                        />
                    ) : (
                        <span className={cn(
                            "text-[10px] font-bold uppercase opacity-50 text-center px-1 leading-tight",
                            isDark ? "text-white" : "text-black"
                        )}>
                            {ad.cliente}
                        </span>
                    )}
                </a>
            ))}
        </div>
    );
}
