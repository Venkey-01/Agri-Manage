import axios from 'axios';
import { useSettingsStore } from '@/store/settingsStore';
import { writePumpCommand } from './firebase.service';
import { insertPumpLog } from '@/database/queries';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function getBaseURL() { 
  const ip = useSettingsStore.getState().esp32IP;
  return `http://${ip}`; 
}

function getHeaders() { 
  const token = useSettingsStore.getState().esp32Token;
  return token ? { 'X-Auth-Token': token } : {}; 
}

export async function getSensorData() {
  const res = await axios.get(`${getBaseURL()}/sensor`, {
    headers: getHeaders(), timeout: 5000,
  });
  return res.data as {
    moisture_raw:     number;
    moisture_percent: number;
    pump_status:      'ON' | 'OFF';
    timestamp:        number;
  };
}


export async function pingESP32(ip?: string, token?: string): Promise<boolean> {
  try {
    const baseURL = ip ? `http://${ip}` : getBaseURL();
    const headers = token ? { 'X-Auth-Token': token } : getHeaders();
    await axios.get(`${baseURL}/ping`, { headers, timeout: 3000 });
    return true;
  } catch { return false; }
}

export async function controlPump(
  action: 'ON' | 'OFF',
  trigger: 'manual' | 'ai' | 'schedule' = 'manual'
): Promise<boolean> {
  try {
    // We now control primarily via Firebase
    await writePumpCommand(action);
    insertPumpLog(action, trigger);
    return true;
  } catch (e) {
    console.warn('Firebase pump control failed:', e);
    return false;
  }
}

export async function setIrrigationMode(isManual: boolean) {
  const { writeIrrigationMode } = await import('./firebase.service');
  return writeIrrigationMode(isManual);
}

export async function setMoistureThreshold(value: number) {
  const { writeThreshold } = await import('./firebase.service');
  return writeThreshold(value);
}


// Safety: auto-shutoff after 30 minutes
let pumpTimer: ReturnType<typeof setTimeout> | null = null;

export function trackPumpStart() {
  pumpTimer = setTimeout(async () => {
    console.warn('Safety shutoff — pump running too long');
    await controlPump('OFF', 'schedule');
    pumpTimer = null;
  }, 30 * 60 * 1000);
}

export function trackPumpStop() {
  if (pumpTimer) { clearTimeout(pumpTimer); pumpTimer = null; }
}
