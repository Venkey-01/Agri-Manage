import { AIInput, AIOutput, runRuleBasedEngine } from './ruleEngine';

// MODEL_META includes feature list and categories
let MODEL_META: any;
try {
  MODEL_META = require('../../assets/model_meta.json');
} catch {
  MODEL_META = { features: [], crops: [], stages: [], soils: [], labels: [] };
}

let model: any = null;
let tfModule: any = null;

async function loadTFDeps() {
  if (tfModule) return true;
  try {
    tfModule = require('@tensorflow/tfjs');
    // Ensure we are in a ready state
    await tfModule.ready();
    // FORCE CPU BACKEND: This prevents the 'libexpo-gl.so' native crash 
    // while keeping the "Accuracy" of your TFLite model!
    await tfModule.setBackend('cpu');
    console.log('TFJS using CPU backend for stability');
    return true;
  } catch (e) {
    console.warn('TensorFlow CPU initialization failed:', e);
    tfModule = null;
    return false;
  }
}

export async function loadTFLiteModel() {
  const depsLoaded = await loadTFDeps();
  if (!depsLoaded) return;

  try {
    const { bundleResourceIO } = require('@tensorflow/tfjs-react-native');
    const modelJSON    = require('../../assets/model/model.json');
    const modelWeights = require('../../assets/model/group1-shard1of1.bin');
    model = await tfModule.loadGraphModel(bundleResourceIO(modelJSON, [modelWeights]));
    console.log('TFLite model loaded');
  } catch (e) {
    console.warn('TFLite model files not found:', e);
  }
}

function encodeInput(input: AIInput): number[] {
  if (!MODEL_META.crops.length) return Array(14).fill(0);

  return [
    Math.max(0, MODEL_META.crops.indexOf(input.crop)),
    Math.max(0, MODEL_META.stages.indexOf(input.growth_stage)),
    Math.max(0, MODEL_META.soils.indexOf(input.soil_type)),
    input.soil_moisture_percent,
    input.temperature_c,
    input.humidity_percent,
    input.precipitation_next_24h_mm,
    input.precipitation_past_24h_mm,
    input.precipitation_probability,
    input.evapotranspiration_mm,
    input.wind_speed_kmh,
    input.time_since_last_irrigation_hours,
    input.uv_index,
    50, // light_pct default
  ];
}

export async function runTFLiteInference(input: AIInput): Promise<AIOutput> {
  if (!model) {
    await loadTFLiteModel();
  }

  if (!model || !tfModule) {
    return { ...runRuleBasedEngine(input), tier: 'rule' };
  }

  const encoded     = encodeInput(input);
  const inputTensor = tfModule.tensor2d([encoded]);
  const output      = model.predict(inputTensor);
  const probs       = await output.data() as Float32Array;

  inputTensor.dispose();
  output.dispose();

  const maxIdx   = Array.from(probs).indexOf(Math.max(...Array.from(probs)));
  const actions  = ['SKIP', 'MONITOR', 'IRRIGATE'] as const;
  const action   = actions[maxIdx];
  const confidence = probs[maxIdx];

  return {
    action,
    confidence,
    reason:                    `TFLite model: ${action} (${(confidence * 100).toFixed(1)}% confidence)`,
    suggested_duration_minutes: action === 'IRRIGATE' ? 20 : 0,
    next_check_hours:           action === 'IRRIGATE' ? 2 : 4,
    tier:                       'tflite',
  };
}
