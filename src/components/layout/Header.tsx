'use client';

import React from 'react';
import Image from 'next/image';
import { Search, Sun, Moon, Share2, Cloud, Sun as SunIcon, CloudRain, CloudLightning, Download, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWeather } from '@/context/WeatherContext';
import { usePWA } from '@/context/PWAContext';
import { DecreeModal } from './DecreeModal';

const getWeatherIcon = (iconName: string, isDark: boolean, size = 18, className = "") => {
    const name = iconName?.toLowerCase() || '';
    const sunColor = isDark ? "text-yellow-400" : "text-orange-500";
    if (name.includes('thunder')) return <CloudLightning size={size} className={cn("text-purple-500", className)} />;
    if (name.includes('rain')) return <CloudRain size={size} className={cn("text-blue-500", className)} />;
    if (name.includes('cloudy')) return <Cloud size={size} className={cn("text-blue-400", className)} />;
    if (name.includes('clear')) return <SunIcon size={size} className={cn(sunColor, className)} />;
    return <SunIcon size={size} className={cn(sunColor, className)} />;
};

interface HeaderProps {
    isDark: boolean;
    setIsDark: (dark: boolean) => void;
    isSearchOpen: boolean;
    setIsSearchOpen: (open: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export const Header = React.memo(({
    isDark,
    setIsDark,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
}: HeaderProps) => {
    const { weather, setIsExtendedOpen } = useWeather();
    const { isInstallable, installApp } = usePWA();
    const [isDecreeOpen, setIsDecreeOpen] = React.useState(false);

    return (
        <>
            <header className={cn(
                "shrink-0 h-11 flex items-center justify-between px-3 z-50 transition-all duration-300",
                isDark
                    ? "bg-gradient-to-b from-white/30 to-black text-white"
                    : "bg-gradient-to-b from-black/60 to-white text-black border-b"
            )}>
                {/* LADO IZQUIERDO: LOGO (Restaurado a posición original) */}
                <div className="flex items-center">
                    {!isSearchOpen && (
                        <div className="relative w-36 h-9 py-1">
                            <Image
                                src={isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png'}
                                alt="Logo"
                                fill
                                priority
                                sizes="150px"
                                className="object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* CENTRO: BARRA DE BÚSQUEDA (Si está abierta) */}
                {isSearchOpen && (
                    <div className="flex-1 h-full flex items-center px-4">
                        <input
                            type="text"
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar..."
                            className={cn("w-full bg-transparent border-b outline-none py-1 text-sm", isDark ? "border-white/20 text-white" : "border-black/10 text-black")}
                        />
                    </div>
                )}

                {/* LADO DERECHO: ACCIONES (MODO > LUPA > COMPARTIR) */}
                <div className="flex items-center gap-3">
                    {/* Botón Modo (Ahora a la izquierda de la lupa) */}
                    <button onClick={() => setIsDark(!isDark)} className="shrink-0 p-1">
                        {isDark ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-black" />}
                    </button>

                    <button
                        onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(""); }}
                        className={isDark ? "text-neutral-300" : "text-neutral-700"}
                    >
                        <Search size={20} strokeWidth={3} />
                    </button>

                    {!isSearchOpen && (
                        <>
                            <button
                                onClick={() => {
                                    const text = "¡Instala Saladillo Vivo en tu dispositivo para estar siempre informado! 📲";
                                    const url = "https://saladillovivo.com.ar";
                                    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
                                }}
                                className={isDark ? "text-white" : "text-black"}
                            >
                                <Share2 size={20} />
                            </button>

                            <button
                                onClick={() => setIsDecreeOpen(true)}
                                className={isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}
                            >
                                <HelpCircle size={20} strokeWidth={3} />
                            </button>

                            {/* CLIMA EN EL HEADER */}
                            {weather && (
                                <button
                                    onClick={() => setIsExtendedOpen(true)}
                                    className="flex items-center gap-1.5 pl-1 border-l border-white/10"
                                >
                                    <span className={cn("text-[15px] font-black italic tracking-tighter", isDark ? "text-white" : "text-neutral-900")}>
                                        {Math.round(weather.currentConditions.temp)}°
                                    </span>
                                    {getWeatherIcon(weather.currentConditions.icon, isDark, 20)}
                                </button>
                            )}

                            {/* BOTÓN INSTALACIÓN PWA (v5.6) */}
                            {isInstallable && (
                                <button
                                    onClick={installApp}
                                    className="flex items-center justify-center p-1.5 bg-red-600 text-white rounded-full active:scale-90 transition-all shadow-lg animate-ping-pong"
                                    title="Instalar Aplicación"
                                >
                                    <Download size={16} strokeWidth={3} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </header>

            <DecreeModal
                isOpen={isDecreeOpen}
                onClose={() => setIsDecreeOpen(false)}
                isDark={isDark}
            />
        </>
    );
});

Header.displayName = 'Header';
