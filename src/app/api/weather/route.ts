import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const API_KEY = 'b9fd6909428741cc9aa182830260102';
    const city = 'Saladillo,Buenos Aires,Argentina';

    // WeatherAPI.com: Más preciso y con soporte para búsqueda por ciudad
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=5&aqi=no&alerts=no&lang=es`;

    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) throw new Error(`WeatherAPI Error: ${response.status}`);

    const data = await response.json();

    // Mapeo de condiciones de WeatherAPI a iconos de Saladillo Vivo
    const conditionToIcon = (text: string) => {
      const t = text.toLowerCase();
      if (t.includes('sol') || t.includes('despejado') || t.includes('sunny') || t.includes('clear')) return 'clear-day';
      if (t.includes('nublado') || t.includes('nubes') || t.includes('cloudy') || t.includes('overcast')) return 'cloudy';
      if (t.includes('lluvia') || t.includes('llovizna') || t.includes('rain') || t.includes('drizzle')) return 'rain';
      if (t.includes('tormenta') || t.includes('thunder') || t.includes('storm')) return 'thunder';

      return 'cloudy';
    };

    // Normalizamos el formato para mantener compatibilidad con el widget
    const normalizedData = {
      location: {
        name: data.location.name,
        region: data.location.region
      },
      currentConditions: {
        temp: data.current.temp_c,
        icon: conditionToIcon(data.current.condition.text)
      },
      days: data.forecast.forecastday.map((day: any) => ({
        datetime: day.date,
        tempmax: day.day.maxtemp_c,
        tempmin: day.day.mintemp_c,
        icon: conditionToIcon(day.day.condition.text)
      }))
    };

    return NextResponse.json(normalizedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
