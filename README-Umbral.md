# Umbral - Monitor de Transformación de Régimen

An independent analytical platform monitoring regime transformation dynamics in Venezuela.

![Umbral](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4)

## 🚀 Quick Start

```bash
# 1. Extract the project
unzip umbral-project.zip
cd umbral

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Visit http://localhost:3000
```

## 📁 Project Structure

```
umbral/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Landing page (Command Center)
│   ├── about/                # About page
│   ├── how-did-we-get-here/  # Interactive timeline
│   ├── reading-room/         # Curated resource archive
│   └── layout.tsx            # Root layout with providers
│
├── components/
│   ├── layout/               # Header, Footer
│   ├── ui/                   # Reusable UI components
│   │   ├── ScenarioCard.tsx  # Regime scenario cards
│   │   ├── NewsCard.tsx      # News feed items
│   │   ├── MetricCard.tsx    # KPI/metric displays
│   │   ├── FAQAccordion.tsx  # FAQ accordion
│   │   ├── Ticker.tsx        # Days-since counter
│   │   └── ReadingCard.tsx   # Reading room items
│   └── charts/
│       └── TrajectoryChart.tsx  # V-Dem index timeline
│
├── lib/
│   ├── supabase.ts           # Supabase client + SQL schema
│   ├── data.ts               # Data access layer (mock fallback)
│   └── utils.ts              # Utility functions
│
├── data/
│   ├── mock.ts               # Mock/seed data
│   └── seed.ts               # Supabase seeding script
│
├── i18n/
│   ├── index.tsx             # i18n provider + hooks
│   ├── es/common.json        # Spanish translations
│   └── en/common.json        # English translations
│
└── types/
    └── index.ts              # TypeScript definitions
```

## 🎨 Design System

### Colors
- **Base**: Charcoal/Black (`#0a0a0b`, `#111113`)
- **Accents**: Teal (`#14b8a6`), Red (`#dc2626`), Amber (`#f59e0b`)

### Typography
- **Display**: Space Grotesk
- **Body**: Inter
- **Mono**: JetBrains Mono

### Components
- Cards with inner glow shadows
- Terminal-style window decorations
- Status indicators with pulse animations
- Grid pattern backgrounds

## 🗄️ Database Schema (Supabase)

The platform is designed for Supabase with 8 tables:

1. `scenarios` - Regime transformation scenario probabilities
2. `regime_history` - Historical democracy indices (V-Dem style)
3. `news_feed` - Aggregated news from verified sources
4. `political_prisoners` - Aggregate detention statistics
5. `prisoners_by_organization` - Breakdown by reporting org
6. `events_deed` - Democratic Episodes Event Dataset
7. `reading_room` - Curated analytical resources
8. `historical_episodes` - Major regime periods

### Running with Supabase

1. Create a Supabase project at https://supabase.com
2. Copy `.env.local.example` to `.env.local`
3. Add your Supabase credentials
4. Run the seed script: `npm run seed`

### Running in Mock Mode (Default)

The platform runs in mock mode by default when no Supabase credentials are provided. All data comes from `data/mock.ts`.

## 🌐 Internationalization

- **Default**: Spanish (es)
- **Secondary**: English (en)
- Language toggle in header
- All UI text sourced from translation files

## 📱 Pages

### 1. Landing Page (`/`)
- Hero with live monitoring badge
- Regime transformation scenario cards (5 scenarios)
- Historical trajectory chart (1900-2024)
- News & signals feed
- Political prisoner micro-dashboard
- FAQ section

### 2. About (`/about`)
- What is Umbral
- Scope and methodology
- Data sources (V-Dem, ERT, DEED, media, HR orgs)
- Acknowledgements

### 3. How Did We Get Here (`/how-did-we-get-here`)
- Interactive Liberal Democracy Index chart (1998-2024)
- Year-click shows DEED events
- Democratic erosion narrative

### 4. Reading Room (`/reading-room`)
- Filterable resource archive
- Categories: Books, Articles, Reports, Journalism
- Filters by type, language, year

## 🛠️ Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run seed     # Seed Supabase database
npm run lint     # Run ESLint
```

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 🔧 Environment Variables

```env
# Supabase (optional - runs in mock mode without these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Site URL (for OpenGraph)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📄 License

MIT License - Built for transparency and accountability.

---

**Umbral** - *Monitoring regime transformation through data.*
