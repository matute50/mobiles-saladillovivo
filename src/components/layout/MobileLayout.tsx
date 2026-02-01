'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMediaPlayer } from '@/context/MediaPlayerContext';
import { useVolume } from '@/context/VolumeContext';
import VideoSection from './VideoSection';
import { PageData, Video, Article } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import type { Swiper as SwiperClass } from 'swiper';
import { cn } from '@/lib/utils';

// Sub-componentes
import { Header } from './Header';
import { WeatherWidget } from './WeatherWidget';
import { VideoCarouselBlock } from './VideoCarouselBlock';
import { NewsSlider } from './NewsSlider';

export default function MobileLayout({ data }: { data: PageData }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { setVideoPool } = useMediaPlayer();
  const [newsSwiper, setNewsSwiper] = useState<SwiperClass | null>(null);
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();

    const articles = [
      ...(data.articles?.featuredNews ? [data.articles.featuredNews] : []),
      ...(data.articles?.secondaryNews || []),
      ...(data.articles?.otherNews || [])
    ];

    const matchedArticles = articles.filter(a => a.titulo.toLowerCase().includes(q));
    const matchedVideos = (data.videos?.allVideos || []).filter(v => v.nombre.toLowerCase().includes(q));

    return {
      ...data,
      articles: {
        featuredNews: matchedArticles[0] || null,
        secondaryNews: matchedArticles.slice(1, 5),
        otherNews: matchedArticles.slice(5)
      },
      videos: {
        ...data.videos,
        allVideos: matchedVideos
      }
    };
  }, [searchQuery, data]);

  const newsSlides = useMemo(() => {
    const slides = [];
    const articles = filteredData?.articles;
    if (articles?.featuredNews) slides.push({ type: 'featured', items: [articles.featuredNews] });
    const secondary = [...(articles?.secondaryNews || []), ...(articles?.otherNews || [])];
    for (let i = 0; i < secondary.length; i += 2) slides.push({ type: 'pair', items: secondary.slice(i, i + 2) });
    return slides;
  }, [filteredData]);

  useEffect(() => {
    if (data && mounted) {
      const allVideos = data.videos?.allVideos || [];
      const newsId = searchParams.get('id');
      const videoId = searchParams.get('v');
      let target: Video | Article | undefined;

      if (newsId) {
        const articlesArr = [
          ...(data.articles?.featuredNews ? [data.articles.featuredNews] : []),
          ...(data.articles?.secondaryNews || []),
          ...(data.articles?.otherNews || [])
        ];
        target = articlesArr.find(n => String(n.id) === newsId);
      } else if (videoId) {
        target = allVideos.find(v => String(v.id) === videoId);
      }

      (setVideoPool as any)(allVideos, target);
    }
  }, [data, mounted, searchParams, setVideoPool]);

  if (!mounted) return null;

  return (
    <div className={cn("fixed inset-0 flex flex-col w-full h-[100dvh] overflow-hidden", isDark ? "bg-black" : "bg-neutral-50")}>
      <Header
        isDark={isDark}
        setIsDark={setIsDark}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="relative z-40 w-full aspect-video bg-black">
        <VideoSection isMobile={true} />
      </div>

      <div className="flex-1 flex flex-col gap-2 px-3 pt-1 pb-4 overflow-y-auto">
        <NewsSlider
          newsSlides={newsSlides}
          isDark={isDark}
          searchQuery={searchQuery}
          onSwiper={setNewsSwiper}
          onPrev={() => newsSwiper?.slidePrev()}
          onNext={() => newsSwiper?.slideNext()}
        />

        <div className="h-[160px] shrink-0 -mt-1">
          <VideoCarouselBlock videos={filteredData?.videos?.allVideos || []} isDark={isDark} />
        </div>

        <WeatherWidget isDark={isDark} />
      </div>
    </div>
  );
}
