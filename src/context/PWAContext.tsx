'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PWAContextType {
    isInstallable: boolean;
    installApp: () => Promise<void>;
    isInstalled: boolean;
    isInstallModalOpen: boolean;
    setIsInstallModalOpen: (open: boolean) => void;
    isOnline: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider = ({ children }: { children: ReactNode }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);

            const handleOnline = () => setIsOnline(true);
            const handleOffline = () => setIsOnline(false);

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Validación de Service Worker explícita para asegurar criterio de PWA
            if ('serviceWorker' in navigator) {
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
            const handleAppInstalled = () => {
                setIsInstallable(false);
                setIsInstalled(true);
                setDeferredPrompt(null);
                setIsInstallModalOpen(false);
            };
            window.addEventListener('appinstalled', handleAppInstalled);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
                window.removeEventListener('appinstalled', handleAppInstalled);
            };
        }
    }, []);

    const installApp = async () => {
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

        // FALLBACK: User Requested UI for Manual Instructions
        setIsInstallModalOpen(true);
    };

    return (
        <PWAContext.Provider value={{
            isInstallable,
            installApp,
            isInstalled,
            isInstallModalOpen,
            setIsInstallModalOpen,
            isOnline
        }}>
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
