import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherData } from '../store/weatherStore';

const BASE_URL  = 'https://api.open-meteo.com/v1/forecast';
const CACHE_KEY = 'weather_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const cached = await getCachedWeather();
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude:       String(lat),
    longitude:      String(lon),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'uv_index',
      'surface_pressure',
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'precipitation',
      'evapotranspiration',
      'soil_temperature_0cm',
      'soil_moisture_0_1cm',
      'soil_moisture_1_3cm',
      'soil_moisture_3_9cm',
      'wind_speed_10m',
    ].join(','),
    daily: [
      'precipitation_sum',
      'et0_fao_evapotranspiration',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'uv_index_max',
    ].join(','),
    timezone:     'Asia/Kolkata',
    forecast_days: '3',
    past_days:    '1',
  });

  const { data } = await axios.get(`${BASE_URL}?${params}`, { timeout: 10000 });
  const parsed = parseWeatherResponse(data);

  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
    data: parsed, timestamp: Date.now(),
  }));

  return parsed;
}

async function getCachedWeather(): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_TTL) return data;
    return null;
  } catch { return null; }
}

function parseWeatherResponse(raw: any): WeatherData {
  const c = raw.current;
  const h = raw.hourly;
  const d = raw.daily;

  const next6hPrecip  = h.precipitation.slice(0, 6).reduce((s: number, v: number) => s + v, 0);
  const next24hPrecip = h.precipitation.slice(0, 24).reduce((s: number, v: number) => s + v, 0);
  const past24hPrecip = h.precipitation.slice(-24).reduce((s: number, v: number) => s + v, 0);
  const avgRainProb   = h.precipitation_probability.slice(0, 12).reduce((a: number, b: number) => a + b, 0) / 12;
  const avgET0        = h.evapotranspiration.slice(0, 24).reduce((a: number, b: number) => a + b, 0);
  const soilMoistureAPI = h.soil_moisture_0_1cm[0] * 100;

  return {
    current: {
      temperature:   c.temperature_2m,
      humidity:      c.relative_humidity_2m,
      feels_like:    c.apparent_temperature,
      precipitation: c.precipitation,
      weather_code:  c.weather_code,
      wind_speed:    c.wind_speed_10m,
      uv_index:      c.uv_index,
      pressure:      c.surface_pressure,
    },
    hourly: {
      precipitation_probability: h.precipitation_probability,
      evapotranspiration:        h.evapotranspiration,
      soil_moisture_api:         h.soil_moisture_0_1cm.map((v: number) => v * 100),
      soil_temperature:          h.soil_temperature_0cm,
    },
    daily: {
      precipitation_sum:       d.precipitation_sum,
      et0_evapotranspiration:  d.et0_fao_evapotranspiration,
      temp_max:                d.temperature_2m_max,
      temp_min:                d.temperature_2m_min,
      rain_probability_max:    d.precipitation_probability_max,
      uv_index_max:            d.uv_index_max,
    },
    computed: {
      next_6h_precip_mm:    next6hPrecip,
      next_24h_precip_mm:   next24hPrecip,
      past_24h_precip_mm:   past24hPrecip,
      avg_rain_probability: avgRainProb,
      daily_et0_mm:         avgET0,
      soil_moisture_api_pct: soilMoistureAPI,
    },
  };
}

export function getWeatherDescription(code: number): string {
  const codes: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail',
  };
  return codes[code] ?? 'Unknown';
}
