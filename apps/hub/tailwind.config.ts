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
        'orbitron': ['var(--font-orbitron)', 'SF Pro Display', 'system-ui', 'sans-serif'],
        'rajdhani': ['var(--font-rajdhani)', 'system-ui', 'sans-serif'],
        'body': ['var(--font-space-grotesk)', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // ═══════════════════════════════════════════════════════════════════
        // DEMIURGE OS - Dark-Mode Ethereal Glassmorphism Palette
        // ═══════════════════════════════════════════════════════════════════
        
        // Void Black spectrum
        'void': {
          DEFAULT: '#050505',
          deep: '#020203',
          surface: '#0a0a0b',
          elevated: '#0f0f10',
        },
        
        // Neon accent colors - cold, clinical, monochromatic
        'neon': {
          cyan: '#00E5FF',
          'cyan-dim': '#00A5B5',
          purple: '#9D4EDD',
          'purple-dim': '#7B2CBF',
          white: '#E8E8E8',
        },
        
        // Status colors
        'status': {
          online: '#00FF94',
          warning: '#FFB800',
          error: '#FF3366',
          info: '#00B4D8',
        },
        
        // Text hierarchy
        'text': {
          primary: '#FAFAFA',
          secondary: '#A0A0A0',
          tertiary: '#606060',
          muted: '#404040',
        },
        
        // Glass opacity values (for reference)
        'glass': {
          subtle: 'rgba(255, 255, 255, 0.03)',
          medium: 'rgba(255, 255, 255, 0.05)',
          elevated: 'rgba(255, 255, 255, 0.08)',
        },
        
        // Legacy compatibility colors
        'deep-void': '#050505',
        'holographic': '#00E5FF',
        'lavender': '#9D4EDD',
        'data-cyan': '#00E5FF',
        'data-magenta': '#FF3366',
        'data-green': '#00FF94',
        'data-gold': '#FFB800',
        'ultraviolet': '#0f0f10',
        'obsidian': '#0a0a0b',
        'nebula': '#7B2CBF',
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      
      backdropBlur: {
        'glass': '24px',
        'ultra': '40px',
        'extreme': '60px',
      },
      
      boxShadow: {
        // Bioluminescent glow effects
        'neon-cyan': '0 0 20px rgba(0, 229, 255, 0.3), 0 0 40px rgba(0, 229, 255, 0.15)',
        'neon-cyan-intense': '0 0 30px rgba(0, 229, 255, 0.5), 0 0 60px rgba(0, 229, 255, 0.25), 0 0 100px rgba(0, 229, 255, 0.1)',
        'neon-purple': '0 0 20px rgba(157, 78, 221, 0.3), 0 0 40px rgba(157, 78, 221, 0.15)',
        'neon-white': '0 0 20px rgba(232, 232, 232, 0.2), 0 0 40px rgba(232, 232, 232, 0.1)',
        
        // Glass panel shadows
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-elevated': '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 229, 255, 0.05)',
        
        // Inner glow
        'inner-glow': 'inset 0 0 30px rgba(0, 229, 255, 0.05)',
        
        // Status shadows
        'status-online': '0 0 12px #00FF94',
        'status-error': '0 0 12px #FF3366',
        'status-warning': '0 0 12px #FFB800',
      },
      
      animation: {
        // Core breathing/pulsing
        'breathing': 'breathing 4s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'breathing-slow': 'breathing 8s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        
        // Data animations
        'data-pulse': 'data-pulse 2s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'data-stream': 'data-stream 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        
        // Floating/movement
        'float': 'float-subtle 6s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'float-slow': 'float-subtle 10s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        
        // Border effects
        'border-flow': 'border-flow 3s linear infinite',
        
        // Entrance animations
        'fade-in': 'fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        
        // Glow pulse
        'glow-pulse': 'glow-pulse 3s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        
        // Status
        'status-pulse': 'status-pulse 2s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        
        // Scan line
        'scan': 'scan-line 6s cubic-bezier(0.87, 0, 0.13, 1) infinite',
      },
      
      keyframes: {
        'breathing': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.85', filter: 'brightness(0.95)' },
        },
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 229, 255, 0.5), 0 0 60px rgba(0, 229, 255, 0.25)' },
        },
        'data-pulse': {
          '0%, 100%': { 
            opacity: '1',
            textShadow: '0 0 12px rgba(0, 229, 255, 0.5)',
          },
          '50%': { 
            opacity: '0.7',
            textShadow: '0 0 20px rgba(0, 229, 255, 0.5), 0 0 40px rgba(0, 229, 255, 0.5)',
          },
        },
        'data-stream': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'float-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 229, 255, 0.5), 0 0 60px rgba(0, 229, 255, 0.2)' },
        },
        'status-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.6' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '0.3' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
      },
      
      backgroundImage: {
        // Gradient backgrounds
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        
        // Neon gradients
        'neon-gradient': 'linear-gradient(135deg, #00E5FF 0%, #9D4EDD 100%)',
        'neon-gradient-horizontal': 'linear-gradient(90deg, #00E5FF 0%, #9D4EDD 100%)',
        
        // Border shine
        'border-shine': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
        'border-neon': 'linear-gradient(90deg, transparent 0%, #00E5FF 50%, transparent 100%)',
        
        // Void gradients
        'void-radial': 'radial-gradient(ellipse at center, #0a0a0b 0%, #050505 100%)',
        'void-spotlight': 'radial-gradient(ellipse at 50% 0%, rgba(0, 229, 255, 0.1) 0%, transparent 50%)',
      },
      
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
}

export default config
