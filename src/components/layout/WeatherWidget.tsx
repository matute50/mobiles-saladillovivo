'use client';
import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Wind, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WeatherWidget({ isDark }: { isDark: boolean }) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Usando una API gratuita como Open-Meteo que no requiere Key para pruebas
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`);
          const data = await res.json();
          setWeather(data.current_weather);
        } catch (error) {
          console.error("Error fetching weather", error);
        } finally {
          setLoading(false);
        }
      });
    }
  }, []);

  if (loading) return <div className="h-20 animate-pulse bg-neutral-800/20 rounded-xl" />;
  if (!weather) return null;

  const themeColor = isDark ? "text-[#6699ff]" : "text-[#003399]";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-4 mb-4 border transition-all",
      isDark ? "bg-neutral-900/50 border-white/10" : "bg-white border-neutral-200 shadow-sm"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1 opacity-70">
            <MapPin size={12} className={themeColor} />
            <span className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white" : "text-black")}>
              Clima Local
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className={cn("text-4xl font-black italic tracking-tighter", isDark ? "text-white" : "text-neutral-900")}>
              {Math.round(weather.temperature)}°
            </h2>
            <span className={cn("text-xs font-bold uppercase italic opacity-60", themeColor)}>
              Saladillo
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          {weather.weathercode < 3 ? <Sun className="text-yellow-400" size={42} /> : <Cloud className={themeColor} size={42} />}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Wind size={14} className="opacity-50" />
              <span className="text-[11px] font-bold">{weather.windspeed} km/h</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detalle decorativo similar a tus otros bloques */}
      <div className={cn("absolute bottom-0 left-0 h-1 w-full", isDark ? "bg-[#6699ff]/20" : "bg-[#003399]/10")} />
    </div>
  );
}