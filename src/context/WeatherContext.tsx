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

        // Intentar geolocalización
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchWeather(`${latitude},${longitude}`);
                },
                () => {
                    // Fallback a Saladillo (sin query) si el usuario deniega o hay error
                    fetchWeather();
                },
                { timeout: 5000 }
            );
        } else {
            fetchWeather();
        }
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
