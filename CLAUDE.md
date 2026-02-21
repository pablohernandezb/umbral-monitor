# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Umbral** is a Next.js-based analytical platform monitoring regime transformation dynamics in Venezuela. It provides real-time data visualization, historical analysis, and curated resources related to democratic erosion.

**Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL), Recharts, Framer Motion, Leaflet/react-leaflet

**Key Concept**: The platform operates in two modes:
- **Mock Mode** (default): Uses local mock data from `data/mock.ts`
- **Supabase Mode**: Connects to PostgreSQL database with real-time subscriptions

Mode selection is automatic based on `NEXT_PUBLIC_SUPABASE_URL` validity in `.env.local`.

## Common Commands

```bash
# Development
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build (runs type checking and optimization)
npm run start    # Start production server
npm run lint     # ESLint validation

# Database
npm run seed     # Seed Supabase database (requires .env.local with SUPABASE_SERVICE_ROLE_KEY)

# Manual cron triggers (dev)
curl "http://localhost:3000/api/gdelt?force=true"
curl "http://localhost:3000/api/ioda/sync?force=true&secret=umbral-cron-a7f3e9b1c2d4"
curl "http://localhost:3000/api/fact-check/refresh?secret=umbral-cron-a7f3e9b1c2d4"
```

## Architecture

### Data Layer (`lib/`)

**`lib/supabase.ts`**: Database client and schema
- Exports `IS_MOCK_MODE` flag that determines data source
- Contains full PostgreSQL schema in `SCHEMA_SQL` export (14 tables with RLS policies)
- Creates Supabase client only when valid credentials exist

**`lib/data.ts`**: Data access layer with graceful fallback
- All functions return `ApiResponse<T>` with `{ data, error }` structure
- Automatically switches between Supabase queries and mock data based on `IS_MOCK_MODE`
- Provides real-time subscription functions: `subscribeToNews()`, `subscribeToPrisonerStats()`, `subscribeToScenarios()`
- Real-time functions return no-op unsubscribe in mock mode
- `getSubmissionAverages()`: Computes mean scenario ratings from expert/public submissions (deduped by email, latest per participant)

**`lib/ioda.ts`**: IODA Internet connectivity utilities
- `getSignals()`, `getOutageEvents()`, `getOutageAlerts()`, `getVenezuelaRegions()`: Live IODA API calls proxied through `/api/ioda`
- `getRegionSignals(datasource, hours)`: Batch fetch for all 25 VE regions via `/api/ioda/regions`
- `getRegionOutageScores()`: Batch outage scores via `/api/ioda/outages`
- `getStoredDashboardData()`: Reads national IODA data stored in Supabase (Supabase mode only)
- `normalizeSignalSeries()`: Merges multi-datasource signals into `NormalizedSignalPoint[]` for Recharts
- `computeOutageScore()`: Derives an outage score from raw signal values (baseline-vs-recent drop)
- `classifyOutageSeverity()`: Maps score → `OutageSeverity` (`normal|low|degraded|high|critical`)
- `formatOutageScore()`: Compact display (`700k`, `1.2M`)
- `severityColor()`, `severityFill()`, `severityStroke()`: Severity → color helpers for map + charts

**`lib/x-api.ts`**: X (Twitter) API client
- Fetches tweets from `cazamosfakenews`, `cotejoinfo`, `Factchequeado` via `tweets/search/recent`
- Requires X Basic plan bearer token (`X_BEARER_TOKEN` env var)
- All 3 accounts fetched in parallel (`Promise.allSettled`) — sequential + 5s delays caused Vercel Hobby timeouts

**`lib/cookie-consent.ts`**: Context-based consent management
- Stores consent in localStorage: `null` (undecided), `true` (accepted), `false` (rejected)
- Checks `NEXT_PUBLIC_GA_ID` to determine if consent is needed
- Exports: `useCookieConsent()` hook, `acceptCookies()`, `rejectCookies()`, `resetConsent()`

### Database Schema (14 Tables)

1. **`scenarios`**: 5 regime transformation scenarios with probability/status tracking
2. **`regime_history`**: Historical democracy indices (1900-2024) with V-Dem style metrics
3. **`news_feed`**: Aggregated news with categories and per-scenario vote counts (`votes_scenario_1` through `votes_scenario_5`)
4. **`news_vote_log`**: Tracks votes by hashed IP to enforce one vote per IP per scenario per article
5. **`political_prisoners`**: Aggregate detention statistics with demographic breakdowns
6. **`prisoners_by_organization`**: Breakdown by reporting organization
7. **`events_deed`**: Democratic Episodes Event Dataset (bilingual: en/es)
8. **`reading_room`**: Curated resources (books, articles, reports, journalism)
9. **`historical_episodes`**: Major regime periods (autocracy, democracy, transition)
10. **`expert_submissions`**: Expert survey responses with `scenario_probabilities` JSONB, status workflow (pending/approved/rejected)
11. **`public_submissions`**: Public survey responses with `scenario_probabilities` JSONB, status (published/deleted)
12. **`fact_check_tweets`**: Curated fact-checking tweets (bilingual), upserted daily by cron
13. **`gdelt_data`**: GDELT media signals archive — `date`, `instability`, `tone`, `artvolnorm`; populated by daily cron
14. **`ioda_signals`** + **`ioda_events`**: National IODA connectivity signals and outage events; populated by daily cron at 06:00 UTC

**Scenario key-to-number mapping** (used in `scenario_probabilities` JSONB):
- 1 = `regressedAutocracy`, 2 = `revertedLiberalization`, 3 = `stabilizedElectoralAutocracy`, 4 = `preemptedDemocraticTransition`, 5 = `democraticTransition`

All tables have Row Level Security (RLS) enabled with public read-only access.

### Cron Jobs (`vercel.json`)

All crons use `CRON_SECRET=umbral-cron-a7f3e9b1c2d4` for authorization. **Vercel Hobby hard cap is 10s** — all cron handlers must complete within that limit.

| Schedule | Endpoint | Purpose |
|---|---|---|
| `0 8 * * *` | `/api/fact-check/refresh` | Fetch tweets from 3 X fact-checking accounts |
| `59 4 * * *` | `/api/gdelt?force=true` | Fetch & archive GDELT media signals (120-day window) |
| `0 11 * * *` | `/api/news/scrape` | Scrape and store news articles |
| `0 6 * * *` | `/api/ioda/sync?force=true&secret=...` | Fetch & archive national IODA signals + events |

**Parallel fetch pattern** (critical for Hobby 10s cap): all external HTTP calls within a single cron handler must use `Promise.all` / `Promise.allSettled`. Sequential fetches with delays will time out.

### Internationalization (`i18n/`)

- React Context-based i18n system (`i18nProvider`)
- Hook: `useTranslation()` returns `{ t, locale, setLocale }`
- Translation function: `t('key.path')` with dot notation, supports `{param}` interpolation
- Languages: Spanish (default), English
- Translation files: `i18n/es/common.json`, `i18n/en/common.json`
- All IODA components are fully translated under the `ioda.*` key namespace

### Type System

- `types/index.ts`: All core database models
- `types/ioda.ts`: IODA-specific types — `IODASignal`, `IODAOutageEvent`, `NormalizedSignalPoint`, `OutageSeverity`, `StateOutageScore`, `RegionSignalData`, `RegionsBatchResponse`, `OutageScoresBatchResponse`

### App Structure (Next.js App Router)

```
app/
├── page.tsx                    # Landing page (Command Center)
├── layout.tsx                  # Root layout with I18nProvider, GoogleAnalytics, CookieBanner
├── about/                      # About page
├── how-did-we-get-here/        # Interactive timeline with DEED events
├── reading-room/               # Filterable resource archive
├── news/                       # News feed with search, category/source filters, pagination
├── participate/                # Public/expert survey (Likert 1-5 ratings per scenario)
│   ├── page.tsx                # Multi-screen wizard (10+ screens) with new/returning flows
│   └── actions.ts              # Server actions: submit, lookup, email validation
├── privacy-terms/              # Privacy policy & terms page
├── admin/                      # Admin dashboard (protected)
│   ├── page.tsx                # Overview stats (prisoners, news, reading room, submissions)
│   ├── login/                  # Admin login
│   ├── news/                   # News CRUD
│   ├── prisoners/              # Political prisoners CRUD
│   ├── reading-room/           # Reading room CRUD
│   └── participate/            # Expert/public submission management
│       ├── page.tsx            # Review, approve/reject expert submissions
│       └── actions.ts          # Admin server actions for submissions
└── api/
    ├── fact-check/refresh/     # Cron: fetch tweets from 3 X fact-checking accounts
    ├── gdelt/                  # Cron + on-demand: GDELT media signals with DB archive
    ├── ioda/
    │   ├── route.ts            # IODA API proxy (all IODA calls go through here)
    │   ├── sync/               # Cron: archive national IODA signals + events to Supabase
    │   ├── regions/            # Batch signals for all 25 VE regions (for subnational heatmap)
    │   └── outages/            # Batch outage scores for all 25 VE regions (for map + list)
    └── news/scrape/            # Cron: news scraping endpoint
```

### Components

**Layout Components** (`components/layout/`):
- `Header.tsx`: Navigation, language toggle, donate link, and **Share button** (see below)
- `Footer.tsx`: Site footer

**UI Components** (`components/ui/`):
- `ScenarioCard.tsx`: Regime scenario cards with dual expert/public probability bars (Likert 1-5). Both bars use `(rating-1)/4` formula for consistent scaling (1→0%, 5→100%)
- `NewsCard.tsx`: News feed items with scenario voting buttons; supports compact mode
- `MetricCard.tsx`: KPI/metric displays with trend indicators
- `FAQAccordion.tsx`: FAQ accordion with expand/collapse
- `Ticker.tsx`: Days-since counter
- `ReadingCard.tsx`: Reading room resource cards
- `FactCheckingFeed.tsx`: Curated fact-checking tweet feed (3 accounts: cazamosfakenews, cotejoinfo, Factchequeado)
- `ScenarioTimeline.tsx`: Scenario timeline visualization
- `GdeltDashboard.tsx`: GDELT media signals dashboard (instability, tone, article volume; daily archive; key events timeline)
- `PolymarketDashboard.tsx`: Prediction markets dashboard integrating Polymarket data

**IODA Components** (`components/ioda/`):
- `IodaDashboard.tsx`: National connectivity dashboard — 3 separate signal charts (BGP, Active Probing, Telescope) + outage event list. In Supabase mode reads exclusively from DB; mock mode fetches live IODA.
- `SubnationalDashboard.tsx`: State-level dashboard — heatmap + choropleth map + outage score list
- `StateHeatmap.tsx`: Horizon-style heatmap of all 25 states × time (lazy-loads per datasource tab)
- `VenezuelaMap.tsx`: Leaflet choropleth map colored by outage severity; includes Guayana Esequiba (dashed, no score data); hover synced with heatmap
- `OutageScoreList.tsx`: Ranked list of states with active outages, colored by severity
- `OutageEventList.tsx`: List of discrete outage events with datasource labels and severity badges
- `SignalChart.tsx`: Single-signal AreaChart card with auto-scaled Y-axis and gradient fill
- `StatusBadge.tsx`: Connectivity status pill (`normal|degraded|outage|no-data`), fully i18n
- `RegionSelector.tsx`: Region dropdown (national only for now — subnational regions deferred)

**Charts** (`components/charts/`):
- `TrajectoryChart.tsx`: V-Dem index timeline with Recharts
- `GdeltSignalChart.tsx`: GDELT signal visualization

**Other Components** (`components/`):
- `GoogleAnalytics.tsx`: GA4 integration — tracks all pages except `/admin/*`; only activates when `NEXT_PUBLIC_GA_ID` is set and user has accepted cookie consent
- `CookieBanner.tsx`: Cookie consent banner — appears with 1-second delay when consent is `null`
- `CookiePreferences.tsx`: Small button showing current consent status; clicking calls `resetConsent()`
- `admin/Toast.tsx`: Admin notification toasts

### Venezuela GeoJSON (`public/data/venezuela-geo.json`)

- **Source**: GADM 4.1 (`gadm41_VEN_1.json`) — 319KB, full precision (replaced the 26KB geoBoundaries simplified file)
- **26 features**: 23 states + Distrito Capital + Dependencias Federales + Guayana Esequiba
- **Property used for lookup**: `shapeName` (normalized from GADM's `NAME_1`)
- **Name normalization applied**: `DeltaAmacuro→Delta Amacuro`, `Vargas→La Guaira`, etc.
- **Esequibo**: dashed border, near-transparent fill, no IODA score data — display only
- **State lookup**: `IODA_CODE_BY_NAME` map in `data/venezuela-states.ts` (shapeName → IODA numeric code)

### Venezuela States (`data/venezuela-states.ts`)

25 entries with IODA numeric codes 4482–4506. Each entry has `code`, `name` (Spanish), `nameEn`, `iodaCode`. Used by both `/api/ioda/regions` and `/api/ioda/outages` to iterate all states.

### IODA Dashboard — Data Flow

**National dashboard (`IodaDashboard.tsx`)**:
- Supabase mode: reads from `ioda_signals`/`ioda_events` tables (populated daily at 06:00 UTC by `/api/ioda/sync`)
- Mock mode: fetches live from IODA via proxy
- `autoRefresh: false` — data updates once/day; manual refresh button available

**Subnational dashboard (`SubnationalDashboard.tsx`)**:
- Always fetches live from IODA via `/api/ioda/regions` (heatmap signals) and `/api/ioda/outages` (map + score list)
- 3 datasource tabs: BGP, Active Probing, Network Telescope (lazy-loaded on first activation)
- Map and score list driven by real IODA outage summary scores (`/outages/summary` per region)

**IODA API proxy** (`/api/ioda/route.ts`): All client-side IODA calls go through this proxy — never directly to `api.ioda.inetintel.cc.gatech.edu` from the browser.

### GDELT Dashboard — Data Flow

- Daily cron (`59 4 * * *`) calls `/api/gdelt?force=true` → fetches 3 GDELT signals in parallel → upserts to `gdelt_data` table
- All 3 fetches use `AbortSignal.timeout(6_000)` to stay within Hobby's 10s cap
- On-demand reads: if `force=false` and DB has data, returns DB rows without hitting GDELT
- Signals: `instability` (conflict volume), `tone` (media sentiment), `artvolnorm` (article attention)
- `TIMESPAN=120d` — 120-day rolling window, so missed days are backfilled on next successful run

### Share Button (`components/layout/Header.tsx`)

Supported channels: Native Web Share API, X/Twitter, Facebook, Messenger, WhatsApp, Telegram, LinkedIn, Email, Copy link. Dropdown with click-outside detection and Escape key support.

### News Voting System (`app/actions/news-votes.ts`)

Server action: `voteForScenario(newsId, scenarioNumber)`
- IP hashing with salt; `news_vote_log` enforces one vote per IP per scenario per article server-side
- `NewsCard` enforces the same client-side via localStorage

## Development Workflows

### Database Setup

1. **Deploy Schema**: Copy `SCHEMA_SQL` from `lib/supabase.ts` → Supabase SQL Editor → Run
2. **Configure Environment**: Copy `.env.local.example` → `.env.local` and add Supabase credentials
3. **Seed Database**: `npm run seed` (requires `SUPABASE_SERVICE_ROLE_KEY`)

### Switching Between Mock and Supabase Mode

- **To Mock Mode**: Remove/rename `.env.local` or set `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co` (placeholder)
- **To Supabase Mode**: Create `.env.local` with valid Supabase credentials
- Always restart dev server after changing environment variables

### Adding New Data Types

1. Add table SQL to `SCHEMA_SQL` in `lib/supabase.ts`
2. Define TypeScript interface in `types/index.ts` or `types/ioda.ts`
3. Add mock data to `data/mock.ts`
4. Create data access function in `lib/data.ts` with mock fallback
5. Update seed script in `data/seed.ts`

### Real-Time Features

Components can subscribe to database changes using `subscribeToNews()`, `subscribeToPrisonerStats()`, or `subscribeToScenarios()` from `lib/data.ts`. Always return cleanup function from `useEffect`.

## Styling

**Design System**:
- Colors: Charcoal/Black base (`#0a0a0b`, `#111113`), Teal accent (`#14b8a6`), Red (`#dc2626`), Amber (`#f59e0b`)
- Typography: Space Grotesk (display), Inter (body), JetBrains Mono (monospace)
- Components: Cards with inner glow shadows, terminal-style decorations, pulse animations, grid backgrounds
- Participate page uses custom subcomponents: `TacticalButton`, `TacticalInput`, `ScreenShell`, `ScanLines`
- All styles in `app/globals.css` and Tailwind utility classes

**Path Alias**: `@/*` maps to project root (configured in `tsconfig.json`)

## Participate System (Survey)

The participate page (`app/participate/`) is a multi-screen wizard (10+ screens) supporting two flows:

- **Expert**: Name, email, institution, ideology slider (0–10) + Likert 1–5 ratings per scenario. Status workflow: pending → approved/rejected.
- **Public**: Email + Likert 1–5 ratings per scenario. Auto-published.
- **Returning participants**: Email lookup searches `expert_submissions` (approved only) first, then `public_submissions`. Pre-fills previous ratings for re-submission (INSERT new row, not UPDATE).
- **Email validation**: Server-side regex `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`. Emails lowercased on insert and lookup.
- **Landing page integration**: `getSubmissionAverages()` computes per-scenario means from latest submission per email, displayed as dual indicators on `ScenarioCard`.

**Scenario colors on Likert scale:**
- 1–2: Red (very unlikely / unlikely)
- 3–4: Amber (possible / likely)
- 5: Teal (very likely)

**ScenarioCard probability bar formula**: both expert and public bars use `(rating - 1) / 4 * 100%` so that rating=1 renders as 0% and rating=5 renders as 100%.

## Important Notes

- **Security**: `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed client-side (only used in `seed.ts` and `lib/supabase-server.ts`)
- **Type Safety**: All Supabase queries are cast to defined types from `types/index.ts` or `types/ioda.ts`
- **Error Handling**: Data access functions return `{ data, error }` — always check error before using data
- **Translation Keys**: Use dot notation (e.g., `scenarios.democraticTransition.title`, `ioda.status.outage`)
- **Component Pattern**: Most components are client components (`'use client'`) for interactivity
- **Scenario ordering**: Cards display ordered by scenario number 1→5 (left to right)
- **GA exclusion**: `GoogleAnalytics.tsx` skips tracking for any route starting with `/admin`
- **Vote integrity**: `news_vote_log` enforces one vote per IP hash per scenario per article server-side; `NewsCard` enforces the same client-side via localStorage
- **Vercel Hobby 10s limit**: All cron handlers must complete within 10s. Use `Promise.all`/`Promise.allSettled` for parallel external fetches. Sequential fetches with delays will time out and silently skip remaining items.
- **IODA API v2 quirks**: `signals/raw` returns `{ data: [[sig1, sig2, ...]] }` — double-nested array, requires `.flat()`. Events/alerts use query params (`?entityType=&entityCode=`), not path segments. Telescope datasource is `merit-nt` (replaced `ucsd-nt`).
- **react-leaflet version**: Must stay at `^4.2.1` — v5 requires React 19; project is on React 18.
