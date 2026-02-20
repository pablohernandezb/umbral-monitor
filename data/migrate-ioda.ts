/**
 * IODA Table Migration
 * Creates ioda_signals and ioda_events tables in Supabase.
 *
 * Usage: npx tsx data/migrate-ioda.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

const SQL = `
CREATE TABLE IF NOT EXISTS ioda_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_code TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  bgp DOUBLE PRECISION,
  probing DOUBLE PRECISION,
  telescope DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_code, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_ioda_signals_lookup
  ON ioda_signals(entity_type, entity_code, timestamp DESC);

ALTER TABLE ioda_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ioda_signals_public_read"
  ON ioda_signals FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS ioda_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_code TEXT NOT NULL,
  datasource TEXT NOT NULL,
  start BIGINT NOT NULL,
  duration INTEGER NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_code, datasource, start)
);

CREATE INDEX IF NOT EXISTS idx_ioda_events_lookup
  ON ioda_events(entity_type, entity_code, start DESC);

ALTER TABLE ioda_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ioda_events_public_read"
  ON ioda_events FOR SELECT USING (true);
`

async function run() {
  console.log('Running IODA migration...')
  const { error } = await db.rpc('exec_sql', { sql: SQL }).throwOnError()

  if (error) {
    // Supabase JS doesn't expose raw SQL execution on the anon/service client directly —
    // fall back to the pg REST approach via the sql endpoint
    console.error('RPC failed, trying via SQL endpoint...')
    console.error(error)
    process.exit(1)
  }

  console.log('✓ ioda_signals table created')
  console.log('✓ ioda_events table created')
  console.log('Migration complete.')
}

run()
