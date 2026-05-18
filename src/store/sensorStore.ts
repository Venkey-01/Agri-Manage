import { create } from 'zustand';

interface SensorState {
  moisturePercent: number;
  moistureRaw: number;
  pumpStatus: 'ON' | 'OFF';
  isManualMode: boolean;
  temperatureC?: number;
  humidityPct?: number;
  lastUpdated: Date | null;
  isConnected: boolean;

  setMoistureData: (data: Partial<Pick<SensorState, 'moisturePercent' | 'moistureRaw' | 'pumpStatus' | 'isManualMode' | 'temperatureC' | 'humidityPct'>>) => void;
  setConnected: (connected: boolean) => void;
}


export const useSensorStore = create<SensorState>((set) => ({
  moisturePercent: 0,
  moistureRaw: 0,
  pumpStatus: 'OFF',
  isManualMode: false,
  temperatureC: 0,
  humidityPct: 0,
  lastUpdated: null,
  isConnected: false,

  setMoistureData: (data) => set((state) => ({ 
    ...state, 
    ...data, 
    lastUpdated: new Date() 
  })),
  setConnected: (connected) => set({ isConnected: connected }),
}));
