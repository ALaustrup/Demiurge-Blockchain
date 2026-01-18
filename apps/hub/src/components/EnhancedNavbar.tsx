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
          setBalance(bal);
          setEnergy(energyData);
          setBlockNumber(block);
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

      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel liquid-border border-b-2 wardens-gaze">
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
                  {blockNumber.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Right: Navigation + User */}
          <div className="flex gap-4 items-center ml-auto">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="font-grunge-alt text-sm uppercase tracking-wider text-gray-300 hover:text-neon-cyan transition-all duration-300 hover:chroma-glow px-3 py-1 rounded"
              >
                Menu
              </button>
              {showMenu && (
                <div className="cascade-menu open absolute right-0 top-full mt-2 glass-panel p-2 rounded-lg min-w-[180px] z-50">
                  <Link href="/games" className="cascade-menu-item block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left mb-1">
                    Games
                  </Link>
                  <Link href="/portal" className="cascade-menu-item block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left mb-1">
                    Portal
                  </Link>
                  <Link href="/wallet" className="cascade-menu-item block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left mb-1">
                    Wallet
                  </Link>
                  <Link href="/staking" className="cascade-menu-item block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left mb-1">
                    Staking
                  </Link>
                  <Link href="/validators" className="cascade-menu-item block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left mb-1">
                    Validators
                  </Link>
                  <Link href="/analytics" className="cascade-menu-item block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left mb-1">
                    Analytics
                  </Link>
                  <Link href="/nft-portal" className="cascade-menu-item block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left mb-1">
                    NFTs
                  </Link>
                  <Link href="/development" className="cascade-menu-item block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left mb-1">
                    Development
                  </Link>
                  <Link href="/social" className="cascade-menu-item block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left">
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
