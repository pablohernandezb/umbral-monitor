import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base dark palette
        umbral: {
          black: '#0a0a0b',
          charcoal: '#111113',
          slate: '#1a1a1e',
          ash: '#252529',
          steel: '#3a3a42',
          muted: '#6b6b76',
          light: '#9ca3af',
        },
        // Accent colors
        signal: {
          red: '#dc2626',
          'red-muted': '#7f1d1d',
          amber: '#f59e0b',
          'amber-muted': '#78350f',
          teal: '#14b8a6',
          'teal-muted': '#134e4a',
          green: '#22c55e',
          'green-muted': '#14532d',
          blue: '#3b82f6',
          'blue-muted': '#1e3a8a',
          purple: '#a855f7',
          'purple-muted': '#6b21a8',
        },
        // Status indicators
        status: {
          critical: '#ef4444',
          warning: '#f59e0b',
          stable: '#22c55e',
          neutral: '#6b7280',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xxs': '0.625rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.3)',
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}

export default config
