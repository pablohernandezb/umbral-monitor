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
}

export function MetricCard({
  label,
  value,
  trend,
  format = 'number',
  className,
  size = 'default',
  icon
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
            <div className="w-10 h-10 flex items-center justify-center">
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
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium pb-1',
                trend.direction === 'up' && 'text-signal-red',
                trend.direction === 'down' && 'text-signal-teal',
                trend.direction === 'neutral' && 'text-umbral-muted'
              )}>
                <TrendIcon className="w-3 h-3" />
                <span>
                  {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '-')}
                  {Math.abs(trend.value)}
                </span>
                {trend.label && (
                  <span className="text-umbral-muted">{trend.label}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
