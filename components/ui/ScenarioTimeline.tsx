'use client'

import { useState, forwardRef } from 'react'
import { X, Info } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Scenario } from '@/types'
import type { TimelinePhase } from '@/data/scenario-phases'

interface ScenarioTimelineProps {
  scenario: Scenario
  phases: TimelinePhase[]
  onClose: () => void
}

export const ScenarioTimeline = forwardRef<HTMLDivElement, ScenarioTimelineProps>(
  function ScenarioTimeline({ scenario, phases, onClose }, ref) {
  const { t } = useTranslation()
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)

  const color = '#3b82f6' // signal-blue

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-umbral-charcoal/80 backdrop-blur-sm',
        'animate-in slide-in-from-top-4 fade-in duration-500'
      )}
      style={{ borderColor: `${color}30` }}
    >
      {/* Header */}
      <div
        ref={ref}
        className="flex items-center justify-between px-6 py-4 border-b border-umbral-ash scroll-mt-32"
        style={{
          background: `linear-gradient(135deg, ${color}08, transparent)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          />
          <div>
            <h3 className="text-sm font-bold text-white">
              {t(`scenarios.${scenario.key}.name`)}
            </h3>
            <p className="text-xs text-umbral-muted">
              {t(`scenarios.${scenario.key}.description`)}
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

      {/* Timeline */}
      <div className="px-6 py-6">
        <div className="relative">
          {phases.map((phase, index) => {
            const isLast = index === phases.length - 1
            const isHovered = hoveredStep === index

            return (
              <div
                key={index}
                className="relative flex gap-5 group"
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300"
                    style={{
                      borderColor: isHovered ? color : `${color}40`,
                      backgroundColor: isHovered ? `${color}20` : 'transparent',
                      boxShadow: isHovered ? `0 0 20px ${color}30` : 'none',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: color,
                        opacity: isHovered ? 1 : 0.6,
                        transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  </div>
                  {!isLast && (
                    <div
                      className="w-0.5 flex-1 min-h-[40px] transition-colors duration-300"
                      style={{
                        backgroundColor: `${color}25`,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div
                  className={cn(
                    'pb-8 flex-1 transition-all duration-300',
                    isLast && 'pb-0'
                  )}
                >
                  <div
                    className="rounded-lg p-4 transition-all duration-300"
                    style={{
                      backgroundColor: isHovered ? `${color}08` : 'transparent',
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                    }}
                  >
                    <span
                      className="inline-block text-[10px] font-mono uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded-full"
                      style={{
                        color: color,
                        backgroundColor: `${color}15`,
                      }}
                    >
                      {t(phase.phase_label_key)}
                    </span>
                    <h4 className="text-sm font-semibold text-white mb-1">
                      {t(phase.title_key)}
                    </h4>
                    <p className="text-xs text-umbral-muted leading-relaxed">
                      {t(phase.description_key)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="px-6 py-4 border-t border-umbral-ash/50"
        style={{
          background: `linear-gradient(135deg, ${color}05, transparent)`,
        }}
      >
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-umbral-muted flex-shrink-0 mt-0.5" />
          <p className="text-xs text-umbral-muted leading-relaxed">
            {t('scenarios.timeline.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  )
})
