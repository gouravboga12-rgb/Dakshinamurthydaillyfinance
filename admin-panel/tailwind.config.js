/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Navy — sidebar / dark elements
        primary: {
          DEFAULT: '#0D1B2A',   // Deep navy
          light:   '#1A2E45',   // Slightly lighter navy
          dark:    '#060F18',   // Near-black navy
        },
        // Gold — brand accent (matches customer app yellow)
        brand: {
          DEFAULT: '#D4A017',   // Deep gold
          light:   '#F0C040',   // Bright gold
          muted:   '#B8860B',   // Dark goldenrod
          pale:    '#FDF6DC',   // Pale gold background
        },
        // Semantic colors
        success: {
          DEFAULT: '#16A34A',
          light:   '#DCFCE7',
          text:    '#15803D',
        },
        warning: {
          DEFAULT: '#D97706',
          light:   '#FEF3C7',
          text:    '#B45309',
        },
        danger: {
          DEFAULT: '#DC2626',
          light:   '#FEE2E2',
          text:    '#B91C1C',
        },
        info: {
          DEFAULT: '#2563EB',
          light:   '#DBEAFE',
          text:    '#1D4ED8',
        },
        // Neutral / Background
        background: '#F5F3EF',  // Warm off-white
        surface:    '#FFFFFF',
        border:     '#E8E2D9',   // Warm border
        muted:      '#78716C',   // Warm gray
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 4px 24px rgba(212, 160, 23, 0.18)',
        'card':  '0 2px 12px rgba(13, 27, 42, 0.06)',
        'navy':  '0 8px 32px rgba(13, 27, 42, 0.20)',
      },
    },
  },
  plugins: [],
}
