import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui-shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'demiurge-cyan': '#00f2ff',
        'demiurge-violet': '#7000ff',
        'demiurge-gold': '#ffd700',
        'demiurge-dark': '#0a0a0f',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'border-pulse': 'border-pulse 6s infinite alternate',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'border-pulse': {
          '0%': { filter: 'hue-rotate(0deg) brightness(1)' },
          '100%': { filter: 'hue-rotate(45deg) brightness(1.5)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
