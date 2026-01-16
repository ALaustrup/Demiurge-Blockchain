'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DemiurgeIntro } from '@/components/DemiurgeIntro';
import { QorIdAuthFlow } from '@/components/auth/QorIdAuthFlow';
import { qorAuth } from '@demiurge/qor-sdk';

interface Particle {
  width: string;
  height: string;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

export default function Home() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsAuthenticated(qorAuth.isAuthenticated());
    
    // Generate particles only on client side
    const generatedParticles: Particle[] = Array.from({ length: 30 }, () => ({
      width: Math.random() * 6 + 3 + 'px',
      height: Math.random() * 6 + 3 + 'px',
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      animationDelay: Math.random() * 5 + 's',
      animationDuration: Math.random() * 15 + 15 + 's',
    }));
    setParticles(generatedParticles);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    if (!isAuthenticated) {
      setShowAuth(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuth(false);
    router.refresh();
  };

  // Show intro first
  if (showIntro) {
    return <DemiurgeIntro onComplete={handleIntroComplete} />;
  }

  // Show auth flow if not authenticated
  if (showAuth && !isAuthenticated) {
    return (
      <>
        <QorIdAuthFlow
          isOpen={true}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#050510]" />
      </>
    );
  }

  // Main homepage content
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Dynamic Animated Background */}
      <div 
        className="fixed inset-0 opacity-30 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(0,255,255,0.25) 0%, 
            rgba(255,0,255,0.2) 30%, 
            rgba(0,255,136,0.15) 60%, 
            transparent 80%)`,
        }}
      />
      
      {/* Floating Particles */}
      {isMounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: particle.width,
                height: particle.height,
                left: particle.left,
                top: particle.top,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration,
                background: i % 3 === 0 
                  ? 'radial-gradient(circle, rgba(0,255,255,0.7), transparent)'
                  : i % 3 === 1
                  ? 'radial-gradient(circle, rgba(255,0,255,0.7), transparent)'
                  : 'radial-gradient(circle, rgba(0,255,136,0.7), transparent)',
                boxShadow: `0 0 ${Math.random() * 15 + 8}px currentColor`,
              }}
            />
          ))}
        </div>
      )}

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 opacity-5 neon-grid pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12">
          {/* Main Logo/Title */}
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-grunge relative">
              <span 
                className="block text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green"
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(0,255,255,0.6)) drop-shadow(0 0 60px rgba(255,0,255,0.4))',
                  textShadow: '0 0 40px rgba(0,255,255,0.8), 0 0 80px rgba(255,0,255,0.6)',
                }}
              >
                DEMIURGE
              </span>
              <span className="block text-2xl md:text-4xl mt-4 font-grunge-alt text-neon-cyan tracking-[0.3em] chroma-glow">
                .CLOUD
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 font-body font-light max-w-3xl mx-auto leading-relaxed">
              The Metaverse Operating System
            </p>
            <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto font-body italic">
              From the Monad, all emanates. To the Pleroma, all returns.
            </p>
          </div>

          {/* Ecosystem Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full mt-8">
            {/* Portal */}
            <Link href="/portal" className="group">
              <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]">🎮</div>
                  <h3 className="text-2xl font-grunge-alt text-neon-cyan mb-2 chroma-glow">PORTAL</h3>
                  <p className="text-gray-300 font-body text-sm">Enter the realm of infinite games</p>
                  <div className="mt-4 text-neon-magenta group-hover:translate-x-2 transition-transform inline-block font-grunge-alt text-sm">
                    → ENTER
                  </div>
                </div>
              </div>
            </Link>

            {/* NFT Portal */}
            <Link href="/nft-portal" className="group">
              <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_15px_rgba(255,0,255,0.6)]">🎨</div>
                  <h3 className="text-2xl font-grunge-alt text-neon-purple mb-2 chroma-glow">NFT PORTAL</h3>
                  <p className="text-gray-300 font-body text-sm">Manage DRC-369 assets</p>
                  <div className="mt-4 text-neon-pink group-hover:translate-x-2 transition-transform inline-block font-grunge-alt text-sm">
                    → OPEN
                  </div>
                </div>
              </div>
            </Link>

            {/* Marketplace */}
            <Link href="/marketplace" className="group">
              <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]">🛒</div>
                  <h3 className="text-2xl font-grunge-alt text-neon-green mb-2 chroma-glow">MARKETPLACE</h3>
                  <p className="text-gray-300 font-body text-sm">Discover DRC-369 assets</p>
                  <div className="mt-4 text-neon-cyan group-hover:translate-x-2 transition-transform inline-block font-grunge-alt text-sm">
                    → EXPLORE
                  </div>
                </div>
              </div>
            </Link>

            {/* Social */}
            <Link href="/social" className="group">
              <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_15px_rgba(255,0,128,0.6)]">🌐</div>
                  <h3 className="text-2xl font-grunge-alt text-neon-pink mb-2 chroma-glow">VYB SOCIAL</h3>
                  <p className="text-gray-300 font-body text-sm">Connect with the Pantheon</p>
                  <div className="mt-4 text-neon-magenta group-hover:translate-x-2 transition-transform inline-block font-grunge-alt text-sm">
                    → CONNECT
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {!isAuthenticated ? (
              <button
                onClick={() => setShowAuth(true)}
                className="neon-button px-12 py-4 text-lg"
              >
                CONNECT WITH QOR ID
              </button>
            ) : (
              <Link
                href="/portal"
                className="neon-button px-12 py-4 text-lg"
              >
                ENTER PORTAL
              </Link>
            )}
            <Link
              href="/wallet"
              className="neon-button bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white border-none px-12 py-4 text-lg"
            >
              WALLET
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 glass-panel liquid-border p-6 rounded-xl max-w-4xl w-full">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-grunge text-neon-cyan chroma-glow">13B</div>
                <div className="text-xs text-gray-400 font-body uppercase tracking-wider mt-2">CGT Supply</div>
              </div>
              <div>
                <div className="text-4xl font-grunge text-neon-magenta chroma-glow">∞</div>
                <div className="text-xs text-gray-400 font-body uppercase tracking-wider mt-2">Games</div>
              </div>
              <div>
                <div className="text-4xl font-grunge text-neon-green chroma-glow">QOR</div>
                <div className="text-xs text-gray-400 font-body uppercase tracking-wider mt-2">Identity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="fixed bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none z-0">
          <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-blockchain-dark to-transparent" />
          <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="neonWave" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,255,255,0.3)" />
                <stop offset="50%" stopColor="rgba(255,0,255,0.3)" />
                <stop offset="100%" stopColor="rgba(0,255,136,0.3)" />
              </linearGradient>
            </defs>
            <path
              d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z"
              fill="url(#neonWave)"
              className="animate-wave"
              filter="drop-shadow(0 0 20px rgba(0,255,255,0.4))"
            />
          </svg>
        </div>
      </div>

      {/* Auth Flow Modal */}
      {showAuth && (
        <QorIdAuthFlow
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </main>
  );
}
