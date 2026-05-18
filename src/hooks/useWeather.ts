import { useState } from 'react';
import { fetchWeatherData } from '@/services/weather.service';
import { useWeatherStore } from '@/store/weatherStore';
import { useSettingsStore } from '@/store/settingsStore';

export function useWeather() {
  const { setWeatherData } = useWeatherStore();
  const { latitude, longitude } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchWeather() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherData(latitude, longitude);
      setWeatherData(data);
    } catch (e) {
      setError('Failed to fetch weather data');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return { fetchWeather, loading, error };
}
