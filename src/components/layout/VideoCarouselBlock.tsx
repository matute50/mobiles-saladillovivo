'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Video } from '@/lib/types';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import { ShareButton } from '@/components/ui/ShareButton';


interface VideoCarouselBlockProps {
    videos: Video[];
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

export const VideoCarouselBlock = React.memo(({ videos, isDark, searchQuery, onVideoSelect }: VideoCarouselBlockProps) => {
    const { playManual } = useMediaPlayer();
    const { unmute } = useVolume();
    const [activeCatIndex, setActiveCatIndex] = useState(0);
    const [shuffledVideos, setShuffledVideos] = useState<Video[]>([]);
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
        if (videos.length > 0) {
            // 1. Barajar videos
            const mixedVideos = shuffleArray(videos);

            // 2. Calcular categorías únicas basadas en el orden mezclado
            const uniqueCats = Array.from(new Set(mixedVideos.map((v: Video) => getDisplayCategory(v.categoria)))).sort();

            // 3. Filtrar candidatos válidos para inicio (Excluir "HCD de Saladillo")
            const validStartIndices = uniqueCats
                .map((cat, index) => ({ cat, index }))
                // Normalización simple para evitar errores de espacios/mayúsculas
                .filter(item => !item.cat.toLowerCase().includes("hcd de saladillo"))
                .map(item => item.index);

            // 4. Elegir índice al azar de los válidos, o random total si falla el filtro
            let randomCatIndex = 0;
            if (validStartIndices.length > 0) {
                const randomSelection = Math.floor(Math.random() * validStartIndices.length);
                randomCatIndex = validStartIndices[randomSelection];
            } else {
                randomCatIndex = Math.floor(Math.random() * uniqueCats.length);
            }

            setShuffledVideos(mixedVideos);

            // Si hay búsqueda, resetear índice a 0 (aunque no se use multi-cat)
            setActiveCatIndex(searchQuery ? 0 : randomCatIndex);

            setIsRandomized(true);
        }
    }, [videos, searchQuery]); // Re-run on search change

    const categories = useMemo(() => {
        if (!isRandomized) return [];
        return Array.from(new Set(shuffledVideos.map((v: Video) => getDisplayCategory(v.categoria)))).sort();
    }, [shuffledVideos, isRandomized]);

    const isSearchMode = !!(searchQuery && searchQuery.trim().length > 0);
    const currentCat = isSearchMode ? 'TU BUSQUEDA' : ((categories[activeCatIndex] as string) || 'VARIOS');

    // Si es búsqueda, mostrar TODOS los resultados (ya están filtrados por el padre). Si no, filtrar por categoría.
    const filtered = useMemo(() => {
        if (isSearchMode) return shuffledVideos;
        return shuffledVideos.filter((v: Video) => getDisplayCategory(v.categoria) === currentCat);
    }, [shuffledVideos, currentCat, isSearchMode]);

    const themeColorClass = isDark ? "text-[#6699ff]" : "text-[#003399]";

    if (!isRandomized || videos.length === 0) return null; // Esperar a la mezcla

    return (
        <div className="flex flex-col h-full w-full pt-1">
            <div className="flex items-center justify-between px-2 py-0.5 shrink-0">
                {!isSearchMode && (
                    <button
                        onClick={() => setActiveCatIndex(p => p === 0 ? categories.length - 1 : p - 1)}
                        className={themeColorClass}
                    >
                        <ChevronLeft size={32} />
                    </button>
                )}

                <h2 className={cn(
                    "font-black italic text-xl uppercase tracking-wider text-center flex-1 truncate px-2 transition-all",
                    themeColorClass,
                    isDark ? "drop-shadow-[0_0_7px_rgba(255,255,255,0.5)]" : "drop-shadow-[0_0_7px_rgba(0,0,0,0.5)]"
                )}>
                    {currentCat}
                </h2>

                {!isSearchMode && (
                    <button
                        onClick={() => setActiveCatIndex(p => p === categories.length - 1 ? 0 : p + 1)}
                        className={themeColorClass}
                    >
                        <ChevronRight size={32} />
                    </button>
                )}
            </div>
            <Swiper slidesPerView={2.2} spaceBetween={10} className="w-full flex-1 px-1 mt-1">
                {filtered.map((v: Video) => (
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
                                <p className="text-[14px] text-white font-bold line-clamp-3 uppercase px-1">
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
        </div>
    );
});

VideoCarouselBlock.displayName = 'VideoCarouselBlock';

