import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lat = -34.6691;
    const lon = -59.7775;

    console.log(`[Weather API] Fetching from Open-Meteo for Saladillo (${lat}, ${lon})...`);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Argentina/Buenos_Aires&forecast_days=7`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Weather API] Open-Meteo Error: ${response.status} - ${errorText}`);
      throw new Error(`Open-Meteo Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Weather API] Success: Data received for ${data.current_weather?.time}`);

    // Mapeo de códigos WMO de Open-Meteo a iconos de Saladillo Vivo
    const codeToIcon = (code: number) => {
      if (code === 0) return 'clear-day';
      if ([1, 2, 3, 45, 48].includes(code)) return 'cloudy';
      if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';
      if ([95, 96, 99].includes(code)) return 'thunder';
      return 'cloudy';
    };

    const normalizedData = {
      location: {
        name: 'Saladillo',
        region: 'Buenos Aires'
      },
      currentConditions: {
        temp: data.current_weather.temperature,
        icon: codeToIcon(data.current_weather.weathercode)
      },
      days: data.daily.time.map((time: string, i: number) => ({
        datetime: time,
        tempmax: data.daily.temperature_2m_max[i],
        tempmin: data.daily.temperature_2m_min[i],
        icon: codeToIcon(data.daily.weather_code[i])
      })),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(normalizedData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error(`[Weather API] Internal Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
