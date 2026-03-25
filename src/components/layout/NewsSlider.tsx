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
import { ShareButton } from '@/components/ui/ShareButton';


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

    const totalArticles = React.useMemo(() => 
        newsSlides.reduce((acc, slide) => acc + slide.items.length, 0),
    [newsSlides]);

    return (
        <div className="flex flex-col gap-2 pt-1 pb-4">
            <div className="flex items-center justify-between px-2 shrink-0">
                <button onClick={onPrev} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}>
                    <ChevronLeft size={32} />
                </button>
                <h3 className={cn(
                    "font-black italic text-xl uppercase text-center flex-1 truncate px-2 mt-1 transition-all bg-[length:200%_auto] animate-shimmer-news bg-clip-text text-transparent",
                    isDark
                        ? "bg-gradient-to-r from-[#6699ff] via-[#ffffff] to-[#6699ff]"
                        : "bg-gradient-to-r from-[#003399] via-[#000000] to-[#003399]"
                )}>
                    {searchQuery ? "Resultados" : `${totalArticles} ÚLTIMAS NOTICIAS`}
                </h3>
                <button onClick={onNext} className={isDark ? "text-[#6699ff]" : "text-[#003399]"}>
                    <ChevronRight size={32} />
                </button>
            </div>

            <div className="w-full aspect-[16/7.2] shrink-0">
                <Swiper onSwiper={onSwiper} slidesPerView={1} className="h-full">
                    {newsSlides.map((slide, idx) => (
                        <SwiperSlide key={idx}>
                            <div className="w-full h-full flex justify-between">
                                {slide.items.map((item: Article) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            unmute();
                                            // v24.1: Safety Delay on Play (Skill Rule)
                                            setTimeout(() => {
                                                playManual(item);
                                            }, 500);
                                        }}
                                        className={cn(
                                            "relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform",
                                            isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200",
                                            slide.type === 'featured' ? "w-full h-full" : "w-[49%] h-full"
                                        )}
                                    >
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={item.imagen || '/placeholder.svg'}
                                                alt={item.titulo}
                                                fill
                                                sizes="(max-width: 640px) 100vw, 50vw"
                                                priority={idx < 3} // Cargar con prioridad las primeras 3 slides para mejorar LCP
                                                className="object-cover opacity-90"
                                                unoptimized
                                            />

                                            {/* Date Overlay */}
                                            <div className="absolute top-1.5 left-1.5 z-30 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-medium border border-white/10 uppercase italic">
                                                {new Date(item.fecha).toLocaleDateString('es-AR', { 
                                                    day: 'numeric', 
                                                    month: 'numeric', 
                                                    year: 'numeric'
                                                })}
                                            </div>

                                            {/* Share Button Overlay */}
                                            <div className="absolute top-2 right-2 z-30">
                                                <ShareButton
                                                    content={item}
                                                    variant="simple"
                                                    className={cn(
                                                        "backdrop-blur-sm text-white p-1 bg-black/50 hover:bg-black/70"
                                                    )}
                                                    iconSize={15}
                                                />
                                            </div>

                                            {/* Top and Bottom Vignette with Blur */}
                                            <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black/80 via-black/20 to-transparent z-10 backdrop-blur-[1px]" />
                                            <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 backdrop-blur-[1px]" />

                                            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-3 text-center text-white">
                                                <div className={cn(
                                                    "flex items-center justify-center rounded-full backdrop-blur-sm border border-white mb-2 p-3",
                                                    isDark ? "bg-[#6699ff]/50" : "bg-[#003399]/50"
                                                )}>
                                                    <Play size={slide.type === 'featured' ? 32 : 24} fill="white" className="ml-1" />
                                                </div>
                                                <h3
                                                    className={cn(
                                                        "font-black uppercase tracking-tight italic",
                                                        slide.type === 'featured' 
                                                            ? "text-xl leading-[1.1] line-clamp-3" 
                                                            : "text-[15px] leading-[1.1] line-clamp-4"
                                                    )}
                                                    style={{ textShadow: '0 0 10px rgba(0,0,0,1), 0 0 5px rgba(0,0,0,1)' }}
                                                >
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

