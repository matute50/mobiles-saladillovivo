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

    useEffect(() => {
        // 1. Verificar si ya está instalada (standalone mode)
        const checkIsInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as any).standalone
                || document.referrer.includes('android-app://');
            setIsInstalled(isStandalone);
        };

        checkIsInstalled();

        // 2. Capturar el evento de instalación
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 3. Detectar si el usuario instaló la app (limpieza)
        window.addEventListener('appinstalled', () => {
            setIsInstallable(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
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
