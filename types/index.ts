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
  headline_en: string
  headline_es: string
  summary_en: string | null
  summary_es: string | null
  external_url: string
  category_en: 'political' | 'economic' | 'social' | 'international'
  category_es: 'política' | 'economía' | 'social' | 'internacional'
  is_breaking: boolean
  published_at: string
  created_at: string
  // Scenario vote counts
  votes_scenario_1: number  // democraticTransition
  votes_scenario_2: number  // preemptedDemocraticTransition
  votes_scenario_3: number  // stabilizedElectoralAutocracy
  votes_scenario_4: number  // revertedLiberalization
  votes_scenario_5: number  // regressedAutocracy
}

export interface PoliticalPrisoner {
  id: string
  date: string
  total_count: number
  releases_30d: number
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
  title_en: string
  title_es: string | null
  author: string
  year: number
  type: 'book' | 'article' | 'report' | 'journalism'
  language: 'es' | 'en' | 'both'
  description_en: string
  description_es: string | null
  external_url: string | null
  tags_en: string[]
  tags_es: string[] | null
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

export interface ExpertSubmission {
  id: string
  name: string
  email: string
  institution: string
  ideology_score: number
  scenario_probabilities: Record<number, number>
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  created_at: string
}

export interface PublicSubmission {
  id: string
  email: string
  scenario_probabilities: Record<number, number>
  status: 'published' | 'deleted'
  submitted_at: string
  created_at: string
}

export interface FactCheckTweet {
  id: string
  tweet_id: string
  username: string
  display_name: string
  profile_image_url: string
  text_es: string
  text_en: string | null
  tweet_url: string
  alert_tags: string[]
  published_at: string
  fetched_at: string
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

// ─── Domain Blocking ───────────────────────────────────────────

export interface BlockedDomain {
  id: number;
  batch_id: string;
  site: string;
  domain: string;
  category: string;
  cantv: string;
  movistar: string;
  digitel: string;
  inter: string;
  netuno: string;
  airtek: string;
  g_network: string;
  uploaded_at: string;
}

export interface BlockedDomainBatch {
  id: string;
  label: string | null;
  source_file: string | null;
  row_count: number;
  is_active: boolean;
  uploaded_at: string;
}

export type BlockingCategory =
  | 'NEWS' | 'ANON' | 'COMM' | 'POLR' | 'HUMR'
  | 'GRP'  | 'PORN' | 'ECON' | 'MMED' | 'COMT'
  | 'PUBH' | 'HATE';

// ─── Gaceta Oficial ────────────────────────────────────────────

export type GacetaChangeLabel =
  | 'Designación'
  | 'Jubilación'
  | 'Traslado'
  | 'Supresión'
  | 'Reorganización'
  | 'Revocación'
  | 'Ley'
  | 'Autorización'
  | 'Otro'

export interface GacetaRecord {
  id: number
  batch_id: string
  gazette_number: number
  gazette_type: string
  gazette_date: string              // 'YYYY-MM-DD'
  decree_number: string | null
  change_type: string
  change_label: GacetaChangeLabel
  person_name: string | null
  post_or_position: string | null
  institution: string | null
  organism: string | null
  is_military_person: boolean
  military_rank: string | null
  is_military_post: boolean
  summary: string | null
  uploaded_at: string
}

export interface GacetaBatch {
  id: string
  label: string | null
  source_file: string | null
  row_count: number
  is_active: boolean
  uploaded_at: string
}

export interface GacetaSummary {
  totalChanges: number
  designations: number
  militaryPersons: number
  militaryPosts: number
  militaryPct: number
  changesByLabel: Record<GacetaChangeLabel, number>
  byOrganism: { organism: string; count: number }[]
  byWeek: { week: string; label: string; count: number }[]
}

// ============================================================
// INSTALLING DEMOCRACY — transition checklist
// ============================================================

export type TransitionStatus = 'pending' | 'in_progress' | 'completed' | 'stalled'

export interface TransitionSource {
  url: string
  title?: string
  date?: string // ISO date
}

export interface TransitionAction {
  id: string
  pillar: string          // pillar key, see PILLAR_ICONS in components/installing-democracy/icons.ts
  month: number            // 1..18
  sortOrder: number
  actionEs: string
  actionEn: string
  indicatorEs: string
  indicatorEn: string
  responsibleEs: string
  responsibleEn: string
  actors: string[]         // actor keys — see ACTOR_ICONS
  status: TransitionStatus
  evidenceEs?: string | null
  evidenceEn?: string | null
  sources: TransitionSource[]
  completedDate?: string | null // ISO date
  /** Admin-only visual flag — pulses/tilts the card red on the public list.
   * Optional (not a required boolean) because mock rows predate this field
   * and default to "off" rather than needing every literal touched. */
  isAlert?: boolean
}

export interface PhaseProgress {
  phase: number             // 1..6 (milestone number)
  total: number
  completionPct: number     // expert-assessed: mean of member items' itemPct (0..100)
  evaluatorCount: number    // see EvaluationAggregate note: max across member actions,
                            // not a true distinct count — the public aggregate view
                            // carries no evaluator identity to dedupe against.
  isActive: boolean         // earliest phase with completionPct < 100
  // Secondary admin annotation stats (NOT the % driver — see lib/transition.ts):
  completed: number
  inProgress: number
  stalled: number
  pending: number
}

export interface PillarProgress {
  pillar: string
  total: number
  completionPct: number     // expert-assessed (0..100)
  evaluatorCount: number    // same max-across-members caveat as PhaseProgress
  // Secondary admin annotation stats (NOT the % driver):
  completed: number
  inProgress: number
}

export interface TransitionProgress {
  total: number             // 60
  completionPct: number     // headline: mean of the item percentages (each item ~1.67%)
  totalEvaluators: number   // distinct experts across the whole checklist
  phases: PhaseProgress[]
  pillars: PillarProgress[]
  // Secondary admin annotation stats (NOT the % driver):
  completed: number
  inProgress: number
  stalled: number
  pending: number
}

// ============================================================
// INSTALLING DEMOCRACY — expert monitoring (access-code gated evaluation)
// ============================================================

export type MonitoringStatus = 'pending' | 'approved' | 'rejected'

// Admin-only shape — never sent to the public client.
export interface MonitoringExpert {
  id: string
  name: string
  email: string
  institution: string
  status: MonitoringStatus
  accessCode?: string | null
  adminNote?: string | null
  createdAt: string
  approvedAt?: string | null
}

// Identity-free — safe for the anon client (reads transition_evaluation_aggregates).
export interface EvaluationAggregate {
  actionId: string
  evaluatorCount: number
  meanScore: number      // 0..4
  completionPct: number  // 0..100
}

// One expert's own scores, keyed by action id (for prefill on return).
export type EvaluationMap = Record<string, number> // actionId -> 0..4

// One expert's own comments, keyed by action id — private between experts;
// admin can read every expert's comments for moderation (see
// app/admin/installing-democracy/comments/actions.ts).
export type CommentMap = Record<string, string> // actionId -> comment body

// Admin-only shape — a comment joined with which expert/action it belongs to.
export interface AdminTransitionComment {
  id: string
  actionId: string
  evaluatorName: string
  evaluatorEmail: string
  body: string
  createdAt: string
  updatedAt: string
}
