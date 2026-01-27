'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useChainStore, selectBlockHeight, selectTps, selectConnectionStatus } from '@/store/chainStore';
import { WalletConnector } from './WalletConnector';

// ═══════════════════════════════════════════════════════════════════════════
// HEADER BAR - Top navigation with real-time blockchain tickers
// ═══════════════════════════════════════════════════════════════════════════

export function HeaderBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const connect = useChainStore((state) => state.connect);
  const connectionStatus = useChainStore(selectConnectionStatus);
  const blockHeight = useChainStore(selectBlockHeight);
  const tps = useChainStore(selectTps);

  // Connect to blockchain on mount (global for all pages)
  useEffect(() => {
    connect();
  }, [connect]);

  const navItems = [
    { label: 'Games', href: '/games' },
    { label: 'VYB', href: '/social' },
    { label: 'NFTs', href: '/nft-portal' },
    { label: 'Music', href: '/music' },
  ];

  const dropdownItems = [
    { label: 'Explorer', href: '/explorer', icon: '🔍' },
    { label: 'Staking', href: '/staking', icon: '⚡' },
    { label: 'Validators', href: '/validators', icon: '🏛️' },
    { label: 'Analytics', href: '/analytics', icon: '📊' },
    { label: 'Development', href: '/development', icon: '💻' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <header className="header-bar">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-holographic to-lavender flex items-center justify-center">
              <span className="text-xl font-bold text-void">D</span>
            </div>
            <span className="font-grunge text-holographic text-xl hidden md:block group-hover:text-white transition-colors">
              DEMIURGE
            </span>
          </Link>

          {/* Center: Real-time tickers */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div 
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-data-green' : 'bg-red-500'
                }`}
                style={{ boxShadow: connectionStatus === 'connected' ? '0 0 8px #00FF88' : '0 0 8px #FF4444' }}
              />
              <span className="text-xs text-lavender uppercase">
                {connectionStatus === 'connected' ? 'Live' : 'Offline'}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lavender">Block</span>
                <span className="data-ticker font-mono">
                  {blockHeight.toLocaleString()}
                </span>
              </div>
              <div className="h-4 w-px bg-lavender/30" />
              <div className="flex items-center gap-2">
                <span className="text-lavender">TPS</span>
                <span className="data-ticker font-mono">
                  {tps.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-holographic hover:text-data-cyan hover:bg-ultraviolet/40 rounded-lg transition-all"
                style={{ textShadow: '0 0 8px rgba(205, 171, 195, 0.4)' }}
              >
                {item.label}
              </Link>
            ))}

            {/* Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="px-4 py-2 text-sm font-medium text-holographic hover:text-data-cyan hover:bg-ultraviolet/40 rounded-lg transition-all flex items-center gap-1"
                style={{ textShadow: '0 0 8px rgba(205, 171, 195, 0.4)' }}
              >
                More
                <span className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-56 p-2 z-50 rounded-xl border border-holographic/30"
                    style={{
                      background: 'rgba(3, 2, 5, 0.95)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 0 30px rgba(205, 171, 195, 0.2), inset 0 0 20px rgba(13, 10, 20, 0.5)',
                    }}
                  >
                    {dropdownItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-holographic hover:text-data-cyan hover:bg-ultraviolet/60 rounded-lg transition-all group"
                        style={{ textShadow: '0 0 10px rgba(205, 171, 195, 0.5)' }}
                      >
                        <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Connect Button */}
            <div className="ml-4">
              <WalletConnector variant="button" />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-lavender hover:text-holographic"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div 
                className="py-4 space-y-2 mt-2 rounded-xl border border-holographic/20 p-3"
                style={{
                  background: 'rgba(3, 2, 5, 0.95)',
                  boxShadow: '0 0 20px rgba(205, 171, 195, 0.1)',
                }}
              >
                {[...navItems, ...dropdownItems].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-holographic hover:text-data-cyan hover:bg-ultraviolet/50 rounded-lg transition-all font-medium"
                    style={{ textShadow: '0 0 8px rgba(205, 171, 195, 0.4)' }}
                  >
                    {'icon' in item && <span className="mr-2">{(item as { icon: string }).icon}</span>}
                    {item.label}
                  </Link>
                ))}
                <button className="w-full launcher-button-primary py-3 mt-4 rounded-lg">
                  Connect Wallet
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default HeaderBar;
