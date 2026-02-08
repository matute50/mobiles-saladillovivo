'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { getPageData, fetchVideosBySearch } from '@/lib/data';
import { Article, Video, Ad } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

// v24.2: Interfaces for unused but existing logic
interface Interview { id: string;[key: string]: any; }
interface Banner { id: string;[key: string]: any; }
interface CalendarEvent { id: string;[key: string]: any; }

interface NewsContextType {
  allNews: Article[];
  featuredNews: Article[];
  secondaryNews: Article[];
  tertiaryNews: Article[];
  otherNews: Article[];
  allTickerTexts: string[];
  galleryVideos: Video[];
  interviews: Interview[];
  activeBanners: Banner[];
  activeAds: Ad[];
  isLoading: boolean;
  isLoadingVideos: boolean;
  isLoadingInterviews: boolean;
  isLoadingBanners: boolean;
  adsLoading: boolean;
  getNewsById: (id: string | number) => Article | undefined;
  getNewsBySlug: (slug: string) => Article | undefined;
  getRelatedNews: (currentSlug: string, category: string) => Article[];
  getNewsByCategory: (category: string) => Article[];
  calendarEvents: CalendarEvent[];
  eventsLoading: boolean;
  isLoadingConfig: boolean;
  isDarkTheme: boolean;
  // Nuevos estados y funciones para la búsqueda
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Video[];
  isSearching: boolean;
  searchLoading: boolean;
  handleSearch: (query: string) => Promise<void>;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

export const NewsProvider = ({ children }: { children: ReactNode }) => {
  const [allNews, setAllNews] = useState<Article[]>([]);

  const [allTickerTexts, setAllTickerTexts] = useState<string[]>([]);
  const [galleryVideos, setGalleryVideos] = useState<Video[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activeBanners, setActiveBanners] = useState<Banner[]>([]);
  const [activeAds, setActiveAds] = useState<Ad[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [adsLoading, setAdsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const { toast } = useToast();

  // --- ESTADO DERIVADO (v24.2 - React Architecture Skill) ---
  const featuredNews = React.useMemo(() => allNews.filter(n => n.featureStatus === 'featured'), [allNews]);
  const secondaryNews = React.useMemo(() => allNews.filter(n => n.featureStatus === 'secondary'), [allNews]);
  const tertiaryNews = React.useMemo(() => allNews.filter(n => n.featureStatus === 'tertiary'), [allNews]);
  const otherNews = React.useMemo(() => allNews.filter(n => !['featured', 'secondary', 'tertiary'].includes(n.featureStatus || '')), [allNews]);

  // --- NUEVO ESTADO PARA BÚSQUEDA ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPageData();

        setAllNews([
          ...(data.articles.featuredNews ? [data.articles.featuredNews] : []),
          ...data.articles.secondaryNews,
          ...data.articles.otherNews
        ]);
        setGalleryVideos(data.videos.allVideos);
        setActiveAds(data.ads);

        // Fallbacks for not implemented in current pageData
        setAllTickerTexts([]);
        setInterviews([]);
        setActiveBanners([]);
        setCalendarEvents([]);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: "Error de Carga", description: "No se pudieron cargar los datos." });
      } finally {
        setIsLoading(false);
        setIsLoadingVideos(false);
        setIsLoadingInterviews(false);
        setIsLoadingBanners(false);
        setAdsLoading(false);
        setEventsLoading(false);
        setIsLoadingConfig(false);
      }
    };

    fetchData();

    // Theme observer
    setIsDarkTheme(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [toast]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchLoading(true);
    try {
      const results = await fetchVideosBySearch(query);
      setSearchResults(results);
    } catch (err: unknown) {
      console.error("Error during search:", err);
      let errorMessage = "Un error desconocido ocurrió.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast({ title: "Error de Búsqueda", description: errorMessage });
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [toast]);

  const getNewsBySlug = (slug: string) => allNews.find(item => item.slug === slug);
  const getNewsById = (id: string | number) => allNews.find(item => item.id.toString() === id.toString());
  const getRelatedNews = (currentSlug: string, category: string) => allNews.filter(item => item.slug !== currentSlug && item.categoria === category).slice(0, 3);
  const getNewsByCategory = (category: string) => allNews.filter(item => item.categoria === category);

  const value = {
    allNews,
    featuredNews,
    secondaryNews,
    tertiaryNews,
    otherNews,
    allTickerTexts,
    galleryVideos,
    interviews,
    activeBanners,
    activeAds,
    isLoading,
    isLoadingVideos,
    isLoadingInterviews,
    isLoadingBanners,
    adsLoading,
    getNewsById,
    getNewsBySlug,
    getRelatedNews,
    getNewsByCategory,
    calendarEvents,
    eventsLoading,
    isLoadingConfig,
    isDarkTheme,
    // Exportar nuevos estados y funciones
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchLoading,
    handleSearch,
  };

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
};
