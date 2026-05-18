import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  esp32IP:              string;
  esp32Token:           string;
  latitude:             number;
  longitude:            number;
  locationName:         string;
  // AI mode — no paid API option
  aiMode:               'rule-engine' | 'tflite' | 'local-llm';
  ollamaURL:            string;
  ollamaModel:          string;
  moistureThreshold:    number;
  notificationsEnabled: boolean;
  theme:                'light' | 'dark' | 'auto';
  isOnboarded:          boolean;

  // Farm Profile
  selectedCrop:         string;
  selectedSoilType:     string;
  selectedGrowthStage:  string;

  updateSettings: (partial: Partial<SettingsState>) => void;
  setLocation:    (lat: number, lon: number, name: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      esp32IP:              '192.168.1.100',
      esp32Token:           '',
      latitude:              16.5062,
      longitude:             80.6480,
      locationName:         'Amaravati',
      aiMode:               'tflite',
      ollamaURL:            'http://192.168.1.50:11434',
      ollamaModel:          'phi3:mini',
      moistureThreshold:     40,
      notificationsEnabled:  true,
      theme:                'auto',
      isOnboarded:           false,
      selectedCrop:         'Tomato',
      selectedSoilType:     'Loamy',
      selectedGrowthStage:  'Vegetative',

      updateSettings: (partial) => set((s) => ({ ...s, ...partial })),
      setLocation:    (lat, lon, name) =>
        set({ latitude: lat, longitude: lon, locationName: name }),
    }),
    { name: 'irrigation-settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
