'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Particle {
  width: string;
  height: string;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Generate particles only on client side to avoid hydration mismatch
    const generatedParticles: Particle[] = Array.from({ length: 20 }, () => ({
      width: Math.random() * 4 + 2 + 'px',
      height: Math.random() * 4 + 2 + 'px',
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      animationDelay: Math.random() * 5 + 's',
      animationDuration: Math.random() * 10 + 10 + 's',
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

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background with Liquid Neon */}
      <div 
        className="fixed inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.15) 30%, rgba(0,255,136,0.1) 60%, transparent 80%)`,
          transition: 'background 0.5s ease-out',
        }}
      />
      
      {/* Floating Neon Particles */}
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
                  ? 'radial-gradient(circle, rgba(0,255,255,0.6), transparent)'
                  : i % 3 === 1
                  ? 'radial-gradient(circle, rgba(255,0,255,0.6), transparent)'
                  : 'radial-gradient(circle, rgba(0,255,136,0.6), transparent)',
                boxShadow: `0 0 ${Math.random() * 10 + 5}px currentColor`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-8">
          {/* Main Title with Grunge Style */}
          <h1 className="text-7xl md:text-9xl font-grunge mb-4 relative">
            <span className="grunge-text block">
              DEMIURGE
            </span>
            <span className="block text-3xl md:text-5xl mt-4 font-grunge-alt text-neon-cyan tracking-[0.2em] chroma-glow">
              .CLOUD
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-gray-200 font-body font-light mb-4">
            The Metaverse Operating System
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto font-body leading-relaxed">
            From the Monad, all emanates. To the Pleroma, all returns.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full mb-12">
          {/* Portal Card */}
          <Link href="/portal" className="group">
            <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">🎮</div>
              <h3 className="text-2xl font-grunge-alt text-neon-cyan mb-2 chroma-glow">CASINO PORTAL</h3>
              <p className="text-gray-300 font-body">Enter the realm of infinite games</p>
              <div className="mt-4 text-neon-magenta group-hover:translate-x-2 transition-transform inline-block font-grunge-alt">
                → ENTER
              </div>
            </div>
          </Link>

          {/* NFT Portal Card */}
          <Link href="/nft-portal" className="group">
            <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]">🎨</div>
              <h3 className="text-2xl font-grunge-alt text-neon-purple mb-2 chroma-glow">NFT PORTAL</h3>
              <p className="text-gray-300 font-body">Manage DRC-369 assets & collections</p>
              <div className="mt-4 text-neon-pink group-hover:translate-x-2 transition-transform inline-block font-grunge-alt">
                → OPEN
              </div>
            </div>
          </Link>

          {/* Marketplace Card */}
          <Link href="/marketplace" className="group">
            <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">🛒</div>
              <h3 className="text-2xl font-grunge-alt text-neon-green mb-2 chroma-glow">MARKETPLACE</h3>
              <p className="text-gray-300 font-body">Discover DRC-369 assets & NFTs</p>
              <div className="mt-4 text-neon-cyan group-hover:translate-x-2 transition-transform inline-block font-grunge-alt">
                → EXPLORE
              </div>
            </div>
          </Link>

          {/* Social Card */}
          <Link href="/social" className="group">
            <div className="glass-panel liquid-border p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_10px_rgba(255,0,128,0.5)]">🌐</div>
              <h3 className="text-2xl font-grunge-alt text-neon-pink mb-2 chroma-glow">VYB SOCIAL</h3>
              <p className="text-gray-300 font-body">Connect with the Pantheon</p>
              <div className="mt-4 text-neon-magenta group-hover:translate-x-2 transition-transform inline-block font-grunge-alt">
                → CONNECT
              </div>
            </div>
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="neon-button"
          >
            LOGIN / REGISTER
          </Link>
          <Link
            href="/play/galaga-creator"
            className="neon-button bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white border-none"
          >
            PLAY NOW
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 glass-panel liquid-border p-6 rounded-lg">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-grunge text-neon-cyan chroma-glow">13B</div>
              <div className="text-sm text-gray-400 font-body uppercase tracking-wider mt-2">CGT Supply</div>
            </div>
            <div>
              <div className="text-4xl font-grunge text-neon-magenta chroma-glow">∞</div>
              <div className="text-sm text-gray-400 font-body uppercase tracking-wider mt-2">Games</div>
            </div>
            <div>
              <div className="text-4xl font-grunge text-neon-green chroma-glow">QOR</div>
              <div className="text-sm text-gray-400 font-body uppercase tracking-wider mt-2">Identity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Animation with Neon Glow */}
      <div className="fixed bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-blockchain-dark to-transparent" />
        <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="neonWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,255,255,0.2)" />
              <stop offset="50%" stopColor="rgba(255,0,255,0.2)" />
              <stop offset="100%" stopColor="rgba(0,255,136,0.2)" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z"
            fill="url(#neonWave)"
            className="animate-wave"
            filter="drop-shadow(0 0 20px rgba(0,255,255,0.3))"
          />
        </svg>
      </div>
    </main>
  );
}
