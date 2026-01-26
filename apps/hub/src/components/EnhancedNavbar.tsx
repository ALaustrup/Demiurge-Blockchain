'use client';

import { useState, useEffect } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { generateAddressFromQorId, formatQorId } from '@/lib/qor-wallet';
import { WalletDropdownWrapper } from './WalletDropdownWrapper';
import { QorIdHeaderWrapper } from './QorIdHeaderWrapper';
import { ConsensusStatus } from './consensus/ConsensusStatus';
import Link from 'next/link';

/**
 * Enhanced Navbar with Real-Time QOR ID Chain Data
 * Eyes gaze upon you, watching as a warden does his prisoners...
 */

export function EnhancedNavbar() {
  const { getBalance, getEnergy, getBlockNumber, isConnected } = useBlockchain();
  const [qorId, setQorId] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [energy, setEnergy] = useState<{ current: number; max: number } | null>(null);
  const [blockNumber, setBlockNumber] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Track mouse for glow effect
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    loadUserData();
    const interval = setInterval(loadUserData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMenu && !target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const loadUserData = async () => {
    if (!qorAuth.isAuthenticated()) {
      setQorId(null);
      setAddress(null);
      return;
    }

    try {
      const profile = await qorAuth.getProfile();
      setQorId(profile.qor_id);
      const userAddress = generateAddressFromQorId(profile.qor_id);
      setAddress(userAddress);

      // Load real-time chain data
      if (isConnected && userAddress) {
        try {
          const [bal, energyData, block] = await Promise.all([
            getBalance(userAddress).catch(() => '0'),
            getEnergy(userAddress).catch(() => null),
            getBlockNumber().catch(() => 0),
          ]);
          setBalance(bal ?? '0');
          setEnergy(energyData);
          setBlockNumber(block ?? 0);
        } catch (err) {
          console.error('Failed to load chain data:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const formatBalance = (bal: string): string => {
    const num = BigInt(bal);
    const cgt = Number(num) / 100;
    return cgt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <>
      {/* Mouse tracking glow */}
      <div
        className="mouse-glow"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      {/* Ancient glow background */}
      <div className="ancient-glow-bg" />

      <nav className="fixed top-0 left-0 right-0 z-50 liquid-border border-b-2 wardens-gaze overflow-visible bg-[rgba(10,10,15,0.75)] backdrop-blur-xl shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 py-3">
          {/* Left: Logo + Chain Status */}
          <div className="flex items-center gap-4">
            <Link href="/" className="grunge-text text-3xl font-grunge tracking-wider hover:scale-105 transition-transform ancient-text">
              DEMIURGE
            </Link>
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-neon-cyan to-transparent opacity-50"></div>
            <span className="text-xs font-grunge-alt text-gray-400 uppercase tracking-widest">
              Blockchain Ecosystem
            </span>
            <ConsensusStatus />
          </div>

          {/* Center: QOR ID Chain Data (only when authenticated) */}
          {qorId && address && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
              <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-lg hover-glow">
                <div className="text-xs text-gray-400 uppercase tracking-wider">QOR ID</div>
                <div className="text-sm font-bold text-neon-cyan">{formatQorId(qorId)}</div>
              </div>
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-neon-cyan to-transparent opacity-30"></div>
              <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-lg hover-glow">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Balance</div>
                <div className="text-sm font-bold text-neon-green">{formatBalance(balance)} CGT</div>
              </div>
              {energy && (
                <>
                  <div className="h-8 w-px bg-gradient-to-b from-transparent via-neon-cyan to-transparent opacity-30"></div>
                  <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-lg hover-glow">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Energy</div>
                    <div className="text-sm font-bold text-neon-magenta">
                      {energy.current}/{energy.max}
                    </div>
                  </div>
                </>
              )}
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-neon-cyan to-transparent opacity-30"></div>
              <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-lg hover-glow">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Block</div>
                <div className="text-sm font-bold text-neon-purple font-mono">
                  {(blockNumber ?? 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Right: Navigation + User */}
          <div className="flex gap-4 items-center ml-auto">
            {/* Visible Navigation Links - Portal first, then main features */}
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/portal" 
                className="font-grunge-alt text-sm uppercase tracking-wider text-white hover:text-neon-magenta transition-all duration-300 hover:chroma-glow px-3 py-1 rounded relative"
              >
                Portal
              </Link>
              {qorId && (
                <Link 
                  href="/dashboard" 
                  className="font-grunge-alt text-sm uppercase tracking-wider text-neon-cyan hover:text-neon-cyan transition-all duration-300 hover:chroma-glow px-3 py-1 rounded relative border border-neon-cyan/30"
                >
                  Dashboard
                </Link>
              )}
              <Link 
                href="/games" 
                className="font-grunge-alt text-sm uppercase tracking-wider text-white hover:text-neon-cyan transition-all duration-300 hover:chroma-glow px-3 py-1 rounded relative"
              >
                Games
              </Link>
              <Link 
                href="/scattertxt" 
                className="font-grunge-alt text-sm uppercase tracking-wider text-white hover:text-neon-green transition-all duration-300 hover:chroma-glow px-3 py-1 rounded relative"
              >
                ScatterTXT
              </Link>
              <Link 
                href="/wallet" 
                className="font-grunge-alt text-sm uppercase tracking-wider text-white hover:text-neon-green transition-all duration-300 hover:chroma-glow px-3 py-1 rounded relative"
              >
                Wallet
              </Link>
              <Link 
                href="/staking" 
                className="font-grunge-alt text-sm uppercase tracking-wider text-white hover:text-neon-purple transition-all duration-300 hover:chroma-glow px-3 py-1 rounded relative"
              >
                Staking
              </Link>
              <Link 
                href="/nft-portal" 
                className="font-grunge-alt text-sm uppercase tracking-wider text-white hover:text-neon-pink transition-all duration-300 hover:chroma-glow px-3 py-1 rounded relative"
              >
                NFTs
              </Link>
              <Link 
                href="/explorer" 
                className="font-grunge-alt text-sm uppercase tracking-wider text-white hover:text-neon-cyan transition-all duration-300 hover:chroma-glow px-3 py-1 rounded relative flex items-center gap-1"
              >
                <span className="text-xs">⛓️</span>
                Explorer
              </Link>
              <Link 
                href="/music" 
                className="font-grunge-alt text-sm uppercase tracking-wider text-white hover:text-neon-magenta transition-all duration-300 hover:chroma-glow px-3 py-1 rounded relative flex items-center gap-1"
              >
                <span className="text-xs">🎵</span>
                Radio
              </Link>
            </div>

            {/* Mobile Menu Button & Dropdown */}
            <div className="relative menu-container z-[60]">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="font-grunge-alt text-sm uppercase tracking-wider text-white hover:text-neon-cyan transition-all duration-300 hover:chroma-glow px-3 py-1 rounded border border-neon-cyan/30 hover:border-neon-cyan bg-black/20 backdrop-blur-sm"
                aria-label="Toggle menu"
              >
                <span className="md:hidden">☰</span>
                <span className="hidden md:inline">More</span>
              </button>
              {showMenu && (
                <div className="cascade-menu open absolute right-0 top-full mt-2 glass-panel p-2 rounded-lg min-w-[180px] z-[200] border border-neon-cyan/50 shadow-2xl bg-[rgba(10,10,15,0.98)] backdrop-blur-[20px]">
                  <Link 
                    href="/validators" 
                    onClick={() => setShowMenu(false)}
                    className="cascade-menu-item block w-full text-white py-2 px-3 rounded hover:chroma-glow hover:bg-neon-cyan/10 transition-all text-left mb-1"
                  >
                    Validators
                  </Link>
                  <Link 
                    href="/analytics" 
                    onClick={() => setShowMenu(false)}
                    className="cascade-menu-item block w-full text-white py-2 px-3 rounded hover:chroma-glow hover:bg-neon-magenta/10 transition-all text-left mb-1"
                  >
                    Analytics
                  </Link>
                  <Link 
                    href="/development" 
                    onClick={() => setShowMenu(false)}
                    className="cascade-menu-item block w-full text-white py-2 px-3 rounded hover:chroma-glow hover:bg-neon-green/10 transition-all text-left mb-1"
                  >
                    Development
                  </Link>
                  <Link 
                    href="/social" 
                    onClick={() => setShowMenu(false)}
                    className="cascade-menu-item block w-full text-white py-2 px-3 rounded hover:chroma-glow hover:bg-neon-purple/10 transition-all text-left"
                  >
                    VYB
                  </Link>
                </div>
              )}
            </div>
            {qorId ? <QorIdHeaderWrapper /> : <WalletDropdownWrapper />}
          </div>
        </div>
      </nav>
    </>
  );
}
