export interface CropData {
  min_moisture: number;
  max_moisture: number;
  min_temp: number;
  max_temp: number;
}

export const CROP_DATABASE: Record<string, CropData> = {
  Rice:       { min_moisture: 70, max_moisture: 100, min_temp: 22, max_temp: 32 },
  Wheat:      { min_moisture: 40, max_moisture: 65,  min_temp: 15, max_temp: 25 },
  Tomato:     { min_moisture: 50, max_moisture: 70,  min_temp: 20, max_temp: 30 },
  Cotton:     { min_moisture: 35, max_moisture: 60,  min_temp: 25, max_temp: 35 },
  Sugarcane:  { min_moisture: 65, max_moisture: 85,  min_temp: 24, max_temp: 34 },
  Groundnut:  { min_moisture: 40, max_moisture: 65,  min_temp: 25, max_temp: 30 },
  Maize:      { min_moisture: 45, max_moisture: 70,  min_temp: 20, max_temp: 32 },
  Onion:      { min_moisture: 50, max_moisture: 70,  min_temp: 13, max_temp: 24 },
  Potato:     { min_moisture: 60, max_moisture: 80,  min_temp: 15, max_temp: 20 },
  Chilli:     { min_moisture: 45, max_moisture: 65,  min_temp: 25, max_temp: 30 },
  Brinjal:    { min_moisture: 50, max_moisture: 70,  min_temp: 22, max_temp: 32 },
  Okra:       { min_moisture: 45, max_moisture: 65,  min_temp: 25, max_temp: 35 },
  Sunflower:  { min_moisture: 40, max_moisture: 65,  min_temp: 20, max_temp: 30 },
  Soybean:    { min_moisture: 50, max_moisture: 70,  min_temp: 20, max_temp: 30 },
  Cucumber:   { min_moisture: 60, max_moisture: 80,  min_temp: 22, max_temp: 30 },
};

export const GROWTH_STAGE_MULTIPLIER: Record<string, number> = {
  Seedling:   0.7,
  Vegetative: 1.0,
  Flowering:  1.3,
  Fruiting:   1.2,
  Harvest:    0.5,
};

// Soil drainage factor — affects how long to irrigate
export const SOIL_DRAINAGE: Record<string, number> = {
  Sandy: 1.4,   // drains fast, irrigate longer
  Loamy: 1.0,
  Silty: 0.9,
  Clay:  0.7,   // retains water, irrigate shorter
};
