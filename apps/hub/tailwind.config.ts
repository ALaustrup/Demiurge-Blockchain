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
      fontFamily: {
        'orbitron': ['var(--font-orbitron)', 'sans-serif'],
        'rajdhani': ['var(--font-rajdhani)', 'sans-serif'],
        'body': ['var(--font-space-grotesk)', 'sans-serif'],
      },
      colors: {
        // ═══════════════════════════════════════════════════════════
        // DEMIURGE OS - Deep Space Cyber-Noir Palette
        // ═══════════════════════════════════════════════════════════
        
        // Core backgrounds
        'void': '#030205',           // Deep Void/Obsidian - primary background
        'ultraviolet': '#281C55',    // Ultraviolet - panel backgrounds
        'obsidian': '#0D0A14',       // Obsidian - secondary surfaces
        
        // Primary accents
        'holographic': '#CDABC3',    // Holographic Pink - primary accent
        'lavender': '#725A8D',       // Electric Lavender - active states
        'nebula': '#4A3B6B',         // Nebula - tertiary accent
        
        // Data & status colors
        'data-cyan': '#00D4FF',      // Data streams, positive indicators
        'data-magenta': '#FF00AA',   // Alerts, energy, important data
        'data-gold': '#FFD700',      // Rewards, achievements
        'data-green': '#00FF88',     // Success, health, growth
        
        // Legacy colors (keep for backwards compatibility)
        'demiurge-cyan': '#00f2ff',
        'demiurge-violet': '#7000ff',
        'demiurge-gold': '#ffd700',
        'demiurge-dark': '#0a0a0f',
        'neon-cyan': '#00ffff',
        'neon-magenta': '#ff00ff',
        'neon-green': '#00ff88',
        'neon-purple': '#9d00ff',
        'blockchain-dark': '#050510',
      },
      backdropBlur: {
        'glass': '20px',
        'ultra': '40px',
      },
      boxShadow: {
        'holo': '0 0 30px rgba(205, 171, 195, 0.3), inset 0 0 20px rgba(205, 171, 195, 0.1)',
        'holo-intense': '0 0 50px rgba(205, 171, 195, 0.5), inset 0 0 30px rgba(205, 171, 195, 0.2)',
        'lavender': '0 0 20px rgba(114, 90, 141, 0.4)',
        'data': '0 0 15px rgba(0, 212, 255, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 20s infinite ease-in-out',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'starfield': 'starfield 100s linear infinite',
        'data-stream': 'data-stream 2s linear infinite',
        'holo-shimmer': 'holo-shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '25%': { transform: 'translateY(-20px) translateX(10px)' },
          '50%': { transform: 'translateY(-10px) translateX(-10px)' },
          '75%': { transform: 'translateY(-30px) translateX(5px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'starfield': {
          '0%': { transform: 'translateZ(0px)' },
          '100%': { transform: 'translateZ(1000px)' },
        },
        'data-stream': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'holo-shimmer': {
          '0%, 100%': { 
            backgroundPosition: '0% 50%',
            filter: 'hue-rotate(0deg)',
          },
          '50%': { 
            backgroundPosition: '100% 50%',
            filter: 'hue-rotate(15deg)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'holo-gradient': 'linear-gradient(135deg, #CDABC3, #725A8D, #281C55)',
      },
    },
  },
  plugins: [],
}

export default config
