import { clsx, type ClassValue } from 'clsx'

/**
 * Merge class names with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

/**
 * Format a date relative to now
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins}m`
  } else if (diffHours < 24) {
    return `${diffHours}h`
  } else if (diffDays < 7) {
    return `${diffDays}d`
  } else {
    return then.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' })
  }
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-VE').format(num)
}

/**
 * Format a percentage
 */
export function formatPercentage(num: number): string {
  return `${num}%`
}

/**
 * Get probability label color class
 */
export function getProbabilityColor(label: string): string {
  switch (label) {
    case 'low':
      return 'text-signal-teal'
    case 'mediumLow':
      return 'text-signal-blue'
    case 'medium':
      return 'text-signal-amber'
    case 'mediumHigh':
      return 'text-signal-amber'
    case 'high':
      return 'text-signal-red'
    default:
      return 'text-umbral-muted'
  }
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'critical':
      return 'text-status-critical'
    case 'warning':
      return 'text-status-warning'
    case 'stable':
      return 'text-status-stable'
    case 'neutral':
    default:
      return 'text-status-neutral'
  }
}

/**
 * Get status background color class
 */
export function getStatusBgColor(status: string): string {
  switch (status) {
    case 'critical':
      return 'bg-signal-red/10 border-signal-red/30'
    case 'warning':
      return 'bg-signal-amber/10 border-signal-amber/30'
    case 'stable':
      return 'bg-signal-teal/10 border-signal-teal/30'
    case 'neutral':
    default:
      return 'bg-umbral-ash/50 border-umbral-steel/30'
  }
}

/**
 * Get scenario background color class
 */
export function getScenarioBgColor(status: string): string {
  switch (status) {
    case 'democraticTransition':
      //return 'bg-signal-blue/10 border-signal-blue/30'
    case 'preemptedDemocraticTransition':
      //return 'bg-signal-blue/10 border-signal-blue/30'
    case 'stabilizedElectoralAutocracy':
      //return 'bg-signal-blue/10 border-signal-blue/30'
    case 'revertedLiberalization':
      //return 'bg-signal-blue/10 border-signal-blue/30'
    case 'regressedAutocracy':
      //return 'bg-signal-blue/10 border-signal-blue/30'
    default:
      return 'bg-signal-blue/10 border-signal-blue/30'
  }
}

/**
 * Get icon for scenario status
 */
export function getStatusIcon(status: string): string {
  switch (status) {
    case 'critical':
      return 'alert-triangle'
    case 'warning':
      return 'alert-circle'
    case 'stable':
      return 'check-circle'
    case 'neutral':
    default:
      return 'minus-circle'
  }
}

/**
 * Calculate days since a date
 */
export function daysSince(date: string | Date): number {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  return Math.floor(diffMs / 86400000)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Generate a shareable URL for a specific view
 */
export function generateShareUrl(path: string, params?: Record<string, string>): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = new URL(path, baseUrl)
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  
  return url.toString()
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
