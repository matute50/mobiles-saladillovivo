'use client';

import React from 'react';
import Image from 'next/image';
import { Search, Sun, Moon, Share2, Cloud, Sun as SunIcon, CloudRain, CloudLightning, Download, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWeather } from '@/context/WeatherContext';
import { usePWA } from '@/context/PWAContext';
import { DecreeModal } from './DecreeModal';
import { InstallModal } from './InstallModal';

const getWeatherIcon = (iconName: string, isDark: boolean, size = 18, className = "") => {
    const name = iconName?.toLowerCase() || '';
    const sunColor = isDark ? "text-yellow-400" : "text-orange-500";
    if (name.includes('thunder')) return <CloudLightning size={size} className={cn("text-purple-500", className)} />;
    if (name.includes('rain')) return <CloudRain size={size} className={cn("text-blue-500", className)} />;
    if (name.includes('cloudy')) return <Cloud size={size} className={cn("text-blue-400", className)} />;
    if (name.includes('clear')) return <SunIcon size={size} className={cn(sunColor, className)} fill="currentColor" />;
    return <SunIcon size={size} className={cn(sunColor, className)} fill="currentColor" />;
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
    const { isInstallable, installApp, isInstallModalOpen, setIsInstallModalOpen } = usePWA();
    const [isDecreeOpen, setIsDecreeOpen] = React.useState(false);

    return (
        <>
            <header className={cn(
                "shrink-0 h-11 flex items-center justify-between px-3 z-50 transition-all duration-300",
                isDark
                    ? "bg-gradient-to-b from-white/30 to-black text-white"
                    : "bg-gradient-to-b from-white to-black/60 text-black border-b"
            )}>
                {/* LADO IZQUIERDO: LOGO (Restaurado a posición original) */}
                <div className="flex items-center">
                    {!isSearchOpen && (
                        <div className="relative w-36 h-9 py-1 -mt-[2px]">
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
                                    const text = "Sentí el pulso de Saladillo: su historia, el trabajo y el talento que proyecta nuestro futuro. Mucho más que noticias.";
                                    const url = "https://m.saladillovivo.com.ar";
                                    const message = `${text} ${url}`;
                                    // v63.0: Direct WhatsApp share (User Request)
                                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className={isDark ? "text-white hover:text-green-400" : "text-black hover:text-green-600"}
                            >
                                {/* WhatsApp Icon SVG */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0 .5-.5l1.4-1.4a.5.5 0 0 0 0-.7l-.7-.7a.5.5 0 0 0-.7 0l-1.4 1.4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5Z" opacity="0" />
                                    <path d="M9 10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-1.5" opacity="0" />
                                    <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-4.85-1.4l-3.9 1.4 1.4-3.9A9 9 0 0 1 12 3c4.97 0 9 4.03 9 9z" style={{ display: 'none' }} />
                                    {/* Simple Phone/Speech bubble shape approximating WhatsApp */}
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => setIsDecreeOpen(true)}
                                className={isDark ? "text-white" : "text-black/60 hover:text-black"}
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

            <InstallModal
                isOpen={isInstallModalOpen}
                onClose={() => setIsInstallModalOpen(false)}
                isDark={isDark}
            />
        </>
    );
});

Header.displayName = 'Header';
