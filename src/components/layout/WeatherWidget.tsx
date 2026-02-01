'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Cloud, Sun as SunIcon, CloudRain, CloudLightning } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherWidgetProps {
  isDark: boolean;
}

const getWeatherIcon = (iconName: string, size = 24, className = "") => {
  const name = iconName?.toLowerCase() || '';
  if (name.includes('thunder')) return <CloudLightning size={size} className={cn("text-purple-500", className)} />;
  if (name.includes('rain')) return <CloudRain size={size} className={cn("text-blue-500", className)} />;
  if (name.includes('cloudy')) return <Cloud size={size} className={cn("text-blue-400", className)} />;
  if (name.includes('clear')) return <SunIcon size={size} className={cn("text-yellow-400", className)} />;
  return <SunIcon size={size} className={cn("text-yellow-400", className)} />;
};

export const WeatherWidget = React.memo(({ isDark }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<any>(null);
  const [errorText, setErrorText] = useState<string>("");

  useEffect(() => {
    fetch('/api/weather')
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`Error ${res.status}`)))
      .then(data => setWeather(data))
      .catch((err) => setErrorText(err.message));
  }, []);

  const themeBlue = isDark ? "text-[#6699ff]" : "text-[#003399]";

  if (errorText && !weather) return (
    <div className={cn("h-32 flex items-center justify-center rounded-2xl mb-12 border mx-4 opacity-50", isDark ? "bg-neutral-900 border-white/5" : "bg-white border-neutral-100")}>
      <span className="text-[10px] font-black uppercase italic tracking-widest text-center px-4">Clima no disponible</span>
    </div>
  );

  if (!weather) return <div className="h-32 animate-pulse bg-neutral-800/10 rounded-2xl mb-12 mx-4" />;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl mb-12 border shrink-0 mx-4 shadow-xl", isDark ? "bg-neutral-900/40 border-white/5 shadow-2xl" : "bg-white border-neutral-100")}>
      <div className="flex items-center h-32">
        <div className="flex-[0.9] flex flex-col justify-center pl-6 pr-4 border-r border-black/5 dark:border-white/5">
          <div className="flex items-center gap-1.5 opacity-50 mb-1">
            <MapPin size={14} className={themeBlue} />
            <span className={cn("text-[11px] font-black uppercase tracking-[0.2em]", isDark ? "text-white" : "text-black")}>Saladillo</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className={cn("text-6xl font-black italic tracking-tighter leading-none", isDark ? "text-white" : "text-neutral-900")}>{Math.round(weather.currentConditions.temp)}°</h2>
            {getWeatherIcon(weather.currentConditions.icon, 40)}
          </div>
        </div>
        <div className="flex-[1.1] flex justify-between px-4">
          {weather.days.slice(1, 5).map((day: any) => (
            <div key={day.datetime} className="flex flex-col items-center gap-2">
              <span className={cn("text-[11px] font-black uppercase italic opacity-60", isDark ? "text-white" : "text-black")}>
                {new Date(day.datetime + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
              </span>
              {getWeatherIcon(day.icon, 26)}
              <div className="flex flex-col items-center leading-none">
                <span className={cn("text-[14px] font-black italic", isDark ? "text-white" : "text-neutral-900")}>{Math.round(day.tempmax)}°</span>
                <span className="text-[10px] font-bold opacity-30">{Math.round(day.tempmin)}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

WeatherWidget.displayName = 'WeatherWidget';
