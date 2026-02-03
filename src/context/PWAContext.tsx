'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PWAContextType {
    isInstallable: boolean;
    installApp: () => Promise<void>;
    isInstalled: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider = ({ children }: { children: ReactNode }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Validación de Service Worker explícita para asegurar criterio de PWA
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .catch(err => console.error('SW Failed:', err));
        }

        const checkIsInstalled = () => {
            return window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as any).standalone
                || document.referrer.includes('android-app://');
        };

        const isStandalone = checkIsInstalled();
        setIsInstalled(isStandalone);

        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const android = /android/.test(userAgent);
        setIsIOS(ios);

        // SOLO forzamos visibilidad si es móvil y no es standalone
        if (!isStandalone && (ios || android)) {
            setIsInstallable(true);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => {
            setIsInstallable(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const installApp = async () => {
        const userAgent = window.navigator.userAgent.toLowerCase();

        // Si tenemos el prompt nativo, lo usamos (Instalación Directa)
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    setDeferredPrompt(null);
                    setIsInstallable(false);
                }
            } catch (err) {
                console.error("PWA Install Error:", err);
            }
            return;
        }

        // FALLBACK: Solo si no hay prompt nativo
        if (/iphone|ipad|ipod/.test(userAgent)) {
            alert('Para instalar: Toca "Compartir" y selecciona "Agregar a Inicio" 📲');
        } else if (/android/.test(userAgent)) {
            // Simplificado: Intentamos guiar al menú si no funcionó el directo
            alert('Instalación desde menú: Toca los tres puntos (⋮) y elige "Instalar aplicación" 📲');
        } else {
            alert('Usa la opción "Instalar" de tu navegador 📲');
        }
    };

    return (
        <PWAContext.Provider value={{ isInstallable, installApp, isInstalled }}>
            {children}
        </PWAContext.Provider>
    );
};

export const usePWA = () => {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
};
