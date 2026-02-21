'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { getPageData, fetchVideosBySearch, fetchVideosByCategory, fetchAvailableCategories } from '@/lib/data';
import { Article, Video, Ad } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';


interface NewsContextType {
  allNews: Article[];
  featuredNews: Article[];
  secondaryNews: Article[];
  tertiaryNews: Article[];
  otherNews: Article[];
  allTickerTexts: string[];
  galleryVideos: Video[];
  activeAds: Ad[];
  isLoading: boolean;
  adsLoading: boolean;
  getNewsById: (id: string | number) => Article | undefined;
  getNewsBySlug: (slug: string) => Article | undefined;
  getRelatedNews: (currentSlug: string, category: string) => Article[];
  getNewsByCategory: (category: string) => Article[];
  isDarkTheme: boolean;
  // Nuevos estados y funciones para la búsqueda
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Video[];
  isSearching: boolean;
  searchLoading: boolean;
  handleSearch: (query: string) => Promise<void>;
  // v22.7 Fetch-On-Demand
  availableCategories: string[];
  availableDisplayCategories: string[];
  videosByCategory: Record<string, Video[]>;
  isLoadingCategory: boolean;
  loadCategoryData: (category: string) => Promise<void>;
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

  const [isLoading, setIsLoading] = useState(true);
  const [activeAds, setActiveAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);

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

  // --- NUEVO ESTADO PARA FETCH-ON-DEMAND (v22.7) ---
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableDisplayCategories, setAvailableDisplayCategories] = useState<string[]>([]);
  const [videosByCategory, setVideosByCategory] = useState<Record<string, Video[]>>({});
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

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

        // v22.7: Cargar las categorías disponibles
        const cats = await fetchAvailableCategories();
        setAvailableCategories(cats);

        const { getDisplayCategory } = await import('@/lib/categoryMappings');
        const displayCats = Array.from(new Set(cats.map(c => getDisplayCategory(c)))).sort();
        setAvailableDisplayCategories(displayCats);


      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: "Error de Carga", description: "No se pudieron cargar los datos." });
      } finally {
        setIsLoading(false);
        setAdsLoading(false);
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

    // ✅ Race Condition Fix (react-useeffect skill)
    // Crear AbortController para cancelar requests obsoletos
    const controller = new AbortController();

    try {
      const results = await fetchVideosBySearch(query, controller.signal);

      // Solo actualizar si no fue cancelado
      if (!controller.signal.aborted) {
        setSearchResults(results);
      }
    } catch (err: unknown) {
      // Ignorar errores de abort - son esperados
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error("Error during search:", err);
      let errorMessage = "Un error desconocido ocurrió.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      if (!controller.signal.aborted) {
        toast({ title: "Error de Búsqueda", description: errorMessage });
        setSearchResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setSearchLoading(false);
      }
    }
  }, [toast]);

  const loadCategoryData = useCallback(async (displayCategory: string) => {
    if (!displayCategory || videosByCategory[displayCategory]) return;

    setIsLoadingCategory(true);
    try {
      const { categoryMappings } = await import('@/lib/categoryMappings');
      const mapping = categoryMappings.find(m => m.display === displayCategory);

      let results: Video[] = [];

      if (mapping) {
        const dbCats = Array.isArray(mapping.dbCategory) ? mapping.dbCategory : [mapping.dbCategory];
        const resultsArray = await Promise.all(dbCats.map(cat => fetchVideosByCategory(cat)));
        results = resultsArray.flat();
      } else {
        results = await fetchVideosByCategory(displayCategory);
      }

      setVideosByCategory(prev => ({
        ...prev,
        [displayCategory]: results
      }));
    } catch (err) {
      console.error(`Error loading category ${displayCategory}:`, err);
      toast({ title: "Error de Categoría", description: `No se pudieron cargar videos de ${displayCategory}` });
    } finally {
      setIsLoadingCategory(false);
    }
  }, [videosByCategory, toast]);

  const getNewsBySlug = (slug: string) => allNews.find(item => item.slug === slug);
  const getNewsById = (id: string | number) => allNews.find(item => item.id.toString() === id.toString());
  const getRelatedNews = (currentSlug: string, category: string) => allNews.filter(item => item.slug !== currentSlug && item.categoria === category).slice(0, 3);
  const getNewsByCategory = (category: string) => allNews.filter(item => item.categoria === category);

  const value = React.useMemo(() => ({
    allNews,
    featuredNews,
    secondaryNews,
    tertiaryNews,
    otherNews,
    allTickerTexts,
    galleryVideos,
    activeAds,
    isLoading,
    adsLoading,
    getNewsById,
    getNewsBySlug,
    getRelatedNews,
    getNewsByCategory,
    isDarkTheme,
    // Exportar nuevos estados y funciones
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchLoading,
    handleSearch,
    // Fetch-On-Demand exports
    availableCategories,
    availableDisplayCategories,
    videosByCategory,
    isLoadingCategory,
    loadCategoryData,
  }), [
    allNews, featuredNews, secondaryNews, tertiaryNews, otherNews,
    allTickerTexts, galleryVideos, activeAds, isLoading, adsLoading,
    getNewsById, getNewsBySlug, getRelatedNews, getNewsByCategory,
    isDarkTheme, searchQuery, searchResults, isSearching, searchLoading,
    handleSearch, availableCategories, availableDisplayCategories,
    videosByCategory, isLoadingCategory, loadCategoryData
  ]);

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
};
