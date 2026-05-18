import { db } from './schema';

export function insertSensorReading(
  moisture_pct: number,
  moisture_raw: number,
  pump_status: string,
  temperature_c?: number,
  humidity_pct?: number
) {
  db.runSync(
    'INSERT INTO sensor_readings (moisture_pct, moisture_raw, pump_status, temperature_c, humidity_pct) VALUES (?, ?, ?, ?, ?)',
    [moisture_pct, moisture_raw, pump_status, temperature_c ?? null, humidity_pct ?? null]
  );
}

export function insertAIDecision(data: {
  action: string;
  confidence: number;
  reason: string;
  tier: string;
  duration_min: number;
  next_check_hrs: number;
}) {
  db.runSync(
    'INSERT INTO ai_decisions (action, confidence, reason, tier, duration_min, next_check_hrs) VALUES (?, ?, ?, ?, ?, ?)',
    [
      data.action ?? null,
      data.confidence ?? null,
      data.reason ?? null,
      data.tier ?? null,
      data.duration_min ?? null,
      data.next_check_hrs ?? null
    ]
  );
}

export function insertPumpLog(action: string, trigger: string, duration_s?: number) {
  db.runSync(
    'INSERT INTO pump_log (action, trigger, duration_s) VALUES (?, ?, ?)',
    [action, trigger, duration_s ?? 0]
  );
}

export function getSensorReadingsLast7Days() {
  return db.getAllSync<any>(
    "SELECT * FROM sensor_readings WHERE created_at > datetime('now', '-7 days') ORDER BY created_at ASC"
  );
}

export function getAIDecisionsLast30Days() {
  return db.getAllSync<any>(
    "SELECT * FROM ai_decisions WHERE created_at > datetime('now', '-30 days') ORDER BY created_at DESC"
  );
}

export function getPumpRuntimePerDay() {
  return db.getAllSync<any>(
    `SELECT date(created_at) as date, SUM(duration_s) as total_seconds 
     FROM pump_log 
     WHERE created_at > datetime('now', '-7 days') 
     GROUP BY date(created_at)
     ORDER BY date ASC`
  );
}

export function getLatestSensorReading() {
  return db.getFirstSync<any>(
    'SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 1'
  );
}
