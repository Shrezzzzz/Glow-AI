/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'glow-bg':      '#F8F4EE',
        'glow-surface': '#FFFDF9',
        'glow-champagne': '#F5EFE6',
        'glow-gold':    '#D4AF6A',
        'glow-deep-gold': '#B78A3C',
        'glow-hover-gold': '#E4C488',
        'glow-rose':    '#F5EFE6',
        'glow-black':   '#0F0F10',
        'glow-ink':     '#1D1D1F',
        'glow-muted':   '#6B6B6B',
        'glow-border':  'rgba(212,175,106,0.18)',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        inter:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        luxury:    '0 14px 36px rgba(15,15,16,0.10), 0 0 0 1px rgba(212,175,106,0.08)',
        'luxury-lg': '0 24px 70px rgba(15,15,16,0.14), 0 0 42px rgba(212,175,106,0.14)',
        card:      '0 20px 60px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
