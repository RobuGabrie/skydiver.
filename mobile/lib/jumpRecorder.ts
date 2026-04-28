import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite'

export interface JumpSummary {
  id: string
  deviceId: string
  startedAt: number
  endedAt: number | null
  durationMs: number
  maxAltM: number
  minAltM: number
  maxVSpeedMs: number
  maxGForce: number
  peakBpm: number
  minSpo2: number
  peakStress: number
  sampleCount: number
  gpsStartLat: number | null
  gpsStartLon: number | null
  gpsEndLat: number | null
  gpsEndLon: number | null
}

export interface JumpSample {
  id: number
  jumpId: string
  ts: number
  lat: number | null
  lon: number | null
  altM: number | null
  bpm: number
  spo2: number
  stress: number
  tempC: number
  battPct: number
  rollDeg: number
  pitchDeg: number
  yawDeg: number
  gForce: number
  vSpeedMs: number
  status: string
}

const DB_NAME = 'jumps.db'

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS jumps (
    id TEXT PRIMARY KEY NOT NULL,
    device_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    max_alt_m REAL NOT NULL DEFAULT 0,
    min_alt_m REAL NOT NULL DEFAULT 0,
    max_vspeed_ms REAL NOT NULL DEFAULT 0,
    max_gforce REAL NOT NULL DEFAULT 0,
    peak_bpm REAL NOT NULL DEFAULT 0,
    min_spo2 REAL NOT NULL DEFAULT 100,
    peak_stress REAL NOT NULL DEFAULT 0,
    sample_count INTEGER NOT NULL DEFAULT 0,
    gps_start_lat REAL,
    gps_start_lon REAL,
    gps_end_lat REAL,
    gps_end_lon REAL
  );

  CREATE TABLE IF NOT EXISTS jump_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jump_id TEXT NOT NULL REFERENCES jumps(id) ON DELETE CASCADE,
    ts INTEGER NOT NULL,
    lat REAL,
    lon REAL,
    alt_m REAL,
    bpm REAL NOT NULL DEFAULT 0,
    spo2 REAL NOT NULL DEFAULT 0,
    stress REAL NOT NULL DEFAULT 0,
    temp_c REAL NOT NULL DEFAULT 0,
    batt_pct REAL NOT NULL DEFAULT 0,
    roll_deg REAL NOT NULL DEFAULT 0,
    pitch_deg REAL NOT NULL DEFAULT 0,
    yaw_deg REAL NOT NULL DEFAULT 0,
    gforce REAL NOT NULL DEFAULT 0,
    vspeed_ms REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'standby'
  );

  CREATE INDEX IF NOT EXISTS idx_jump_samples_jump_id ON jump_samples(jump_id);
  CREATE INDEX IF NOT EXISTS idx_jumps_started_at ON jumps(started_at DESC);
`

let dbPromise: Promise<SQLiteDatabase> | null = null

async function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync(DB_NAME)
      await db.execAsync(SCHEMA)
      return db
    })()
  }
  return dbPromise
}

function makeId(): string {
  return 'jump-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
}

export async function startJump(deviceId: string): Promise<string> {
  const db = await getDb()
  const id = makeId()
  await db.runAsync(
    'INSERT INTO jumps (id, device_id, started_at) VALUES (?, ?, ?)',
    [id, deviceId, Date.now()],
  )
  return id
}

export interface RecordSampleInput {
  lat: number | null
  lon: number | null
  altM: number | null
  bpm: number
  spo2: number
  stress: number
  tempC: number
  battPct: number
  rollDeg: number
  pitchDeg: number
  yawDeg: number
  gForce: number
  vSpeedMs: number
  status: string
}

export async function recordJumpSample(jumpId: string, s: RecordSampleInput): Promise<void> {
  const db = await getDb()
  const ts = Date.now()

  await db.runAsync(
    `INSERT INTO jump_samples
     (jump_id, ts, lat, lon, alt_m, bpm, spo2, stress, temp_c, batt_pct,
      roll_deg, pitch_deg, yaw_deg, gforce, vspeed_ms, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      jumpId, ts,
      s.lat ?? null, s.lon ?? null, s.altM ?? null,
      s.bpm, s.spo2, s.stress, s.tempC, s.battPct,
      s.rollDeg, s.pitchDeg, s.yawDeg, s.gForce, s.vSpeedMs, s.status,
    ],
  )

  // Update running stats on the parent jump row
  await db.runAsync(
    `UPDATE jumps SET
       sample_count = sample_count + 1,
       max_alt_m    = MAX(max_alt_m,   COALESCE(?, max_alt_m)),
       min_alt_m    = CASE WHEN sample_count = 0 THEN COALESCE(?, 0)
                          ELSE MIN(min_alt_m, COALESCE(?, min_alt_m)) END,
       max_vspeed_ms = MAX(max_vspeed_ms, ABS(?)),
       max_gforce    = MAX(max_gforce, ?),
       peak_bpm      = MAX(peak_bpm, ?),
       min_spo2      = MIN(min_spo2, ?),
       peak_stress   = MAX(peak_stress, ?),
       gps_start_lat = COALESCE(gps_start_lat, ?),
       gps_start_lon = COALESCE(gps_start_lon, ?),
       gps_end_lat   = COALESCE(?, gps_end_lat),
       gps_end_lon   = COALESCE(?, gps_end_lon)
     WHERE id = ?`,
    [
      s.altM, s.altM, s.altM,
      s.vSpeedMs, s.gForce, s.bpm, s.spo2, s.stress,
      s.lat ?? null, s.lon ?? null,
      s.lat ?? null, s.lon ?? null,
      jumpId,
    ],
  )
}

export async function endJump(jumpId: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('UPDATE jumps SET ended_at = ? WHERE id = ?', [Date.now(), jumpId])
}

export async function listJumps(): Promise<JumpSummary[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM jumps ORDER BY started_at DESC LIMIT 200',
  )
  return rows.map(rowToSummary)
}

export async function getJump(jumpId: string): Promise<JumpSummary | null> {
  const db = await getDb()
  const row = await db.getFirstAsync<any>('SELECT * FROM jumps WHERE id = ?', [jumpId])
  return row ? rowToSummary(row) : null
}

export async function getJumpSamples(jumpId: string): Promise<JumpSample[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM jump_samples WHERE jump_id = ? ORDER BY ts ASC',
    [jumpId],
  )
  return rows.map(rowToSample)
}

export async function deleteJump(jumpId: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM jumps WHERE id = ?', [jumpId])
}

export function exportJumpJson(summary: JumpSummary, samples: JumpSample[]): string {
  return JSON.stringify({ jump: summary, samples }, null, 2)
}

function rowToSummary(r: any): JumpSummary {
  const endedAt = r.ended_at ?? null
  return {
    id: r.id,
    deviceId: r.device_id,
    startedAt: r.started_at,
    endedAt,
    durationMs: endedAt ? endedAt - r.started_at : Date.now() - r.started_at,
    maxAltM: r.max_alt_m,
    minAltM: r.min_alt_m,
    maxVSpeedMs: r.max_vspeed_ms,
    maxGForce: r.max_gforce,
    peakBpm: r.peak_bpm,
    minSpo2: r.min_spo2,
    peakStress: r.peak_stress,
    sampleCount: r.sample_count,
    gpsStartLat: r.gps_start_lat,
    gpsStartLon: r.gps_start_lon,
    gpsEndLat: r.gps_end_lat,
    gpsEndLon: r.gps_end_lon,
  }
}

function rowToSample(r: any): JumpSample {
  return {
    id: r.id,
    jumpId: r.jump_id,
    ts: r.ts,
    lat: r.lat,
    lon: r.lon,
    altM: r.alt_m,
    bpm: r.bpm,
    spo2: r.spo2,
    stress: r.stress,
    tempC: r.temp_c,
    battPct: r.batt_pct,
    rollDeg: r.roll_deg,
    pitchDeg: r.pitch_deg,
    yawDeg: r.yaw_deg,
    gForce: r.gforce,
    vSpeedMs: r.vspeed_ms,
    status: r.status,
  }
}
