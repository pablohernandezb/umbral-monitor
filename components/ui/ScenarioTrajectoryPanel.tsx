'use client'

import { useState } from 'react'
import { X, Info, HandFist, RotateCcw, Vote, Undo, Landmark } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Chart coordinate system
// viewBox: "0 0 800 380"
// Chart area: x = 70..780  (710 px wide)  → years 2025–2033 (8 intervals)
//             y = 30..320  (290 px tall)  → EDI 0.00–0.75
//
// x(year) = 70 + (year − 2025) × 88.75
// y(edi)  = 320 − (edi / 0.75) × 290
//
// Key x values:  2025=70  2026=159  2027=248  2028=336
//                2029=425  2030=514  2031=603  2032=691  2033=780
// Key y values:  0.10=281  0.18=250  0.20=243  0.23=231  0.25=223
//                0.30=204  0.44=150  0.50=127  0.55=108  0.70=49  0.72=42
//
// Circle (current state): cx=159 cy=231  (2026, EDI 0.23)
// Democracy threshold:    y=127           (EDI 0.50)
// ---------------------------------------------------------------------------

type ScenarioKey =
  | 'regressedAutocracy'
  | 'revertedLiberalization'
  | 'stabilizedElectoralAutocracy'
  | 'preemptedDemocraticTransition'
  | 'democraticTransition'

const SCENARIO_ICONS: Record<ScenarioKey, React.ElementType> = {
  regressedAutocracy:             HandFist,
  revertedLiberalization:         RotateCcw,
  stabilizedElectoralAutocracy:   Vote,
  preemptedDemocraticTransition:  Undo,
  democraticTransition:           Landmark,
}

interface ScenarioDef {
  key: ScenarioKey
  num: number
  color: string
  /** Path starts at circle centre (159, 231) */
  pathD: string
  labelX: number
  labelY: number
}

const SCENARIOS: ScenarioDef[] = [
  {
    key: 'regressedAutocracy',
    num: 1,
    color: '#7f1d1d',
    // 2026 → ~2029  EDI 0.23 → 0.10  (steep downward regression)
    pathD: 'M 159,231 C 205,231 265,257 325,270 C 378,280 420,282 460,282',
    labelX: 477,
    labelY: 285,
  },
  {
    key: 'revertedLiberalization',
    num: 2,
    color: '#b91c1c',
    // 2026 → ~2030  brief rise to ~0.25, then falls to ~0.18
    pathD: 'M 159,231 C 215,231 265,220 305,220 C 385,221 458,240 532,250',
    labelX: 550,
    labelY: 259,
  },
  {
    key: 'stabilizedElectoralAutocracy',
    num: 3,
    color: '#ef4444',
    // 2026 → ~2030  moderate upward to EDI 0.30
    pathD: 'M 159,231 C 228,230 325,214 424,207 C 473,204 508,204 532,204',
    labelX: 550,
    labelY: 213,
  },
  {
    key: 'preemptedDemocraticTransition',
    num: 4,
    color: '#7c3aed',
    // 2026 → rises past 0.50 threshold (~2030, EDI 0.55) → curves back DOWN to 2032 EDI 0.44
    pathD: 'M 159,231 C 243,227 344,172 442,128 C 478,110 500,104 516,108 C 557,120 628,139 693,150',
    labelX: 711,
    labelY: 159,
  },
  {
    key: 'democraticTransition',
    num: 5,
    color: '#2563eb',
    // 2026 → ~2032.5  strong rise to EDI ~0.69
    pathD: 'M 159,231 C 258,227 362,194 462,159 C 562,121 660,72 735,53',
    labelX: 753,
    labelY: 56,
  },
]

const Y_TICKS = [
  { edi: 0.1, y: 281 },
  { edi: 0.2, y: 243 },
  { edi: 0.3, y: 204 },
  { edi: 0.4, y: 165 },
  { edi: 0.5, y: 127 },
  { edi: 0.6, y: 88 },
  { edi: 0.7, y: 49 },
]

const X_TICKS = [
  { year: 2025, x: 70 },
  { year: 2026, x: 159 },
  { year: 2027, x: 248 },
  { year: 2028, x: 336 },
  { year: 2029, x: 425 },
  { year: 2030, x: 514 },
  { year: 2031, x: 603 },
  { year: 2032, x: 691 },
  { year: 2033, x: 780 },
]

const DEMO_Y = 127
const CIRCLE_X = 159
const CIRCLE_Y = 231

interface ScenarioTrajectoryPanelProps {
  onClose: () => void
}

export function ScenarioTrajectoryPanel({ onClose }: ScenarioTrajectoryPanelProps) {
  const { t, locale } = useTranslation()
  const [activeKey, setActiveKey] = useState<ScenarioKey | null>(null)

  const active = SCENARIOS.find(s => s.key === activeKey) ?? null

  const toggleScenario = (key: ScenarioKey, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveKey(prev => (prev === key ? null : key))
  }

  const toggleChip = (key: ScenarioKey) => {
    setActiveKey(prev => (prev === key ? null : key))
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-umbral-charcoal/80 backdrop-blur-sm',
        'animate-in slide-in-from-top-4 fade-in duration-500'
      )}
      style={{ borderColor: '#3b82f630' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-umbral-ash"
        style={{ background: 'linear-gradient(135deg, #3b82f608, transparent)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#3b82f6' }} />
          <div>
            <h3 className="text-sm font-bold text-white">
              {t('scenarios.trajectoryPanel.title')}
            </h3>
            <p className="text-xs text-umbral-muted">
              {t('scenarios.trajectoryPanel.subtitle')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-umbral-ash/30 transition-colors text-umbral-muted hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
      <div className="px-4 py-5 md:px-6 md:py-6">

        {/* Mobile tap hint — shown above chart on small screens */}
        <p className="sm:hidden text-center text-xs text-umbral-muted/50 font-mono mb-3">
          {locale === 'es'
            ? 'Toca una trayectoria para ver detalles'
            : 'Tap a trajectory to see details'}
        </p>

        <div className="w-full">
          <svg
            viewBox="0 0 800 380"
            className="w-full"
            style={{ maxHeight: '460px', display: 'block', cursor: 'default' }}
            role="img"
            aria-label={t('scenarios.trajectoryPanel.title')}
            onClick={() => setActiveKey(null)}
          >
            <defs>
              {SCENARIOS.map(s => (
                <g key={s.key}>
                  {/* Normal arrowhead */}
                  <marker
                    id={`tp-arrow-${s.key}`}
                    markerUnits="userSpaceOnUse"
                    markerWidth="18"
                    markerHeight="14"
                    refX="6"
                    refY="7"
                    orient="auto"
                  >
                    <polygon points="0 0, 16 7, 0 14" fill={s.color} />
                  </marker>
                  {/* Active / hovered arrowhead (~1.5× larger) */}
                  <marker
                    id={`tp-arrow-${s.key}-active`}
                    markerUnits="userSpaceOnUse"
                    markerWidth="26"
                    markerHeight="20"
                    refX="8"
                    refY="10"
                    orient="auto"
                  >
                    <polygon points="0 0, 24 10, 0 20" fill={s.color} />
                  </marker>
                </g>
              ))}
            </defs>

            {/* Zone tints */}
            <rect x="70" y="30" width="710" height={DEMO_Y - 30} fill="#1d4ed8" opacity="0.04" />
            <rect x="70" y={DEMO_Y} width="710" height={320 - DEMO_Y} fill="#dc2626" opacity="0.03" />

            {/* Horizontal grid lines */}
            {Y_TICKS.map(({ edi, y }) => (
              <line
                key={edi}
                x1="70" y1={y} x2="780" y2={y}
                stroke={edi === 0.5 ? '#4b5563' : '#1f2937'}
                strokeWidth={edi === 0.5 ? 1 : 0.5}
                strokeDasharray={edi === 0.5 ? '7,4' : '3,3'}
              />
            ))}

            {/* X-axis tick marks */}
            {X_TICKS.map(({ year, x }) => (
              <line key={year} x1={x} y1="319" x2={x} y2="325" stroke="#4b5563" strokeWidth="0.8" />
            ))}

            {/* Axes */}
            <line x1="70" y1="30" x2="70" y2="320" stroke="#6b7280" strokeWidth="1" />
            <line x1="70" y1="320" x2="780" y2="320" stroke="#6b7280" strokeWidth="1" />

            {/* Y-axis labels — larger font for mobile readability */}
            {Y_TICKS.map(({ edi, y }) => (
              <text
                key={edi}
                x="62" y={y + 5}
                textAnchor="end"
                fontSize="13"
                fill="#6b7280"
                fontFamily="'JetBrains Mono', monospace"
              >
                {edi.toFixed(1)}
              </text>
            ))}

            {/* Y-axis title — hidden on mobile (too small when scaled) */}
            <text
              className="hidden sm:block"
              transform="rotate(-90, 13, 175)"
              x="13" y="175"
              textAnchor="middle"
              fontSize="11"
              fill="#4b5563"
              fontFamily="Arial, sans-serif"
            >
              {locale === 'es' ? 'Índice de Democracia Electoral' : 'Electoral Democracy Index'}
            </text>

            {/* X-axis labels */}
            {X_TICKS.map(({ year, x }) => (
              <text
                key={year}
                x={x} y="340"
                textAnchor="middle"
                fontSize={year === 2026 ? '13' : '12'}
                fill={year === 2026 ? '#d1d5db' : '#6b7280'}
                fontWeight={year === 2026 ? 'bold' : 'normal'}
                fontFamily="'JetBrains Mono', monospace"
              >
                {year === 2033 ? '…' : year}
              </text>
            ))}

            {/* X-axis "Year" label */}
            <text x="425" y="360" textAnchor="middle" fontSize="12" fill="#4b5563" fontFamily="Arial, sans-serif">
              {locale === 'es' ? 'Año' : 'Year'}
            </text>

            {/* Zone labels */}
            <text x="78" y="52" fontSize="13" fill="#3b82f6" opacity="0.65" fontFamily="Arial, sans-serif" fontStyle="italic">
              {locale === 'es' ? 'Democracia' : 'Democracy'}
            </text>
            <text x="78" y="315" fontSize="13" fill="#ef4444" opacity="0.55" fontFamily="Arial, sans-serif" fontStyle="italic">
              {locale === 'es' ? 'Autocracia' : 'Autocracy'}
            </text>

            {/* Now-line */}
            <line
              x1={CIRCLE_X} y1="30" x2={CIRCLE_X} y2="320"
              stroke="#6b7280"
              strokeWidth="0.9"
              strokeDasharray="4,3"
              opacity="0.65"
            />

            {/* Rotated "Maduro's extraction" label — hidden on mobile */}
            <text
              className="hidden sm:block"
              transform={`rotate(-90, ${CIRCLE_X + 11}, 115)`}
              x={CIRCLE_X + 11} y="115"
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
              fontFamily="Arial, sans-serif"
              fontStyle="italic"
            >
              {locale === 'es'
                ? 'Extracción de Maduro · 3 ene. 2026'
                : "Maduro's extraction · Jan. 3, 2026"}
            </text>

            {/* Historical pre-2026 line */}
            <path
              d={`M 70,${CIRCLE_Y} C 110,${CIRCLE_Y} 140,${CIRCLE_Y} ${CIRCLE_X},${CIRCLE_Y}`}
              fill="none"
              stroke="#6b7280"
              strokeWidth="5"
              strokeLinecap="butt"
            />

            {/* ── Scenario paths — click to select ─────────────────────────── */}
            {SCENARIOS.map(s => {
              const isActive = activeKey === s.key
              const isDimmed = activeKey !== null && !isActive
              return (
                <g
                  key={s.key}
                  onClick={(e) => toggleScenario(s.key, e)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Wide transparent hit-area for easy tapping */}
                  <path
                    d={s.pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="24"
                  />

                  {/* Visible stroke */}
                  <path
                    d={s.pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={isActive ? 10 : 7}
                    strokeLinecap="butt"
                    strokeLinejoin="round"
                    opacity={isDimmed ? 0.15 : isActive ? 1 : 0.82}
                    markerEnd={`url(#tp-arrow-${s.key}${isActive ? '-active' : ''})`}
                    pointerEvents="none"
                    style={{
                      transition: 'opacity 0.2s ease, stroke-width 0.2s ease',
                      filter: isActive ? `drop-shadow(0 0 9px ${s.color}65)` : 'none',
                    }}
                  />

                  {/* Endpoint label */}
                  <text
                    x={s.labelX}
                    y={s.labelY}
                    fontSize="12"
                    fill="#e5e7eb"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="bold"
                    opacity={isDimmed ? 0.15 : 1}
                    pointerEvents="none"
                    style={{ transition: 'opacity 0.2s ease' }}
                  >
                    {`S${s.num}`}
                  </text>
                </g>
              )
            })}

            {/* Circle — drawn last, sits on top of all paths */}
            <circle cx={CIRCLE_X} cy={CIRCLE_Y} r="11" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
            <circle cx={CIRCLE_X} cy={CIRCLE_Y} r="4.5" fill="#e5e7eb" />
          </svg>
        </div>

        {/* ── Legend chips ────────────────────────────────────────────────── */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SCENARIOS.map(s => (
            <button
              key={s.key}
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all duration-150"
              style={{
                backgroundColor: activeKey === s.key ? `${s.color}20` : 'transparent',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: activeKey === s.key ? `${s.color}60` : `${s.color}28`,
                opacity: activeKey !== null && activeKey !== s.key ? 0.38 : 1,
              }}
              onClick={() => toggleChip(s.key)}
            >
              {(() => { const Icon = SCENARIO_ICONS[s.key]; return <Icon size={13} style={{ color: s.color }} className="flex-shrink-0" /> })()}
              <span className="text-umbral-light font-mono">{`S${s.num}`}</span>
              <span className="text-umbral-muted hidden sm:inline">
                {t(`scenarios.${s.key}.name`)}
              </span>
            </button>
          ))}
        </div>

        {/* ── Description card ───────────────────────────────────────────── */}
        <div className="mt-5 min-h-[76px]">
          {active ? (
            <div
              className="p-4 rounded-lg border transition-all duration-200"
              style={{
                borderColor: `${active.color}40`,
                backgroundColor: `${active.color}09`,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${active.color}25`, color: active.color }}
                >
                  {active.num}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {t(`scenarios.${active.key}.name`)}
                  </h4>
                  <p className="text-xs text-umbral-muted leading-relaxed">
                    {t(`scenarios.trajectoryPanel.scenarios.${active.key}.description`)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveKey(null)}
                  className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md hover:bg-umbral-ash/30 transition-colors text-umbral-muted hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[76px] rounded-lg border border-umbral-ash/30">
              <p className="text-xs text-umbral-muted/50 font-mono tracking-wide">
                {locale === 'es'
                  ? '↑ Selecciona una trayectoria para ver detalles'
                  : '↑ Select a trajectory to see scenario details'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-4 border-t border-umbral-ash/50"
        style={{ background: 'linear-gradient(135deg, #3b82f605, transparent)' }}
      >
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-umbral-muted flex-shrink-0 mt-0.5" />
          <p className="text-xs text-umbral-muted leading-relaxed">
            {t('scenarios.trajectoryPanel.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  )
}
