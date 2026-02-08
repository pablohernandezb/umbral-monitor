# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Umbral** is a Next.js-based analytical platform monitoring regime transformation dynamics in Venezuela. It provides real-time data visualization, historical analysis, and curated resources related to democratic erosion.

**Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL), Recharts, Framer Motion

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
```

## Architecture

### Data Layer (`lib/`)

**`lib/supabase.ts`**: Database client and schema
- Exports `IS_MOCK_MODE` flag that determines data source
- Contains full PostgreSQL schema in `SCHEMA_SQL` export (8 tables with RLS policies)
- Creates Supabase client only when valid credentials exist

**`lib/data.ts`**: Data access layer with graceful fallback
- All functions return `ApiResponse<T>` with `{ data, error }` structure
- Automatically switches between Supabase queries and mock data based on `IS_MOCK_MODE`
- Provides real-time subscription functions: `subscribeToNews()`, `subscribeToPrisonerStats()`, `subscribeToScenarios()`
- Real-time functions return no-op unsubscribe in mock mode

### Database Schema (8 Tables)

1. **`scenarios`**: 5 regime transformation scenarios with probability/status tracking
2. **`regime_history`**: Historical democracy indices (1900-2024) with V-Dem style metrics
3. **`news_feed`**: Aggregated news with categories (political, economic, social, international)
4. **`political_prisoners`**: Aggregate detention statistics with demographic breakdowns
5. **`prisoners_by_organization`**: Breakdown by reporting organization
6. **`events_deed`**: Democratic Episodes Event Dataset (bilingual: en/es)
7. **`reading_room`**: Curated resources (books, articles, reports, journalism)
8. **`historical_episodes`**: Major regime periods (autocracy, democracy, transition)

All tables have:
- Row Level Security (RLS) enabled with public read-only access
- Indexed frequently-queried columns
- Real-time subscriptions enabled for `news_feed`, `political_prisoners`, and `scenarios`

### Internationalization (`i18n/`)

- React Context-based i18n system (`i18nProvider`)
- Hook: `useTranslation()` returns `{ t, locale, setLocale }`
- Translation function: `t('key.path')` with dot notation
- Languages: Spanish (default), English
- Translation files: `i18n/es/common.json`, `i18n/en/common.json`

### Type System (`types/index.ts`)

- All database models mirror Supabase schema exactly
- `ApiResponse<T>` wrapper for all data access functions
- Chart-specific types: `TrajectoryDataPoint`, `PrisonerTrendData`
- Props types for all UI components

### App Structure (Next.js App Router)

```
app/
├── page.tsx                    # Landing page (Command Center)
├── layout.tsx                  # Root layout with I18nProvider
├── about/                      # About page
├── how-did-we-get-here/        # Interactive timeline with DEED events
└── reading-room/               # Filterable resource archive
```

### Components

**Layout Components** (`components/layout/`):
- `Header.tsx`: Navigation + language toggle
- `Footer.tsx`: Site footer

**UI Components** (`components/ui/`):
- `ScenarioCard.tsx`: Regime scenario cards with probability indicators
- `NewsCard.tsx`: News feed items (supports compact mode)
- `MetricCard.tsx`: KPI/metric displays with trend indicators
- `FAQAccordion.tsx`: FAQ accordion with expand/collapse
- `Ticker.tsx`: Days-since counter
- `ReadingCard.tsx`: Reading room resource cards

**Charts** (`components/charts/`):
- `TrajectoryChart.tsx`: V-Dem index timeline with Recharts

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
2. Define TypeScript interface in `types/index.ts`
3. Add mock data to `data/mock.ts`
4. Create data access function in `lib/data.ts` with mock fallback
5. Update seed script in `data/seed.ts`

### Real-Time Features

Components can subscribe to database changes using `subscribeToNews()`, `subscribeToPrisonerStats()`, or `subscribeToScenarios()` from `lib/data.ts`. Always return cleanup function from `useEffect`:

```typescript
useEffect(() => {
  const unsubscribe = subscribeToNews((payload) => {
    setNews(prev => [payload.new, ...prev])
  })
  return () => unsubscribe()
}, [])
```

## Styling

**Design System**:
- Colors: Charcoal/Black base (`#0a0a0b`, `#111113`), Teal accent (`#14b8a6`), Red (`#dc2626`), Amber (`#f59e0b`)
- Typography: Space Grotesk (display), Inter (body), JetBrains Mono (monospace)
- Components: Cards with inner glow shadows, terminal-style decorations, pulse animations, grid backgrounds
- All styles in `app/globals.css` and Tailwind utility classes

**Path Alias**: `@/*` maps to project root (configured in `tsconfig.json`)

## Important Notes

- **Security**: `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed client-side (only used in `seed.ts`)
- **Type Safety**: All Supabase queries are cast to defined types from `types/index.ts`
- **Error Handling**: Data access functions return `{ data, error }` - always check error before using data
- **Translation Keys**: Use dot notation (e.g., `scenarios.democraticTransition.title`)
- **Component Pattern**: Most components are client components (`'use client'`) for interactivity
