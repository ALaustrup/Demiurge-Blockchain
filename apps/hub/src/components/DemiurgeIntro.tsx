'use client';

import { useEffect, useState } from 'react';

interface DemiurgeIntroProps {
  onComplete: () => void;
}

export function DemiurgeIntro({ onComplete }: DemiurgeIntroProps) {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'complete'>('loading');
  const [showText, setShowText] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 1920, height: 1080 });
  const [particles, setParticles] = useState<Array<{
    width: number;
    height: number;
    left: number;
    top: number;
    animationDelay: number;
    animationDuration: number;
    background: string;
    boxShadow: number;
  }>>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    setIsMounted(true);
    
    // Get viewport size for responsive scaling
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);

    // Generate particles only on client side
    const generatedParticles = Array.from({ length: 50 }, () => ({
      width: Math.random() * 4 + 2,
      height: Math.random() * 4 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 2,
      animationDuration: Math.random() * 2 + 1,
      background: Math.random() < 0.33 ? 'cyan' : Math.random() < 0.66 ? 'magenta' : 'green',
      boxShadow: Math.random() * 15 + 5,
    }));
    setParticles(generatedParticles);

    // Phase 1: Loading particles (1.5s)
    const loadingTimer = setTimeout(() => {
      setPhase('reveal');
    }, 1500);

    // Phase 2: Text reveal (0.5s delay after loading)
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 2000);

    // Phase 3: Complete and fade out (3s total)
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 3500);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
      window.removeEventListener('resize', updateViewportSize);
    };
  }, [onComplete]);

  // Calculate responsive font size based on viewport
  const getFontSize = () => {
    const { width, height } = viewportSize;
    const minDimension = Math.min(width, height);
    
    // Scale based on smallest dimension to ensure it fits
    if (minDimension < 640) {
      return 'clamp(3rem, 15vw, 5rem)'; // Mobile
    } else if (minDimension < 1024) {
      return 'clamp(5rem, 20vw, 8rem)'; // Tablet
    } else {
      return 'clamp(6rem, 12vw, 12rem)'; // Desktop
    }
  };

  const getSubtitleSize = () => {
    const { width } = viewportSize;
    if (width < 640) {
      return 'text-base';
    } else if (width < 1024) {
      return 'text-lg';
    } else {
      return 'text-xl md:text-2xl';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 overflow-hidden ${
        phase === 'complete' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #0a0a0f 0%, #050510 100%)',
        minHeight: '100vh',
        minWidth: '100vw',
      }}
    >
      {/* Animated particles background - only render after mount to prevent hydration mismatch */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle, i) => {
            const particleSize = Math.max(2, Math.min(6, (viewportSize.width / 1920) * particle.width));
            const shadowSize = Math.max(5, Math.min(20, (viewportSize.width / 1920) * particle.boxShadow));
            const bgGradient = particle.background === 'cyan'
              ? 'radial-gradient(circle, rgba(0,255,255,0.8), transparent)'
              : particle.background === 'magenta'
              ? 'radial-gradient(circle, rgba(255,0,255,0.8), transparent)'
              : 'radial-gradient(circle, rgba(0,255,136,0.8), transparent)';
            
            return (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  width: particleSize + 'px',
                  height: particleSize + 'px',
                  left: particle.left + '%',
                  top: particle.top + '%',
                  background: bgGradient,
                  animationDelay: particle.animationDelay + 's',
                  animationDuration: particle.animationDuration + 's',
                  boxShadow: `0 0 ${shadowSize}px currentColor`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* DEMIURGE Text - Responsive Container */}
      <div className="relative z-10 w-full px-4 flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="w-full max-w-[95vw] text-center">
          <h1
            className={`font-grunge text-center transition-all duration-1000 leading-tight ${
              showText 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-95'
            }`}
            style={{
              fontSize: getFontSize(),
              background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 50%, #00ff88 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 40px rgba(0,255,255,0.8)) drop-shadow(0 0 80px rgba(255,0,255,0.6))',
              textShadow: '0 0 60px rgba(0,255,255,0.8), 0 0 120px rgba(255,0,255,0.6)',
              letterSpacing: 'clamp(0.05em, 0.2em, 0.3em)',
              animation: showText ? 'pulse-glow 2s ease-in-out infinite' : 'none',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            DEMIURGE
          </h1>
          
          {/* Subtitle */}
          {showText && (
            <p
              className={`${getSubtitleSize()} text-gray-300 text-center mt-4 md:mt-8 font-body animate-fade-in px-4`}
              style={{
                animation: 'fadeIn 0.8s ease-out',
                maxWidth: '90vw',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              From the Monad, all emanates
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 40px rgba(0,255,255,0.8)) drop-shadow(0 0 80px rgba(255,0,255,0.6));
          }
          50% {
            filter: drop-shadow(0 0 60px rgba(0,255,255,1)) drop-shadow(0 0 120px rgba(255,0,255,0.8));
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Ensure no overflow */
        html, body {
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}
