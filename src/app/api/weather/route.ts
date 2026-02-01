import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Coordenadas de Saladillo
    const lat = -34.6387;
    const lon = -59.7777;
    
    // Open-Meteo: API gratuita y sin Key con zona horaria de Argentina
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=5`;

    const response = await fetch(url, { next: { revalidate: 1800 } });
    
    if (!response.ok) throw new Error(`OpenMeteo Error: ${response.status}`);

    const data = await response.json();

    // Mapeo detallado de códigos WMO de Open-Meteo a iconos de Saladillo Vivo
    const codeToIcon = (code: number) => {
      // 0, 1, 2: Despejado o principalmente despejado -> Sol
      if (code >= 0 && code <= 2) return 'clear-day';
      // 3: Nublado
      if (code === 3) return 'cloudy';
      // 45, 48: Niebla -> Nubes
      if (code === 45 || code === 48) return 'cloudy';
      // 51 a 67: Llovizna y Lluvia
      if (code >= 51 && code <= 67) return 'rain';
      // 80, 81, 82: Chubascos de lluvia
      if (code >= 80 && code <= 82) return 'rain';
      // 95, 96, 99: Tormentas
      if (code >= 95) return 'thunder';
      
      return 'cloudy'; // Fallback por defecto
    };

    // Normalizamos el formato para mantener compatibilidad con el widget
    const normalizedData = {
      currentConditions: {
        temp: data.current.temperature_2m,
        icon: codeToIcon(data.current.weather_code)
      },
      days: data.daily.time.map((date: string, i: number) => ({
        datetime: date,
        tempmax: data.daily.temperature_2m_max[i],
        tempmin: data.daily.temperature_2m_min[i],
        icon: codeToIcon(data.daily.weather_code[i])
      }))
    };

    return NextResponse.json(normalizedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}