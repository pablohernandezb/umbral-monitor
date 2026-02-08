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

## 🗄️ Database Setup

The platform is designed with a **graceful fallback system** that automatically switches between mock data and Supabase based on environment configuration.

### Database Schema

The platform uses **8 PostgreSQL tables** in Supabase:

1. **`scenarios`** - Regime transformation scenario probabilities (5 scenarios)
2. **`regime_history`** - Historical democracy indices (V-Dem style, 1900-2024)
3. **`news_feed`** - Aggregated news from verified sources (with real-time updates)
4. **`political_prisoners`** - Aggregate detention statistics with demographic breakdowns
5. **`prisoners_by_organization`** - Breakdown by reporting organization
6. **`events_deed`** - Democratic Episodes Event Dataset (bilingual: es/en)
7. **`reading_room`** - Curated analytical resources (books, articles, reports, journalism)
8. **`historical_episodes`** - Major regime periods

All tables include:
- **Row Level Security (RLS)** policies for public read-only access
- **Indexes** on frequently queried columns for performance
- **Real-time subscriptions** enabled for `news_feed`, `political_prisoners`, and `scenarios`

### Initial Setup with Supabase

#### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in (or create a free account)
2. Click **"New Project"**
3. Configure:
   - **Name**: `umbral-production` (or `umbral-dev` for testing)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your audience (e.g., `East US`)
   - **Pricing Plan**: **Free** tier works great for development
4. Wait 2-3 minutes for provisioning

#### Step 2: Deploy Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire schema SQL from `lib/supabase.ts` (the `SCHEMA_SQL` export)
4. Paste into the editor and click **"Run"** (or press `Ctrl+Enter`)
5. Verify success in **Table Editor** - you should see all 8 tables

#### Step 3: Configure Environment Variables

1. In Supabase Dashboard, go to **Settings → API**
2. Copy your credentials:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (safe for client-side use)
   - **service_role key** (keep this secret!)

3. Create `.env.local` in project root:
   ```bash
   copy .env.local.example .env.local
   ```

4. Edit `.env.local` with your credentials:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

   # Service role key for seeding (server-side only)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Site Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

#### Step 4: Seed Database

Install dependencies (if not already done):
```bash
npm install
```

Run the seed script to populate all tables with initial data:
```bash
npm run seed
```

Expected output:
```
🌱 Starting database seed...
📊 Seeding scenarios... ✅
📈 Seeding regime history... ✅
📰 Seeding news feed... ✅
⚖️ Seeding political prisoners... ✅
🏢 Seeding prisoners by organization... ✅
📅 Seeding DEED events... ✅
📚 Seeding reading room... ✅
🏛️ Seeding historical episodes... ✅
✨ Database seeding complete!
```

#### Step 5: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 and verify:
- Data loads from Supabase (check Network tab in DevTools for `supabase.co` requests)
- All pages display correctly
- No console errors

### Running in Mock Mode (Default)

The platform **runs in mock mode by default** when:
- No `.env.local` file exists, OR
- `NEXT_PUBLIC_SUPABASE_URL` is set to the placeholder value `https://your-project.supabase.co`

In mock mode:
- All data comes from `data/mock.ts`
- No database connection required
- Perfect for development and testing without Supabase
- Real-time subscriptions return no-op functions

### Switching Between Mock and Production

The app automatically detects which mode to use based on the `IS_MOCK_MODE` flag in `lib/supabase.ts`:

```typescript
// Automatically switches to mock mode if no valid Supabase URL
const isMockMode = !supabaseUrl || supabaseUrl === 'https://your-project.supabase.co'
```

**To switch to mock mode:** Rename `.env.local` to `.env.local.backup` and restart dev server

**To switch to Supabase:** Restore `.env.local` with valid credentials and restart dev server

### Real-Time Updates

Real-time subscriptions are enabled for:
- **News Feed** - New articles appear automatically
- **Political Prisoners** - Stats update immediately
- **Scenarios** - Probability changes reflect live

To verify real-time is working:
1. Open your app at http://localhost:3000
2. In Supabase Dashboard, go to **Table Editor → news_feed**
3. Insert a new row with `is_breaking = true`
4. The new item should appear on your landing page within 1-2 seconds

### Troubleshooting

**App not loading data from Supabase:**
- Ensure `.env.local` exists with correct values
- Restart dev server after changing environment variables
- Check DevTools Network tab for requests to `supabase.co`
- Verify Supabase project is active in dashboard

**Seed script fails:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Ensure schema is deployed (tables exist in Supabase Dashboard)
- Check Supabase logs for specific errors
- Make sure `dotenv` package is installed: `npm install dotenv`

**Real-time not working:**
- Go to **Database → Replication** in Supabase Dashboard
- Verify `news_feed`, `political_prisoners`, and `scenarios` are published
- Check browser console for WebSocket connection errors
- Disable browser extensions that may block WebSockets

**"Column does not exist" errors:**
- The schema SQL may be out of sync with the seed script
- Drop all tables and re-run the schema SQL from `lib/supabase.ts`
- Re-run `npm run seed`

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

Create a `.env.local` file in the project root:

```env
# Supabase Configuration (optional - app runs in mock mode without these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Service role key for database seeding (server-side only, never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Site URL (for OpenGraph and canonical URLs)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Security Notes:**
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe for client-side use
- ❌ `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the client
- ✅ `.env.local` is gitignored by default
- ⚠️ Use separate Supabase projects for development, staging, and production

## 📄 License

MIT License - Built for transparency and accountability.

---

**Umbral** - *Monitoring regime transformation through data.*
