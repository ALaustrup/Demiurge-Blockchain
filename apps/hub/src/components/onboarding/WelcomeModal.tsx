'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
  qorId?: string;
}

// Storage key for tracking claim status locally
const CLAIM_STORAGE_KEY = 'demiurge_starter_claimed';

export function WelcomeModal({ isOpen, onClose, walletAddress, qorId }: WelcomeModalProps) {
  const [step, setStep] = useState<'checking' | 'welcome' | 'claiming' | 'success' | 'error'>('checking');
  const [claimResult, setClaimResult] = useState<{
    success: boolean;
    amount: string;
    message: string;
  } | null>(null);
  const hasCheckedRef = useRef(false);

  // Check if already claimed (localStorage + on-chain)
  useEffect(() => {
    if (!isOpen || !walletAddress) return;
    
    // Prevent multiple checks in same session
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const checkClaimStatus = async () => {
      try {
        // First check localStorage (fast, prevents popup flicker)
        const localClaimed = localStorage.getItem(CLAIM_STORAGE_KEY);
        if (localClaimed === 'true') {
          onClose();
          return;
        }
        
        // Then check on-chain
        const cleanAddress = walletAddress.startsWith('0x') ? walletAddress.slice(2) : walletAddress;
        const hasClaimed = await demiurgeRpc.hasClaimedStarter(cleanAddress);
        
        if (hasClaimed) {
          // User already claimed - save to localStorage and close
          localStorage.setItem(CLAIM_STORAGE_KEY, 'true');
          onClose();
        } else {
          setStep('welcome');
        }
      } catch (error) {
        // If check fails, check localStorage as fallback
        console.warn('Failed to check claim status:', error);
        const localClaimed = localStorage.getItem(CLAIM_STORAGE_KEY);
        if (localClaimed === 'true') {
          onClose();
        } else {
          setStep('welcome');
        }
      }
    };

    checkClaimStatus();
  }, [isOpen, walletAddress, onClose]);

  const handleClaimStarter = async () => {
    if (!walletAddress) {
      setStep('error');
      setClaimResult({
        success: false,
        amount: '0',
        message: 'No wallet address available. Please try again later.',
      });
      return;
    }

    setStep('claiming');

    try {
      // Strip 0x prefix if present - RPC expects raw hex
      const cleanAddress = walletAddress.startsWith('0x') ? walletAddress.slice(2) : walletAddress;
      const result = await demiurgeRpc.claimStarterBonus(cleanAddress);
      setClaimResult(result);
      
      if (result.success) {
        // Mark as claimed in localStorage to prevent re-showing
        localStorage.setItem(CLAIM_STORAGE_KEY, 'true');
        setStep('success');
      } else {
        // If RPC says already claimed, also save locally
        if (result.message.toLowerCase().includes('already claimed')) {
          localStorage.setItem(CLAIM_STORAGE_KEY, 'true');
        }
        setStep('error');
      }
    } catch (error: any) {
      setClaimResult({
        success: false,
        amount: '0',
        message: error.message || 'Failed to claim starter bonus',
      });
      setStep('error');
    }
  };

  // Handle navigation - close modal first to prevent re-showing
  const handleNavigate = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel liquid-border w-full max-w-lg mx-4 p-8 rounded-2xl">
        {/* Checking Step */}
        {step === 'checking' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-gray-400 font-body">Checking your account...</p>
          </div>
        )}

        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div>
              <h2 className="text-3xl font-grunge text-neon-cyan mb-2">
                Welcome to Demiurge!
              </h2>
              <p className="text-gray-300 font-body">
                {qorId ? `Hello, ${qorId}!` : 'Welcome, Creator!'}
              </p>
            </div>

            <div className="bg-blockchain-light/50 rounded-xl p-6 text-left space-y-4">
              <h3 className="font-grunge-alt text-neon-purple text-lg">
                Your Starter Package
              </h3>
              <ul className="space-y-3 font-body text-gray-300">
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan">
                    ✓
                  </span>
                  <span><strong className="text-white">100 CGT</strong> - Creator God Tokens</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan">
                    ✓
                  </span>
                  <span><strong className="text-white">1000 Energy</strong> - For gasless gaming</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan">
                    ✓
                  </span>
                  <span><strong className="text-white">VYB Access</strong> - Social platform</span>
                </li>
              </ul>
            </div>

            <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-lg p-4">
              <p className="text-sm font-body text-gray-300">
                <strong className="text-neon-purple">What is CGT?</strong><br />
                Creator God Tokens are platform credits you can earn through gaming, 
                staking, and contributing. Spend them on NFTs, premium features, and tips to creators!
              </p>
            </div>

            <button
              onClick={handleClaimStarter}
              className="w-full neon-button py-4 text-lg font-grunge-alt rounded-xl"
            >
              Claim Your Starter Package
            </button>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 text-sm font-body transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Claiming Step */}
        {step === 'claiming' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-2xl font-grunge text-neon-cyan">
              Claiming your tokens...
            </h2>
            <p className="text-gray-400 font-body">
              Recording on the Demiurge blockchain
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-neon-cyan flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 className="text-3xl font-grunge text-green-400 mb-2">
                Welcome Aboard!
              </h2>
              <p className="text-gray-300 font-body">
                {claimResult?.message}
              </p>
            </div>

            <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-6">
              <p className="text-4xl font-grunge text-green-400">
                +{claimResult?.amount ? Number(claimResult.amount) / 100 : 100} CGT
              </p>
              <p className="text-sm text-gray-400 font-body mt-2">
                Added to your wallet
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-grunge-alt text-neon-cyan">What's Next?</h3>
              <div className="grid grid-cols-3 gap-3">
                <Link 
                  href="/games" 
                  onClick={handleNavigate}
                  className="glass-panel p-4 rounded-lg hover:border-neon-cyan/50 transition-colors"
                >
                  <div className="text-2xl mb-2">🎮</div>
                  <p className="text-xs font-body text-gray-300">Play Games</p>
                </Link>
                <Link 
                  href="/staking" 
                  onClick={handleNavigate}
                  className="glass-panel p-4 rounded-lg hover:border-neon-cyan/50 transition-colors"
                >
                  <div className="text-2xl mb-2">📈</div>
                  <p className="text-xs font-body text-gray-300">Stake CGT</p>
                </Link>
                <Link 
                  href="/social" 
                  onClick={handleNavigate}
                  className="glass-panel p-4 rounded-lg hover:border-neon-cyan/50 transition-colors"
                >
                  <div className="text-2xl mb-2">💬</div>
                  <p className="text-xs font-body text-gray-300">Join VYB</p>
                </Link>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full neon-button py-4 text-lg font-grunge-alt rounded-xl"
            >
              Start Exploring
            </button>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-grunge text-red-400 mb-2">
                Oops!
              </h2>
              <p className="text-gray-300 font-body">
                {claimResult?.message || 'Something went wrong'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('welcome')}
                className="flex-1 glass-panel py-3 rounded-lg hover:border-neon-cyan/50 transition-colors font-body"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 neon-button py-3 rounded-lg font-body"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
