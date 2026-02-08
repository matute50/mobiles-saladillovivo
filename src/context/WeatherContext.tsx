'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

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
        const fetchWeather = (query?: string) => {
            const url = query ? `/api/weather?q=${query}` : '/api/weather';
            fetch(url)
                .then(res => res.ok ? res.json() : Promise.reject(new Error(`Error ${res.status}`)))
                .then(data => setWeather(data))
                .catch((err) => setErrorText(err.message));
        };

        const tryGeolocation = async () => {
            if ("geolocation" in navigator && "permissions" in navigator) {
                try {
                    const status = await navigator.permissions.query({ name: 'geolocation' });
                    // Solo pedir si ya tenemos permiso o si no se ha preguntado (para no forzar el gesto)
                    // En realidad, "granted" es lo único seguro para evitar el violation sin gesto.
                    if (status.state === 'granted') {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const { latitude, longitude } = position.coords;
                                fetchWeather(`${latitude},${longitude}`);
                            },
                            () => fetchWeather(),
                            { timeout: 5000 }
                        );
                        return;
                    }
                } catch (e) {
                    console.error("Error checking geolocation permission:", e);
                }
            }
            // Fallback por defecto (Saladillo)
            fetchWeather();
        };

        tryGeolocation();
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
