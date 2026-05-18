import { AIInput, AIOutput, runRuleBasedEngine } from './ruleEngine';
import { useSettingsStore } from '@/store/settingsStore';

export async function runLocalLLM(input: AIInput): Promise<AIOutput> {
  const { ollamaURL, ollamaModel } = useSettingsStore.getState();

  const prompt = `You are an expert irrigation advisor for Indian agriculture.

Given these sensor and weather readings, decide whether to irrigate.
Respond ONLY with valid JSON — no explanation, no markdown.

Crop: ${input.crop}
Growth stage: ${input.growth_stage}
Soil type: ${input.soil_type}
Soil moisture: ${input.soil_moisture_percent.toFixed(1)}%
Temperature: ${input.temperature_c.toFixed(1)}°C
Humidity: ${input.humidity_percent.toFixed(0)}%
Rain next 24h: ${input.precipitation_next_24h_mm.toFixed(1)}mm (${input.precipitation_probability.toFixed(0)}% probability)
Rain last 24h: ${input.precipitation_past_24h_mm.toFixed(1)}mm
Evapotranspiration: ${input.evapotranspiration_mm.toFixed(1)}mm/day
Wind speed: ${input.wind_speed_kmh.toFixed(0)} km/h
Hours since last irrigation: ${input.time_since_last_irrigation_hours.toFixed(0)}
UV index: ${input.uv_index.toFixed(0)}

Respond with this exact JSON format:
{
  "action": "IRRIGATE" | "SKIP" | "MONITOR",
  "confidence": 0.0 to 1.0,
  "reason": "one sentence explanation",
  "suggested_duration_minutes": 0 to 60,
  "next_check_hours": 1 to 12
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await fetch(`${ollamaURL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,    // low temperature = more consistent JSON
          top_p: 0.9,
          num_predict: 200,
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);

    const data = await response.json();
    const text = data.response?.trim() ?? '';

    // Strip markdown fences if model adds them
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      action: parsed.action,
      confidence: parsed.confidence,
      reason:                    parsed.reason,
      suggested_duration_minutes: parsed.suggested_duration_minutes ?? 0,
      next_check_hours:          parsed.next_check_hours ?? 4,
      tier:                      'local-llm',
    };

  } catch (error) {
    clearTimeout(timeout);
    console.warn('Local LLM failed, falling back to rule engine:', error);
    return { ...runRuleBasedEngine(input), tier: 'tflite' }; // Internal fallback
  }
}
