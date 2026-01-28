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
      <div className="min-h-screen bg-void relative overflow-hidden">
        {/* Background gradient layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-radial from-neon-cyan/[0.03] via-transparent to-transparent" 
            style={{ transform: 'translate(-30%, -30%)' }} />
          <div className="absolute inset-0 bg-gradient-radial from-neon-purple/[0.02] via-transparent to-transparent"
            style={{ transform: 'translate(30%, 30%)' }} />
        </div>
        
        {/* Sacred geometry grid */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 229, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center top',
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-neon-cyan/40 rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animation: `float-subtle ${8 + Math.random() * 6}s cubic-bezier(0.87, 0, 0.13, 1) infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          {/* Logo and branding */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-4">
              {/* Logo box */}
              <div className="w-16 h-16 rounded-lg bg-white/[0.02] border border-neon-cyan/20
                flex items-center justify-center mx-auto mb-6">
                <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-neon-cyan/50" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-neon-cyan/50" />
                <span className="font-display text-2xl text-neon-cyan">D</span>
              </div>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl tracking-[0.15em] mb-3">
              <span className="text-neon-gradient">DEMIURGE</span>
            </h1>
            <p className="font-mono text-[11px] text-text-tertiary tracking-[0.2em] uppercase">
              Command Terminal v2.0
            </p>
          </div>

          {/* Auth Flow Container */}
          <div className="w-full max-w-md">
            <QorIdAuthFlow
              isOpen={true}
              onClose={() => {}} // Cannot close - must authenticate
              onSuccess={() => {
                // AuthContext is now updated via refreshUser() in QorIdAuthFlow
                // No page reload needed - React will re-render with authenticated state
              }}
              variant="page"
            />
          </div>

          {/* "What is Demiurge?" link */}
          <div className="mt-10 text-center">
            <a
              href="https://demiurge.guru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md
                border border-white/[0.06] bg-white/[0.02]
                font-mono text-[10px] text-text-secondary tracking-wider
                hover:border-neon-cyan/30 hover:text-neon-cyan
                transition-all duration-300"
            >
              <span>What is Demiurge Blockchain?</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="font-mono text-[9px] text-text-tertiary/60 tracking-widest uppercase">
              Ed25519 · WASM Signing · Zero Extensions
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
