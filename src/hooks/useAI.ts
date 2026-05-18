import { useState } from 'react';
import { getAIDecision } from '@/services/ai.service';
import { useSensorStore } from '@/store/sensorStore';
import { useWeatherStore } from '@/store/weatherStore';
import { useSettingsStore } from '@/store/settingsStore';
import { AIOutput } from '@/ml/ruleEngine';

export function useAI() {
  const { moisturePercent, temperatureC, humidityPct } = useSensorStore();
  const { current: weather } = useWeatherStore();
  const { 
    selectedCrop, selectedGrowthStage, selectedSoilType 
  } = useSettingsStore();
  const [decision, setDecision] = useState<AIOutput | null>(null);
  const [loading, setLoading] = useState(false);

  async function runAnalysis() {
    if (!weather || moisturePercent === 0) return;

    setLoading(true);
    try {
      const result = await getAIDecision({
        crop: selectedCrop,
        growth_stage: selectedGrowthStage,
        soil_type: selectedSoilType,
        soil_moisture_percent: moisturePercent,
        temperature_c: temperatureC || weather.current.temperature,
        humidity_percent: humidityPct || weather.current.humidity,
        precipitation_next_24h_mm: weather.computed.next_24h_precip_mm,
        precipitation_past_24h_mm: weather.computed.past_24h_precip_mm,
        precipitation_probability: weather.computed.avg_rain_probability,
        evapotranspiration_mm: weather.computed.daily_et0_mm,
        wind_speed_kmh: weather.current.wind_speed,
        time_since_last_irrigation_hours: 12, // Placeholder
        uv_index: weather.current.uv_index,
      });
      setDecision(result);
    } catch (e) {
      console.error('AI Analysis failed:', e);
    } finally {
      setLoading(false);
    }
  }

  return { decision, loading, runAnalysis };
}
