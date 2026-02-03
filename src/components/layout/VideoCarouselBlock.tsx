'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Play, Share2 } from 'lucide-react';
import { shareToWhatsApp } from '@/lib/share';
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Video } from '@/lib/types';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';

interface VideoCarouselBlockProps {
    videos: Video[];
    isDark: boolean;
}

const getYouTubeThumbnail = (url: string) => {
    if (!url) return '/placeholder.png';
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : '/placeholder.png';
};

import { getDisplayCategory } from '@/lib/categoryMappings';

export const VideoCarouselBlock = React.memo(({ videos, isDark }: VideoCarouselBlockProps) => {
    const { playManual } = useMediaPlayer();
    const { unmute } = useVolume();
    const [activeCatIndex, setActiveCatIndex] = useState(0);

    const categories = useMemo(() =>
        Array.from(new Set(videos.map((v: Video) => getDisplayCategory(v.categoria)))).sort()
        , [videos]);

    const currentCat = (categories[activeCatIndex] as string) || 'VARIOS';
    const filtered = videos.filter((v: Video) => getDisplayCategory(v.categoria) === currentCat);
    const themeColorClass = isDark ? "text-[#6699ff]" : "text-[#003399]";

    if (videos.length === 0) return null;

    return (
        <div className="flex flex-col h-full w-full pt-1">
            <div className="flex items-center justify-between px-2 py-0.5 shrink-0">
                <button
                    onClick={() => setActiveCatIndex(p => p === 0 ? categories.length - 1 : p - 1)}
                    className={themeColorClass}
                >
                    <ChevronLeft size={32} />
                </button>
                <h2 className={cn("font-black italic text-xl uppercase tracking-wider text-center flex-1 truncate px-2", themeColorClass)}>
                    {currentCat}
                </h2>
                <button
                    onClick={() => setActiveCatIndex(p => p === categories.length - 1 ? 0 : p + 1)}
                    className={themeColorClass}
                >
                    <ChevronRight size={32} />
                </button>
            </div>
            <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1 px-1 mt-1">
                {filtered.map((v: Video) => (
                    <SwiperSlide key={v.id}>
                        <div
                            onClick={() => { unmute(); playManual(v); }}
                            className={cn(
                                "relative h-full rounded-lg overflow-hidden border",
                                isDark ? "bg-neutral-800 border-neutral-700/50" : "bg-white border-neutral-200"
                            )}
                        >
                            <Image
                                src={v.imagen || getYouTubeThumbnail(v.url)}
                                alt={v.nombre}
                                fill
                                sizes="33vw"
                                className="object-cover opacity-90"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-[#003399]/50 p-1.5 rounded-full border border-white/10 -mt-8">
                                    <Play size={21} fill="white" />
                                </div>
                            </div>

                            {/* SHARE BTN */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    shareToWhatsApp(v);
                                }}
                                className="absolute top-2 right-2 z-30 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-all shadow-lg"
                            >
                                <Share2 size={16} />
                            </button>

                            <div className="absolute bottom-0 w-full p-1.5 bg-gradient-to-t from-black via-black/60 to-transparent text-center leading-tight">
                                <p className="text-[14px] text-white font-bold line-clamp-3 uppercase px-1">
                                    {v.nombre}
                                </p>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
});

VideoCarouselBlock.displayName = 'VideoCarouselBlock';

