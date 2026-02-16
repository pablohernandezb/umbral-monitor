import type { GdeltDataPoint } from '@/types/gdelt'

function generateMockGdeltData(): GdeltDataPoint[] {
  const points: GdeltDataPoint[] = []
  const startDate = new Date('2025-10-20')

  for (let i = 0; i < 120; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    // Base values with noise
    let instability = 2.5 + Math.sin(i * 0.1) * 0.3 + (Math.random() - 0.5) * 0.4
    let tone = -3.5 + Math.sin(i * 0.08) * 0.5 + (Math.random() - 0.5) * 0.6
    let artvolnorm = 1.2 + Math.sin(i * 0.12) * 0.2 + (Math.random() - 0.5) * 0.3

    // Day ~75 = Jan 3 2026 (major event spike)
    const daysSinceJan3 = i - 75
    if (Math.abs(daysSinceJan3) <= 10) {
      const spike = Math.exp(-0.25 * Math.abs(daysSinceJan3))
      instability += 4.5 * spike
      tone -= 5.5 * spike
      artvolnorm += 3.5 * spike
    }

    // Day ~77 = Jan 5 (Delcy sworn in)
    if (Math.abs(i - 77) <= 5) {
      const spike = Math.exp(-0.4 * Math.abs(i - 77))
      instability += 2.0 * spike
      tone -= 2.0 * spike
      artvolnorm += 1.5 * spike
    }

    // Day ~82 = Jan 10 (Emergency decree)
    if (Math.abs(i - 82) <= 5) {
      const spike = Math.exp(-0.4 * Math.abs(i - 82))
      instability += 2.5 * spike
      tone -= 3.0 * spike
      artvolnorm += 2.0 * spike
    }

    // Day ~87 = Jan 15 (Machado meets Trump)
    if (Math.abs(i - 87) <= 4) {
      const spike = Math.exp(-0.5 * Math.abs(i - 87))
      instability += 0.8 * spike
      tone += 1.5 * spike
      artvolnorm += 1.8 * spike
    }

    // Gradual stabilization trend after Jan 20
    if (i > 92) {
      const decay = (i - 92) * 0.02
      instability -= Math.min(decay, 1.5)
      tone += Math.min(decay * 0.5, 0.8)
    }

    points.push({
      date: dateStr,
      instability: parseFloat(Math.max(0, instability).toFixed(4)),
      tone: parseFloat(tone.toFixed(4)),
      artvolnorm: parseFloat(Math.max(0, artvolnorm).toFixed(4)),
    })
  }
  return points
}

export const mockGdeltData: GdeltDataPoint[] = generateMockGdeltData()
