'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Video } from '@/lib/types';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import { useNews } from '@/context/NewsContext';
import { ShareButton } from '@/components/ui/ShareButton';
import { Loader2 } from 'lucide-react';


interface VideoCarouselBlockProps {
    isDark: boolean;
    searchQuery?: string;
    onVideoSelect?: () => void;
}

const getYouTubeThumbnail = (url: string) => {
    if (!url) return '/placeholder.png';
    // Comprehensive Regex: Supports watch?v=, youtu.be, embed, shorts, v, etc.
    const match = url.match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/);
    const id = (match && match[1]) ? match[1] : null;
    return (id && id.length === 11) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '/placeholder.png';
};


import { getDisplayCategory } from '@/lib/categoryMappings';

export const VideoCarouselBlock = React.memo(({ isDark, searchQuery, onVideoSelect }: VideoCarouselBlockProps) => {
    const { playManual } = useMediaPlayer();
    const { unmute } = useVolume();
    const {
        availableDisplayCategories,
        loadCategoryData,
        videosByCategory,
        isLoadingCategory,
        searchResults,
        isSearching
    } = useNews();

    const [activeCatIndex, setActiveCatIndex] = useState(0);
    const [isRandomized, setIsRandomized] = useState(false);

    // vShuffle: Fisher-Yates Shuffle Algorithm
    const shuffleArray = (array: Video[]) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    // vShuffle: Randomize once on mount OR when videos change substantially (search)
    React.useEffect(() => {
        if (availableDisplayCategories.length > 0) {
            // Filtrar candidatos válidos para inicio (Excluir "HCD de Saladillo")
            const validStartIndices = availableDisplayCategories
                .map((cat, index) => ({ cat, index }))
                .filter(item => !item.cat.toLowerCase().includes("hcd de saladillo"))
                .map(item => item.index);

            let randomCatIndex = 0;
            if (validStartIndices.length > 0) {
                const randomSelection = Math.floor(Math.random() * validStartIndices.length);
                randomCatIndex = validStartIndices[randomSelection];
            } else {
                randomCatIndex = Math.floor(Math.random() * availableDisplayCategories.length);
            }

            // Si hay búsqueda, resetear índice a 0
            const targetIndex = searchQuery ? 0 : randomCatIndex;
            setActiveCatIndex(targetIndex);

            // v22.7: Trigger initial load for the selected category
            if (!searchQuery && availableDisplayCategories[targetIndex]) {
                loadCategoryData(availableDisplayCategories[targetIndex]);
            }

            setIsRandomized(true);
        }
    }, [availableDisplayCategories, searchQuery, loadCategoryData]);
    // Re-run on search change

    const handleCategoryChange = (newIndex: number) => {
        setActiveCatIndex(newIndex);
        const nextCat = availableDisplayCategories[newIndex];
        if (nextCat) {
            loadCategoryData(nextCat);
        }
    };

    const isSearchMode = !!(searchQuery && searchQuery.trim().length > 0);
    const currentCat = isSearchMode ? 'TU BUSQUEDA' : ((availableDisplayCategories[activeCatIndex] as string) || 'VARIOS');

    // v22.7 Fetch-On-Demand logic
    const displayedVideos = useMemo(() => {
        if (isSearchMode) return searchResults;
        return videosByCategory[currentCat] || [];
    }, [isSearchMode, searchResults, videosByCategory, currentCat]);

    const themeColorClass = isDark ? "text-[#6699ff]" : "text-[#003399]";

    if (!isRandomized || (availableDisplayCategories.length === 0 && !isSearchMode)) return null;
    // Esperar a la mezcla

    return (
        <div className="flex flex-col h-full w-full pt-1">
            <div className="flex items-center justify-between px-2 py-0.5 shrink-0">
                {!isSearchMode && (
                    <button
                        onClick={() => handleCategoryChange(activeCatIndex === 0 ? availableDisplayCategories.length - 1 : activeCatIndex - 1)}
                        className={themeColorClass}
                    >
                        <ChevronLeft size={32} />
                    </button>
                )}

                <h2 className={cn(
                    "font-black italic text-xl uppercase tracking-wider text-center flex-1 truncate px-2 transition-all bg-[length:200%_auto] animate-shimmer-cat bg-clip-text text-transparent",
                    isDark
                        ? "bg-gradient-to-r from-[#6699ff] via-[#ffffff] to-[#6699ff]"
                        : "bg-gradient-to-r from-[#003399] via-[#000000] to-[#003399]"
                )}>
                    {currentCat}
                </h2>

                {!isSearchMode && (
                    <button
                        onClick={() => handleCategoryChange(activeCatIndex === availableDisplayCategories.length - 1 ? 0 : activeCatIndex + 1)}
                        className={themeColorClass}
                    >
                        <ChevronRight size={32} />
                    </button>
                )}
            </div>
            {(isLoadingCategory || isSearching) && displayedVideos.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white/20" size={40} />
                </div>
            ) : (
                <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1 px-1 mt-1">
                    {displayedVideos.map((v: Video) => (
                        <SwiperSlide key={v.id}>
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    unmute();
                                    playManual(v);
                                    if (onVideoSelect) {
                                        setTimeout(() => onVideoSelect(), 500);
                                    }
                                }}
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
                                    unoptimized
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-[#003399]/50 p-1.5 rounded-full border border-white -mt-8">
                                        <Play size={21} fill="white" />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 w-full p-1.5 bg-gradient-to-t from-black via-black/60 to-transparent text-center leading-tight">
                                    <p
                                        className="text-[14px] text-white font-bold line-clamp-3 uppercase px-1"
                                        style={{ textShadow: '0 0 10px rgba(0,0,0,1), 1px 1px 3px rgba(0,0,0,1)' }}
                                    >
                                        {v.nombre}
                                    </p>
                                </div>

                                {/* Share Button Overlay */}
                                <div className="absolute top-1 right-1 z-30">
                                    <ShareButton
                                        content={v}
                                        variant="simple"
                                        className="bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 p-1.5 border border-black"
                                        iconSize={16}
                                    />
                                </div>

                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}
        </div>
    );
});

VideoCarouselBlock.displayName = 'VideoCarouselBlock';

