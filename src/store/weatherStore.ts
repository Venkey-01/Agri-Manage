import { create } from 'zustand';

export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    feels_like: number;
    precipitation: number;
    weather_code: number;
    wind_speed: number;
    uv_index: number;
    pressure: number;
  };
  hourly: {
    precipitation_probability: number[];
    evapotranspiration: number[];
    soil_moisture_api: number[];
    soil_temperature: number[];
  };
  daily: {
    precipitation_sum: number[];
    et0_evapotranspiration: number[];
    temp_max: number[];
    temp_min: number[];
    rain_probability_max: number[];
    uv_index_max: number[];
  };
  computed: {
    next_6h_precip_mm: number;
    next_24h_precip_mm: number;
    past_24h_precip_mm: number;
    avg_rain_probability: number;
    daily_et0_mm: number;
    soil_moisture_api_pct: number;
  };
}

interface WeatherState {
  current: WeatherData | null;
  lastFetched: Date | null;
  setWeatherData: (data: WeatherData) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  current: null,
  lastFetched: null,
  setWeatherData: (data) => set({ current: data, lastFetched: new Date() }),
}));
