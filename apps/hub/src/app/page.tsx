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
    <main className="min-h-screen relative overflow-hidden bg-demiurge-dark">
      {/* Animated Background Gradient */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(0,242,255,0.3) 0%, rgba(112,0,255,0.2) 50%, transparent 70%)`,
          transition: 'background 0.3s ease-out',
        }}
      />
      
      {/* Floating Particles */}
      {isMounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-demiurge-cyan opacity-20 animate-float"
              style={{
                width: particle.width,
                height: particle.height,
                left: particle.left,
                top: particle.top,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-8">
          {/* Main Title with Glitch Effect */}
          <h1 className="text-8xl md:text-9xl font-black mb-4 relative">
            <span 
              className="block bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-gold bg-clip-text text-transparent"
              style={{
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 8s ease infinite',
              }}
            >
              DEMIURGE
            </span>
            <span className="block text-4xl md:text-5xl mt-4 text-demiurge-cyan font-light tracking-widest">
              .CLOUD
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-gray-300 font-light mb-4">
            The Metaverse Operating System
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            From the Monad, all emanates. To the Pleroma, all returns.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full mb-12">
          {/* Portal Card */}
          <Link href="/portal" className="group">
            <div className="glass-panel p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎮</div>
              <h3 className="text-2xl font-bold text-demiurge-cyan mb-2">Casino Portal</h3>
              <p className="text-gray-400">Enter the realm of infinite games</p>
              <div className="mt-4 text-demiurge-violet group-hover:translate-x-2 transition-transform inline-block">
                → Enter
              </div>
            </div>
          </Link>

          {/* NFT Portal Card */}
          <Link href="/nft-portal" className="group">
            <div className="glass-panel p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎨</div>
              <h3 className="text-2xl font-bold text-demiurge-gold mb-2">NFT Portal</h3>
              <p className="text-gray-400">Manage DRC-369 assets & collections</p>
              <div className="mt-4 text-demiurge-violet group-hover:translate-x-2 transition-transform inline-block">
                → Open Portal
              </div>
            </div>
          </Link>

          {/* Marketplace Card */}
          <Link href="/marketplace" className="group">
            <div className="glass-panel p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🛒</div>
              <h3 className="text-2xl font-bold text-demiurge-violet mb-2">Marketplace</h3>
              <p className="text-gray-400">Discover DRC-369 assets & NFTs</p>
              <div className="mt-4 text-demiurge-violet group-hover:translate-x-2 transition-transform inline-block">
                → Explore
              </div>
            </div>
          </Link>

          {/* Social Card */}
          <Link href="/social" className="group">
            <div className="glass-panel p-8 h-full hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🌐</div>
              <h3 className="text-2xl font-bold text-demiurge-gold mb-2">Social</h3>
              <p className="text-gray-400">Connect with the Pantheon</p>
              <div className="mt-4 text-demiurge-violet group-hover:translate-x-2 transition-transform inline-block">
                → Connect
              </div>
            </div>
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="glass-panel px-12 py-4 rounded-lg hover:chroma-glow transition-all text-xl font-bold text-demiurge-cyan border-2 border-demiurge-cyan/50 hover:border-demiurge-cyan"
          >
            Login / Register
          </Link>
          <Link
            href="/play/galaga-creator"
            className="glass-panel px-12 py-4 rounded-lg hover:chroma-glow transition-all text-xl font-bold bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white"
          >
            Play Now
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 glass-panel p-6 rounded-lg">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-demiurge-cyan">13B</div>
              <div className="text-sm text-gray-400">CGT Supply</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-demiurge-violet">∞</div>
              <div className="text-sm text-gray-400">Games</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-demiurge-gold">QOR</div>
              <div className="text-sm text-gray-400">Identity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Animation */}
      <div className="fixed bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-demiurge-dark to-transparent" />
        <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z"
            fill="rgba(0,242,255,0.1)"
            className="animate-wave"
          />
        </svg>
      </div>
    </main>
  );
}
