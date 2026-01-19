'use client';

import { useEffect, useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { blockchainClient } from '@/lib/blockchain';
import { getOrCreateAddressForQorId, formatQorId } from '@/lib/qor-wallet';
import { getBalance as getBalanceWithMock } from '@/lib/mock-blockchain';
import { SendCGTModal } from '@/components/wallet/SendCGTModal';
import { ReceiveCGTModal } from '@/components/wallet/ReceiveCGTModal';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { EnhancedSessionKeyManager } from '@/components/wallet/EnhancedSessionKeyManager';
import { WalletSelector } from '@/components/wallet/WalletSelector';
import { EnergyDisplay } from '@/components/energy/EnergyDisplay';

export default function WalletPage() {
  const { getBalance, isConnected } = useBlockchain();
  const [balance, setBalance] = useState('0');
  const [address, setAddress] = useState<string | null>(null);
  const [qorId, setQorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsAuthenticated(qorAuth.isAuthenticated());
  }, []);

  useEffect(() => {
    loadWallet();
  }, [isConnected, isAuthenticated]);

  const loadWallet = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await qorAuth.getProfile();
      setQorId(profile.qor_id);

      // Get or create blockchain address for QOR ID
      const userAddress = await getOrCreateAddressForQorId(profile, false);
      setAddress(userAddress);

      // Get balance (uses mock if blockchain not connected)
      if (userAddress) {
        try {
          // Try real blockchain first
          const balanceStr = isConnected 
            ? await getBalance(userAddress)
            : await getBalanceWithMock(userAddress);
          setBalance(balanceStr);
        } catch (error) {
          console.warn('Failed to get balance, using mock:', error);
          // Fallback to mock
          const balanceStr = await getBalanceWithMock(userAddress);
          setBalance(balanceStr);
        }
      } else {
        setBalance('0');
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (rawBalance: string) => {
    const formatted = blockchainClient.formatCGTBalance(rawBalance);
    return Number.parseFloat(formatted).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="max-w-4xl mx-auto w-full">
          <div className="glass-panel liquid-border rounded-xl p-12 text-center border-2 border-demiurge-violet/50 relative overflow-hidden">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-magenta/10 to-neon-green/10 animate-pulse opacity-50"></div>
            
            <div className="relative z-10">
              {/* Icon/Logo */}
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan via-neon-magenta to-neon-green flex items-center justify-center shadow-2xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <h1 className="text-5xl font-grunge mb-4 bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
                DEMIURGE WALLET
              </h1>
              
              <p className="text-xl text-gray-300 mb-2 font-body">
                Your Gateway to the Blockchain Economy
              </p>
              
              <p className="text-gray-400 mb-8 font-body">
                Secure, decentralized wallet for CGT tokens, NFTs, and on-chain assets
              </p>

              {/* Feature highlights */}
              <div className="grid md:grid-cols-3 gap-4 mb-10 text-left">
                <div className="glass-panel p-4 rounded-lg border border-neon-cyan/30">
                  <div className="text-neon-cyan text-2xl mb-2">🔐</div>
                  <div className="text-white font-semibold mb-1">Secure</div>
                  <div className="text-gray-400 text-sm">QOR ID authentication with on-chain identity</div>
                </div>
                <div className="glass-panel p-4 rounded-lg border border-neon-magenta/30">
                  <div className="text-neon-magenta text-2xl mb-2">⚡</div>
                  <div className="text-white font-semibold mb-1">Fast</div>
                  <div className="text-gray-400 text-sm">Instant transactions on Demiurge blockchain</div>
                </div>
                <div className="glass-panel p-4 rounded-lg border border-neon-green/30">
                  <div className="text-neon-green text-2xl mb-2">🎮</div>
                  <div className="text-white font-semibold mb-1">Integrated</div>
                  <div className="text-gray-400 text-sm">Seamless gaming and NFT experiences</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="/login"
                  className="w-full sm:w-auto bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white font-grunge-alt py-4 px-8 rounded-lg hover:scale-105 transition-all text-lg chroma-glow shadow-lg"
                >
                  LOGIN TO WALLET
                </a>
                <a
                  href="/login?step=register"
                  className="w-full sm:w-auto glass-panel border-2 border-neon-cyan/50 text-neon-cyan font-grunge-alt py-4 px-8 rounded-lg hover:border-neon-cyan hover:chroma-glow transition-all text-lg"
                >
                  CREATE QOR ID
                </a>
              </div>

              <p className="text-xs text-gray-500 mt-6 font-body">
                New to Demiurge? Create a free QOR ID in seconds and start earning CGT
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Wallet</h1>
            <div className="flex items-center gap-4 mt-2">
              {qorId && (
                <p className="text-demiurge-cyan font-semibold">
                  {formatQorId(qorId)}
                </p>
              )}
              <p className="text-gray-400">
                Blockchain: {isConnected ? (
                  <span className="text-green-400">Connected</span>
                ) : (
                  <span className="text-yellow-400">Using Mock Data</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={loadWallet}
            className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="glass-panel rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-3xl font-bold text-demiurge-cyan">
                {loading ? '...' : `${formatBalance(balance)} CGT`}
              </div>
            </div>
            {address && (
              <div className="flex-shrink-0 min-w-[300px]">
                <EnergyDisplay address={address} />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSendModal(true)}
                className="bg-demiurge-cyan text-black font-bold py-2 px-4 rounded hover:bg-demiurge-cyan/80 transition-colors"
                disabled={!address}
              >
                Send
              </button>
              <button
                onClick={() => setShowReceiveModal(true)}
                className="glass-panel py-2 px-4 rounded hover:chroma-glow transition-all"
                disabled={!address}
              >
                Receive
              </button>
            </div>
          </div>

          {address && (
            <div className="mt-6 space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Selected Wallet</div>
                <WalletSelector
                  qorId={qorId || ''}
                  selectedAddress={address}
                  onSelectAddress={(newAddress) => {
                    setAddress(newAddress);
                    loadWallet();
                  }}
                  onAddWallet={() => {
                    // TODO: Show add wallet modal
                    console.log('Add wallet clicked');
                  }}
                />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">On-chain Address</div>
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="bg-gray-800/50 rounded p-3 text-sm font-mono break-all flex-1">
                    {address}
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel rounded-lg p-6">
          <h2 className="text-2xl font-bold text-demiurge-cyan mb-4">Transaction History</h2>
          {address ? (
            <TransactionHistory address={address} />
          ) : (
            <div className="text-gray-400">No on-chain address found.</div>
          )}
        </div>

        {address && qorId && (
          <div className="mt-6">
            <EnhancedSessionKeyManager qorId={qorId} primaryAddress={address} />
          </div>
        )}
      </div>

      {showSendModal && address && (
        <SendCGTModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          fromAddress={address}
          currentBalance={balance}
        />
      )}

      {showReceiveModal && address && (
        <ReceiveCGTModal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          address={address}
        />
      )}
    </main>
  );
}
