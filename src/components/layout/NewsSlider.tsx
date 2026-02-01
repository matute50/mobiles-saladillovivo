'use client';

import React from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Article } from '@/lib/types';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';

interface NewsSliderProps {
    newsSlides: any[];
    isDark: boolean;
    searchQuery: string;
    onSwiper: (swiper: SwiperClass) => void;
    onPrev: () => void;
    onNext: () => void;
}

export const NewsSlider = React.memo(({
    newsSlides,
    isDark,
    searchQuery,
    onSwiper,
    onPrev,
    onNext
}: NewsSliderProps) => {
    const { playManual } = useMediaPlayer();
    const { unmute } = useVolume();

    return (
        <div className="flex flex-col gap-2 pt-1 pb-4">
            <div className="flex items-center justify-between px-2 shrink-0">
                <button onClick={onPrev} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}>
                    <ChevronLeft size={32} />
                </button>
                <h3 className={cn("font-black italic text-xl uppercase text-center flex-1 truncate px-2 mt-1", isDark ? "text-[#6699ff]" : "text-[#003399]")}>
                    {searchQuery ? "Resultados" : "Noticias"}
                </h3>
                <button onClick={onNext} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}>
                    <ChevronRight size={32} />
                </button>
            </div>

            <div className="w-full aspect-[16/6.4] shrink-0">
                <Swiper onSwiper={onSwiper} slidesPerView={1} className="h-full">
                    {newsSlides.map((slide, idx) => (
                        <SwiperSlide key={idx}>
                            <div className="w-full h-full flex justify-between">
                                {slide.items.map((item: Article) => (
                                    <div
                                        key={item.id}
                                        onClick={() => { unmute(); playManual(item); }}
                                        className={cn(
                                            "relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform",
                                            isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200",
                                            slide.type === 'featured' ? "w-full h-full" : "w-[49%] h-full"
                                        )}
                                    >
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={item.imagen || '/placeholder.png'}
                                                alt={item.titulo}
                                                fill
                                                sizes="50vw"
                                                className="object-cover opacity-90"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
                                            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-3 text-center text-white">
                                                <div className={cn(
                                                    "flex items-center justify-center rounded-full backdrop-blur-sm border border-white/20 mb-2 p-3",
                                                    isDark ? "bg-[#6699ff]/50" : "bg-[#003399]/50"
                                                )}>
                                                    <Play size={slide.type === 'featured' ? 32 : 24} fill="white" className="ml-1" />
                                                </div>
                                                <h3 className={cn(
                                                    "font-black uppercase tracking-tight leading-[1.1] line-clamp-3 italic",
                                                    slide.type === 'featured' ? "text-xl" : "text-[13px]"
                                                )}>
                                                    {item.titulo}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
});

NewsSlider.displayName = 'NewsSlider';

