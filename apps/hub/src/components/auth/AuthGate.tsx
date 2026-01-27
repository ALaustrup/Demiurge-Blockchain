'use client';

import { useAuth } from '@/contexts/AuthContext';
import { QorIdAuthFlow } from './QorIdAuthFlow';

/**
 * AuthGate Component
 * 
 * This is the MASTER authentication gate for the entire Demiurge ecosystem.
 * 
 * SECURITY PRINCIPLE:
 * - Users MUST authenticate with QOR ID BEFORE accessing ANY on-chain features
 * - Unauthenticated users see ONLY the login/signup flow
 * - Once authenticated, users NEVER see login prompts again during their session
 * - ALL chain interactions require active authentication
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-void">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-cyan border-r-neon-magenta animate-spin" />
            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 animate-pulse" />
          </div>
          <p className="text-gray-400 font-body text-sm">Initializing Demiurge...</p>
        </div>
      </div>
    );
  }

  // NOT AUTHENTICATED: Show login/signup flow as the ONLY option
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-deep-void relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-ultraviolet/20 via-deep-void to-deep-void" />
        
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-neon-cyan/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-4">
              DEMIURGE
            </h1>
            <p className="text-xl text-gray-400 font-body">
              The Metaverse Operating System
            </p>
          </div>

          {/* Auth Flow Container */}
          <div className="w-full max-w-md">
            <QorIdAuthFlow
              isOpen={true}
              onClose={() => {}} // Cannot close - must authenticate
              onSuccess={() => {
                // Refresh the page to load authenticated state
                window.location.reload();
              }}
              variant="page"
            />
          </div>

          {/* "What is Demiurge?" link */}
          <div className="mt-8 text-center">
            <a
              href="https://demiurge.guru"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan hover:text-neon-magenta transition-colors text-sm font-body inline-flex items-center gap-2"
            >
              <span>What is Demiurge Blockchain?</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-gray-600 font-body">
            <p>Secured by QOR ID Authentication</p>
            <p className="mt-1">Ed25519 · WASM Signing · Zero Extensions</p>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED: Show the actual application content
  return <>{children}</>;
}
