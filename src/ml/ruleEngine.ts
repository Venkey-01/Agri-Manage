import { CROP_DATABASE, GROWTH_STAGE_MULTIPLIER, SOIL_DRAINAGE } from '@/constants/crops';

export interface AIInput {
  crop:                             string;
  growth_stage:                     string;
  soil_type:                        string;
  soil_moisture_percent:            number;
  temperature_c:                    number;
  humidity_percent:                 number;
  precipitation_next_24h_mm:        number;
  precipitation_past_24h_mm:        number;
  precipitation_probability:        number;
  evapotranspiration_mm:            number;
  wind_speed_kmh:                   number;
  time_since_last_irrigation_hours: number;
  uv_index:                         number;
}

export interface AIOutput {
  action:                    'IRRIGATE' | 'SKIP' | 'MONITOR';
  confidence:                number;
  reason:                    string;
  suggested_duration_minutes: number;
  next_check_hours:          number;
  tier:                      'rule' | 'tflite' | 'local-llm';
}

export function runRuleBasedEngine(input: AIInput): AIOutput {
  const cropData  = CROP_DATABASE[input.crop];
  const stageMult = GROWTH_STAGE_MULTIPLIER[input.growth_stage] ?? 1.0;
  const drainMult = SOIL_DRAINAGE[input.soil_type] ?? 1.0;

  if (!cropData) {
    return {
      action: 'MONITOR', confidence: 0.5, tier: 'rule',
      reason: 'Unknown crop type — defaulting to monitor.',
      suggested_duration_minutes: 0, next_check_hours: 2,
    };
  }

  const effectiveMin = cropData.min_moisture * stageMult;
  const effectiveMax = cropData.max_moisture;
  const moisture     = input.soil_moisture_percent;
  const reasons: string[] = [];

  // Skip if it rained recently
  if (input.precipitation_past_24h_mm > 8) {
    return {
      action: 'SKIP', confidence: 0.92, tier: 'rule',
      reason: `${input.precipitation_past_24h_mm.toFixed(1)}mm of rain in the last 24 hours — soil should be adequately moistened.`,
      suggested_duration_minutes: 0, next_check_hours: 8,
    };
  }

  // Skip if rain is forecast
  if (input.precipitation_next_24h_mm > 5 || input.precipitation_probability > 70) {
    reasons.push(`Rain expected (${input.precipitation_next_24h_mm.toFixed(1)}mm, ${input.precipitation_probability.toFixed(0)}% probability).`);
    return {
      action: 'SKIP', confidence: 0.88, tier: 'rule',
      reason: reasons.join(' ') + ' Skipping irrigation.',
      suggested_duration_minutes: 0, next_check_hours: 6,
    };
  }

  // Skip if already saturated
  if (moisture > effectiveMax) {
    return {
      action: 'SKIP', confidence: 0.95, tier: 'rule',
      reason: `Soil moisture (${moisture}%) exceeds maximum threshold (${effectiveMax}%) for ${input.crop}.`,
      suggested_duration_minutes: 0, next_check_hours: 4,
    };
  }

  // Irrigate if critically dry
  if (moisture < effectiveMin) {
    reasons.push(`Soil moisture (${moisture.toFixed(1)}%) is below optimal minimum (${effectiveMin.toFixed(1)}%) for ${input.crop} in ${input.growth_stage} stage.`);

    if (input.precipitation_probability < 40) {
      if (input.evapotranspiration_mm > 4)
        reasons.push(`High evapotranspiration (${input.evapotranspiration_mm}mm/day).`);
      if (input.temperature_c > 35)
        reasons.push(`High temperature (${input.temperature_c}°C) stressing crop.`);
      if (input.uv_index > 8)
        reasons.push(`High UV index (${input.uv_index}) accelerating evaporation.`);

      const drynessFactor = (effectiveMin - moisture) / effectiveMin;
      const etFactor      = Math.min(input.evapotranspiration_mm / 5, 2);
      const duration      = Math.round(
        15 * (1 + drynessFactor) * (1 + etFactor * 0.3) * stageMult * drainMult
      );

      return {
        action: 'IRRIGATE',
        confidence: Math.min(0.90 + drynessFactor * 0.1, 0.99),
        tier: 'rule',
        reason: reasons.join(' '),
        suggested_duration_minutes: Math.min(duration, 60),
        next_check_hours: 2,
      };
    }

    reasons.push(`Rain possible (${input.precipitation_probability}% probability) — monitoring.`);
    return {
      action: 'MONITOR', confidence: 0.75, tier: 'rule',
      reason: reasons.join(' '),
      suggested_duration_minutes: 0, next_check_hours: 3,
    };
  }

  // Watch for upcoming stress
  const nearDry = moisture < effectiveMin * 1.15;
  if (nearDry && input.evapotranspiration_mm > 4 && input.temperature_c > 33) {
    return {
      action: 'MONITOR', confidence: 0.70, tier: 'rule',
      reason: `Moisture (${moisture.toFixed(1)}%) near lower threshold. High ET₀ (${input.evapotranspiration_mm}mm) and temperature (${input.temperature_c}°C) may deplete soon.`,
      suggested_duration_minutes: 0, next_check_hours: 2,
    };
  }

  return {
    action: 'SKIP', confidence: 0.85, tier: 'rule',
    reason: `Soil moisture (${moisture.toFixed(1)}%) is within optimal range (${effectiveMin.toFixed(0)}–${effectiveMax}%) for ${input.crop}.`,
    suggested_duration_minutes: 0, next_check_hours: 4,
  };
}
