'use client';

import React from 'react';
import Image from 'next/image';
import { Search, Sun, Moon, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    return (
        <header className={cn("shrink-0 h-11 flex items-center justify-between px-3 z-50", isDark ? "bg-neutral-900" : "bg-white border-b")}>
            {!isSearchOpen ? (
                <div className="relative w-36 h-full py-1">
                    <Image
                        src={isDark ? '/FONDO_OSCURO.png' : '/FONDO_CLARO.png'}
                        alt="Logo"
                        fill
                        priority
                        sizes="150px"
                        className="object-contain"
                    />
                </div>
            ) : (
                <div className="flex-1 h-full flex items-center pr-2">
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
            <div className="flex items-center gap-3">
                <button
                    onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(""); }}
                    className={isDark ? "text-neutral-300" : "text-neutral-700"}
                >
                    <Search size={20} />
                </button>
                {!isSearchOpen && (
                    <>
                        <button onClick={() => setIsDark(!isDark)}>
                            {isDark ? <Sun size={20} className="text-white" /> : <Moon size={20} />}
                        </button>
                        <button
                            onClick={() => navigator.share?.({ url: window.location.href })}
                            className={isDark ? "text-white" : "text-black"}
                        >
                            <Share2 size={20} />
                        </button>
                    </>
                )}
            </div>
        </header>
    );
});

Header.displayName = 'Header';

