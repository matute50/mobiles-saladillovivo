'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface WeatherContextType {
    weather: any;
    errorText: string;
    isExtendedOpen: boolean;
    setIsExtendedOpen: (open: boolean) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider = ({ children }: { children: ReactNode }) => {
    const [weather, setWeather] = useState<any>(null);
    const [errorText, setErrorText] = useState<string>("");
    const [isExtendedOpen, setIsExtendedOpen] = useState(false);

    useEffect(() => {
        let refreshInterval: NodeJS.Timeout;

        const fetchWeather = async (query?: string) => {
            try {
                const url = query ? `/api/weather?q=${query}` : '/api/weather';
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error(`Weather error: ${res.status}`);
                const data = await res.json();
                setWeather(data);
                setErrorText("");
            } catch (err: any) {
                console.error("[WeatherContext] Fetch failed:", err);
                setErrorText(err.message);
            }
        };

        const tryGeolocationAndStartInterval = async () => {
            let lastQuery: string | undefined;

            // Intento inicial
            if ("geolocation" in navigator) {
                try {
                    // Verificamos si tenemos permiso explícito para no pedirlo de nuevo si ya fue denegado
                    const status = await navigator.permissions.query({ name: 'geolocation' });
                    if (status.state === 'granted') {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const { latitude, longitude } = position.coords;
                                lastQuery = `${latitude},${longitude}`;
                                fetchWeather(lastQuery);
                            },
                            () => fetchWeather(),
                            { timeout: 5000 }
                        );
                    } else {
                        fetchWeather();
                    }
                } catch (e) {
                    fetchWeather();
                }
            } else {
                fetchWeather();
            }

            // v25.3: Actualización automática cada 30 minutos
            refreshInterval = setInterval(() => {
                fetchWeather(lastQuery);
            }, 1800000); // 30 min
        };

        tryGeolocationAndStartInterval();

        return () => {
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, []);

    return (
        <WeatherContext.Provider value={{ weather, errorText, isExtendedOpen, setIsExtendedOpen }}>
            {children}
        </WeatherContext.Provider>
    );
};

export const useWeather = () => {
    const context = useContext(WeatherContext);
    if (context === undefined) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return context;
};
