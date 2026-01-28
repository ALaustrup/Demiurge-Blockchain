'use client';

import { useAuth } from '@/contexts/AuthContext';
import { QorIdAuthFlow } from './QorIdAuthFlow';

/**
 * AuthGate Component
 * 
 * Master authentication gate for the Demiurge ecosystem.
 * Dark-Mode Ethereal Glassmorphism design.
 * 
 * SECURITY PRINCIPLE:
 * - Users MUST authenticate with QOR ID BEFORE accessing ANY on-chain features
 * - Unauthenticated users see ONLY the login/signup flow
 * - Once authenticated, users NEVER see login prompts again during their session
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();

  // ─────────────────────────────────────────────────────────────────────────
  // Loading State - Minimal spinner with void background
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-lg border border-neon-cyan/30 animate-spin"
              style={{ animationDuration: '3s' }} />
            {/* Inner glow */}
            <div className="absolute inset-3 rounded-md bg-neon-cyan/10 animate-breathing" />
            {/* Center dot */}
            <div className="absolute inset-[45%] rounded-full bg-neon-cyan shadow-neon-cyan" />
          </div>
          <p className="font-mono text-[11px] text-text-tertiary tracking-widest uppercase">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Unauthenticated State - Full-screen login flow
  // ─────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-void relative overflow-hidden flex flex-col">
        {/* Animated background gradient */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 animate-breathing"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 20% 40%, rgba(0, 229, 255, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 80% 60%, rgba(157, 78, 221, 0.06) 0%, transparent 50%),
                radial-gradient(ellipse 40% 30% at 50% 80%, rgba(0, 229, 255, 0.04) 0%, transparent 40%)
              `
            }}
          />
          {/* Moving gradient orbs */}
          <div 
            className="absolute w-[600px] h-[600px] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, transparent 70%)',
              left: '10%',
              top: '20%',
              animation: 'float-subtle 20s ease-in-out infinite',
              filter: 'blur(60px)',
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(157, 78, 221, 0.15) 0%, transparent 70%)',
              right: '5%',
              bottom: '10%',
              animation: 'float-subtle 25s ease-in-out infinite reverse',
              filter: 'blur(80px)',
            }}
          />
        </div>
        
        {/* Sacred geometry grid - more visible */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 229, 255, 0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 255, 0.6) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            transform: 'perspective(800px) rotateX(65deg)',
            transformOrigin: 'center top',
          }}
        />
        
        {/* Floating particles - more of them */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                background: i % 3 === 0 ? 'rgba(0, 229, 255, 0.6)' : i % 3 === 1 ? 'rgba(157, 78, 221, 0.5)' : 'rgba(255, 255, 255, 0.4)',
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 90}%`,
                animation: `float-subtle ${6 + Math.random() * 8}s cubic-bezier(0.87, 0, 0.13, 1) infinite`,
                animationDelay: `${Math.random() * 5}s`,
                boxShadow: i % 3 === 0 ? '0 0 8px rgba(0, 229, 255, 0.8)' : i % 3 === 1 ? '0 0 8px rgba(157, 78, 221, 0.8)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Main content - vertically centered and compact */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6">
          {/* Logo and branding - condensed */}
          <div className="text-center mb-6">
            {/* Logo box with hover glow */}
            <div className="relative inline-block group cursor-pointer mb-4">
              <div className="w-14 h-14 rounded-lg bg-white/[0.03] border border-neon-cyan/30
                flex items-center justify-center mx-auto
                transition-all duration-500 group-hover:border-neon-cyan/60 group-hover:shadow-neon-cyan group-hover:bg-white/[0.05]">
                <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-neon-cyan/50 transition-all group-hover:border-neon-cyan group-hover:w-4 group-hover:h-4" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-neon-cyan/50 transition-all group-hover:border-neon-cyan group-hover:w-4 group-hover:h-4" />
                <span className="font-display text-2xl text-neon-cyan transition-all group-hover:text-shadow-neon-cyan">D</span>
              </div>
            </div>
            
            <h1 className="font-display text-3xl md:text-4xl tracking-[0.15em] mb-1">
              <span className="text-neon-gradient">DEMIURGE</span>
            </h1>
            <p className="font-mono text-[10px] text-text-tertiary tracking-[0.2em] uppercase">
              Command Terminal v2.0
            </p>
          </div>

          {/* Auth Flow Container - with hover glow effect on edges */}
          <div className="w-full max-w-md relative group">
            {/* Neon glow border on hover */}
            <div className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.3), rgba(157, 78, 221, 0.3), rgba(0, 229, 255, 0.3))',
                filter: 'blur(4px)',
              }}
            />
            <div className="relative">
              <QorIdAuthFlow
                isOpen={true}
                onClose={() => {}}
                onSuccess={() => {}}
                variant="page"
              />
            </div>
          </div>

          {/* Links row - more compact */}
          <div className="mt-6 flex items-center gap-4">
            <a
              href="https://demiurge.guru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                border border-white/[0.08] bg-white/[0.02]
                font-mono text-[9px] text-text-secondary tracking-wider
                hover:border-neon-cyan/40 hover:text-neon-cyan hover:bg-neon-cyan/5 hover:shadow-neon-cyan/20
                transition-all duration-300"
            >
              <span>Learn More</span>
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <span className="text-text-tertiary/40 text-[8px]">·</span>
            <p className="font-mono text-[8px] text-text-tertiary/50 tracking-widest uppercase">
              Ed25519 · WASM · Zero Extensions
            </p>
          </div>
        </div>
        
        {/* Noise overlay */}
        <div className="noise-overlay" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Authenticated - Render application content
  // ─────────────────────────────────────────────────────────────────────────
  return <>{children}</>;
}
