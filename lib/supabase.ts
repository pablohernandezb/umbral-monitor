import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Check if we're in development/mock mode
const isMockMode = !supabaseUrl || supabaseUrl === 'https://your-project.supabase.co'

// Create Supabase client
// In mock mode, this will fail gracefully and we'll use local data instead
export const supabase = isMockMode
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Enable session persistence for authenticated operations
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })

// Export mock mode flag for components to check
export const IS_MOCK_MODE = isMockMode

// ============================================================
// Supabase Database Schema (SQL)
// Run this in Supabase SQL Editor to create tables
// ============================================================
export const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SCENARIOS TABLE
-- Regime transformation scenario probabilities
-- ============================================================
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  probability INTEGER NOT NULL CHECK (probability >= 0 AND probability <= 100),
  probability_label TEXT NOT NULL CHECK (probability_label IN ('low', 'mediumLow', 'medium', 'mediumHigh', 'high')),
  status TEXT NOT NULL CHECK (status IN ('warning', 'stable', 'critical', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REGIME_HISTORY TABLE
-- Historical democracy indices by year
-- ============================================================
CREATE TABLE IF NOT EXISTS regime_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER UNIQUE NOT NULL,
  electoral_democracy_index DECIMAL(4,3) CHECK (electoral_democracy_index >= 0 AND electoral_democracy_index <= 1),
  regime_type INTEGER,
  episode_type TEXT,
  outcome INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regime_history_year ON regime_history(year);

-- ============================================================
-- NEWS_FEED TABLE
-- Aggregated news from verified sources (bilingual support)
-- ============================================================
CREATE TABLE IF NOT EXISTS news_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  headline_en TEXT NOT NULL,
  headline_es TEXT NOT NULL,
  summary_en TEXT,
  summary_es TEXT,
  external_url TEXT NOT NULL,
  category_en TEXT NOT NULL CHECK (category_en IN ('political', 'economic', 'social', 'international')),
  category_es TEXT NOT NULL CHECK (category_es IN ('política', 'economía', 'social', 'internacional')),
  is_breaking BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Scenario vote counts
  votes_scenario_1 INTEGER DEFAULT 0,  -- democraticTransition
  votes_scenario_2 INTEGER DEFAULT 0,  -- preemptedDemocraticTransition
  votes_scenario_3 INTEGER DEFAULT 0,  -- stabilizedElectoralAutocracy
  votes_scenario_4 INTEGER DEFAULT 0,  -- revertedLiberalization
  votes_scenario_5 INTEGER DEFAULT 0   -- regressedAutocracy
);

CREATE INDEX idx_news_feed_published ON news_feed(published_at DESC);
CREATE INDEX idx_news_feed_category ON news_feed(category);

-- ============================================================
-- POLITICAL_PRISONERS TABLE
-- Aggregate statistics snapshots
-- ============================================================
CREATE TABLE IF NOT EXISTS political_prisoners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  total INTEGER NOT NULL,
  released INTEGER DEFAULT 0,
  civilians INTEGER DEFAULT 0,
  military INTEGER DEFAULT 0,
  men INTEGER DEFAULT 0,
  women INTEGER DEFAULT 0,
  adults INTEGER DEFAULT 0,
  minors INTEGER DEFAULT 0,
  "foreign" INTEGER DEFAULT 0,
  unknown INTEGER DEFAULT 0,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_political_prisoners_date ON political_prisoners(date DESC);

-- ============================================================
-- PRISONERS_BY_ORGANIZATION TABLE
-- Breakdown by reporting organization
-- ============================================================
CREATE TABLE IF NOT EXISTS prisoners_by_organization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization TEXT NOT NULL,
  count INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prisoners_by_org_date ON prisoners_by_organization(date DESC);

-- ============================================================
-- EVENTS_DEED TABLE
-- Democratic Episodes Event Dataset
-- ============================================================
CREATE TABLE IF NOT EXISTS events_deed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  month TEXT,
  actors TEXT,
  targets TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_deed_year ON events_deed(year);
CREATE INDEX idx_events_deed_category ON events_deed(category);

-- ============================================================
-- READING_ROOM TABLE
-- Curated analytical resources (bilingual support)
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_room (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en TEXT NOT NULL,
  title_es TEXT,
  author TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('book', 'article', 'report', 'journalism')),
  language TEXT NOT NULL CHECK (language IN ('es', 'en', 'both')),
  description_en TEXT NOT NULL,
  description_es TEXT,
  external_url TEXT,
  tags_en TEXT[] DEFAULT '{}',
  tags_es TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reading_room_type ON reading_room(type);
CREATE INDEX idx_reading_room_year ON reading_room(year DESC);

-- ============================================================
-- HISTORICAL_EPISODES TABLE
-- Major regime periods
-- ============================================================
CREATE TABLE IF NOT EXISTS historical_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  episode_type TEXT NOT NULL CHECK (episode_type IN ('autocracy', 'democracy', 'transition')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable public read-only access
-- ============================================================
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE regime_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE political_prisoners ENABLE ROW LEVEL SECURITY;
ALTER TABLE prisoners_by_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_deed ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_room ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_episodes ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read scenarios" ON scenarios FOR SELECT USING (true);
CREATE POLICY "Public read regime_history" ON regime_history FOR SELECT USING (true);
CREATE POLICY "Public read news_feed" ON news_feed FOR SELECT USING (true);
CREATE POLICY "Public read political_prisoners" ON political_prisoners FOR SELECT USING (true);
CREATE POLICY "Public read prisoners_by_organization" ON prisoners_by_organization FOR SELECT USING (true);
CREATE POLICY "Public read events_deed" ON events_deed FOR SELECT USING (true);
CREATE POLICY "Public read reading_room" ON reading_room FOR SELECT USING (true);
CREATE POLICY "Public read historical_episodes" ON historical_episodes FOR SELECT USING (true);

-- ============================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for specific tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE news_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE political_prisoners;
ALTER PUBLICATION supabase_realtime ADD TABLE scenarios;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- Auto-update timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTHENTICATED WRITE POLICIES
-- Allow authenticated users to manage content
-- ============================================================

-- Political Prisoners policies
CREATE POLICY "Authenticated insert political_prisoners"
  ON political_prisoners FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update political_prisoners"
  ON political_prisoners FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated delete political_prisoners"
  ON political_prisoners FOR DELETE
  TO authenticated
  USING (true);

-- Prisoners by Organization policies
CREATE POLICY "Authenticated insert prisoners_by_organization"
  ON prisoners_by_organization FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update prisoners_by_organization"
  ON prisoners_by_organization FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated delete prisoners_by_organization"
  ON prisoners_by_organization FOR DELETE
  TO authenticated
  USING (true);

-- Reading Room policies
CREATE POLICY "Authenticated insert reading_room"
  ON reading_room FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update reading_room"
  ON reading_room FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated delete reading_room"
  ON reading_room FOR DELETE
  TO authenticated
  USING (true);
`

// Export for reference
export { SCHEMA_SQL as schemaSQL }
