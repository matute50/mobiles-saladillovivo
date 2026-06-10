'use client';
import React from 'react';
import { Sponsor } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SponsorBannersProps {
    sponsors: Sponsor[];
    isDark?: boolean;
}

export function SponsorBanners({ sponsors, isDark = true }: SponsorBannersProps) {
    if (!sponsors || sponsors.length === 0) return null;

    return (
        <div className="grid grid-cols-3 w-full gap-2 py-1 shrink-0 px-2">
            {sponsors.map((sponsor, i) => (
                <a 
                    key={`${sponsor.id}-${i}`} 
                    href={sponsor.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "relative flex-1 aspect-square rounded-md overflow-hidden border shadow-sm flex items-center justify-center transition-transform active:scale-95",
                        isDark ? "bg-neutral-800 border-neutral-700" : "bg-neutral-100 border-neutral-200"
                    )}
                >
                    {sponsor.imagen_url ? (
                        <Image 
                            src={sponsor.imagen_url} 
                            fill 
                            sizes="(max-width: 768px) 33vw, 20vw"
                            alt={sponsor.cliente || "Publicidad"} 
                            className="object-cover" 
                            unoptimized
                        />
                    ) : (
                        <span className={cn(
                            "text-[10px] font-bold uppercase opacity-50 text-center px-1 leading-tight",
                            isDark ? "text-white" : "text-black"
                        )}>
                            {sponsor.cliente}
                        </span>
                    )}
                </a>
            ))}
        </div>
    );
}
