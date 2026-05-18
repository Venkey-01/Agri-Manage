import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('irrigation.db');

export function initializeDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      moisture_pct  REAL    NOT NULL,
      moisture_raw  INTEGER NOT NULL,
      temperature_c REAL,
      humidity_pct  REAL,
      pump_status   TEXT    NOT NULL DEFAULT 'OFF',
      zone_id       INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_decisions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      action          TEXT    NOT NULL,
      confidence      REAL    NOT NULL,
      reason          TEXT    NOT NULL,
      tier            TEXT    NOT NULL DEFAULT 'rule',
      duration_min    INTEGER,
      next_check_hrs  INTEGER,
      crop_id         TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS crop_profiles (
      id              TEXT    PRIMARY KEY,
      name            TEXT    NOT NULL,
      growth_stage    TEXT    NOT NULL,
      min_moisture    REAL    NOT NULL,
      max_moisture    REAL    NOT NULL,
      min_temp        REAL    NOT NULL,
      max_temp        REAL    NOT NULL,
      soil_type       TEXT    NOT NULL,
      irr_frequency   TEXT    NOT NULL,
      is_active       INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pump_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      action      TEXT    NOT NULL,
      trigger     TEXT    NOT NULL,
      duration_s  INTEGER,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sensor_created   ON sensor_readings(created_at);
    CREATE INDEX IF NOT EXISTS idx_decisions_created ON ai_decisions(created_at);
    CREATE INDEX IF NOT EXISTS idx_pump_created     ON pump_log(created_at);
  `);
}
