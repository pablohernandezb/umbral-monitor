// ============================================================
// Umbral Type Definitions
// ============================================================

// Database types (mirrors Supabase schema)
export interface Scenario {
  id: string
  key: 'democraticTransition' | 'preemptedDemocraticTransition' | 'stabilizedElectoralAutocracy' | 'revertedLiberalization' | 'regressedAutocracy'
  probability: number // 0-100
  probability_label: 'low' | 'mediumLow' | 'medium' | 'mediumHigh' | 'high'
  status: 'warning' | 'stable' | 'critical' | 'neutral'
  created_at: string
  updated_at: string
}

export interface RegimeHistory {
  id: string;
  year: number;
  electoral_democracy_index: number;
  regime_type: number;
  episode_type: 'autocratization' | 'democratization' | 'na';
  outcome: number | null; // New field
  notes: string | null;
  created_at: string;
}

export interface DemBreakdownHistory {
  id: string;
  year: number;
  electoral_democracy_index: number;
  regime_type: number;
  episode_type: 'autocratization' | 'democratization' | 'na';
  outcome: number | null; // New field
  notes: string | null;
  created_at: string;
}

export interface NewsItem {
  id: string
  source: string
  source_url: string
  headline: string
  summary: string | null
  external_url: string
  category: 'political' | 'economic' | 'social' | 'international'
  is_breaking: boolean
  published_at: string
  created_at: string
}

export interface PoliticalPrisoner {
  id: string
  date: string
  total: number
  released: number
  civilians: number
  military: number
  men: number
  women: number
  adults: number
  minors: number
  foreign: number
  unknown: number
  source: string | null
  created_at: string
  updated_at: string
}

export interface PrisonerByOrganization {
  id: string
  organization: string
  count: number
  date: string  // Changed from data_date for consistency
  created_at: string
  updated_at: string  // Added for admin operations
}

// Alias for backward compatibility and clarity
export type PrisonersByOrganization = PrisonerByOrganization

export interface DEEDEvent {
  id: string
  year: number
  type: 'destabilizing_event' | 'precursor' | 'resistance' | 'symptom'
  category: string
  description_en: string
  description_es: string
  month: string | null
  actors: string | null
  targets: string | null
  created_at: string
}

export interface ReadingRoomItem {
  id: string
  title: string
  author: string
  year: number
  type: 'book' | 'article' | 'report' | 'journalism'
  language: 'es' | 'en' | 'both'
  description: string
  external_url: string | null
  tags: string[]
  created_at: string
}

export interface HistoricalEpisode {
  id: string
  key: string
  start_year: number
  end_year: number | null
  episode_type: 'autocracy' | 'democracy' | 'transition'
  created_at: string
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

// Chart data types
export interface TrajectoryDataPoint {
  year: number
  liberalDemocracyIndex: number
  electoralDemocracyIndex: number
  episode?: string
}

export interface PrisonerTrendData {
  date: string
  total: number
  releases: number
  newDetentions: number
}

// UI State types
export interface ScenarioCardData {
  key: string
  probability: number
  probabilityLabel: string
  status: 'warning' | 'stable' | 'critical' | 'neutral'
  icon: 'lightning' | 'check' | 'alert' | 'shield'
}

export interface FilterState {
  type: string | null
  year: number | null
  language: string | null
  search: string
}

// Supabase Realtime types
export interface RealtimePayload<T> {
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T | null
  schema: string
  table: string
}

// Props types for components
export interface ChartProps {
  data: TrajectoryDataPoint[]
  height?: number
  showEpisodes?: boolean
  onYearClick?: (year: number) => void
}

export interface ScenarioCardProps {
  scenario: ScenarioCardData
  translationKey: string
}

export interface NewsCardProps {
  item: NewsItem
  compact?: boolean
}

export interface FAQItemProps {
  question: string
  answer: string
  defaultOpen?: boolean
}
