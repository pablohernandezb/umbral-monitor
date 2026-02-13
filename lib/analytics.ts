/**
 * Google Analytics Utilities
 * Helper functions for tracking custom events
 */

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
  }
}

/**
 * Track a page view
 */
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_path: url,
    })
  }
}

/**
 * Track a custom event
 * @param action - The action name (e.g., 'click', 'submit', 'download')
 * @param category - The event category (e.g., 'button', 'form', 'link')
 * @param label - Optional label for more context
 * @param value - Optional numeric value
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

/**
 * Track scenario card interactions
 */
export const trackScenarioView = (scenarioName: string) => {
  trackEvent('view', 'scenario', scenarioName)
}

/**
 * Track news article clicks
 */
export const trackNewsClick = (articleTitle: string, source: string) => {
  trackEvent('click', 'news', `${source}: ${articleTitle}`)
}

/**
 * Track language change
 */
export const trackLanguageChange = (language: string) => {
  trackEvent('change', 'language', language)
}

/**
 * Track reading room resource clicks
 */
export const trackResourceClick = (resourceTitle: string, resourceType: string) => {
  trackEvent('click', 'resource', resourceTitle, undefined)
  trackEvent('click', 'resource_type', resourceType)
}
