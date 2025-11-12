/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Slay the Spire themed colors - darker, richer palette
        'sts-dark': '#16161d',
        'sts-darker': '#0a0a0f',
        'sts-darkest': '#050508',
        'sts-light': '#f5f1e3',
        'sts-gold': '#d4af37',
        'sts-bronze': '#8b6f47',
        // Character colors - more saturated
        'ironclad': '#c53030',
        'silent': '#22c55e',
        'defect': '#3b82f6',
        'watcher': '#8b5cf6',
        // Card type colors
        'card-attack': '#dc2626',
        'card-skill': '#16a34a',
        'card-power': '#2563eb',
        'card-curse': '#7c2d12',
        'card-status': '#6b7280',
      },
      backgroundImage: {
        'panel-texture': "url('/images/ui/panels/menuPanel.png')",
      },
      boxShadow: {
        'sts': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'sts-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
        'sts-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
