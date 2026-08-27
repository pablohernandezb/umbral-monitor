'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: number
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  format?: 'number' | 'percentage'
  className?: string
  size?: 'default' | 'large'
  icon?: React.ReactNode
  /**
   * Doubles the icon's box (40px -> 48px, sized to fit a w-12 icon). Opt-in so
   * the other MetricCard consumers — the landing page, blocking dashboard and
   * gaceta tab — keep their current proportions untouched.
   */
  iconSize?: 'default' | 'large'
}

export function MetricCard({
  label,
  value,
  trend,
  format = 'number',
  className,
  size = 'default',
  icon,
  iconSize = 'default'
}: MetricCardProps) {
  const formattedValue = format === 'percentage' 
    ? `${value}%` 
    : formatNumber(value)

  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
    ? TrendingDown 
    : Minus

  return (
    <div className={cn('metric-card', className)}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex-shrink-0 text-umbral-muted">
            <div
              className={cn(
                'flex items-center justify-center',
                iconSize === 'large' ? 'w-12 h-12' : 'w-10 h-10'
              )}
            >
              {icon}
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="metric-label mb-1">{label}</p>
          
          <div className="flex items-end justify-between gap-2">
            <p className={cn(
              'font-bold text-white font-mono',
              size === 'large' ? 'text-5xl' : 'text-2xl'
            )}>
              {formattedValue}
            </p>

            {trend && (
              <div className="flex flex-col items-end gap-0.5 pb-1">
                <div className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  trend.direction === 'up' && 'text-signal-red',
                  trend.direction === 'down' && 'text-signal-teal',
                  trend.direction === 'neutral' && 'text-umbral-muted'
                )}>
                  <TrendIcon className="w-3 h-3" />
                  <span>
                    {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '-')}
                    {Math.abs(trend.value)}
                  </span>
                </div>
                {trend.label && (
                  <span className="text-[10px] text-umbral-muted text-right">{trend.label}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
