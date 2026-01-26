'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { blockchainClient } from '@/lib/blockchain';
import { getOrCreateAddressForQorId } from '@/lib/qor-wallet';
import { getBalance as getBalanceWithMock } from '@/lib/mock-blockchain';
import { SendCGTModal } from '@/components/wallet/SendCGTModal';
import { ReceiveCGTModal } from '@/components/wallet/ReceiveCGTModal';
import { EnergyDisplay } from '@/components/energy/EnergyDisplay';

interface Transaction {
  type: 'send' | 'receive';
  amount: string;
  timestamp: Date;
  hash?: string;
}

export function WalletWidget() {
  const { user, isAuthenticated } = useAuth();
  const { getBalance, isConnected } = useBlockchain();
  const [balance, setBalance] = useState('0');
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadWallet();
    }
  }, [isAuthenticated, user, isConnected]);

  const loadWallet = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userAddress = await getOrCreateAddressForQorId(user, false);
      setAddress(userAddress);

      if (userAddress) {
        try {
          const balanceStr = isConnected 
            ? await getBalance(userAddress)
            : await getBalanceWithMock(userAddress);
          setBalance(balanceStr);
        } catch (error) {
          const balanceStr = await getBalanceWithMock(userAddress);
          setBalance(balanceStr);
        }
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (rawBalance: string) => {
    const formatted = blockchainClient.formatCGTBalance(rawBalance);
    return Number.parseFloat(formatted).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-neon-cyan/20">
        <h3 className="text-lg font-grunge text-neon-cyan mb-4">💎 Wallet</h3>
        <p className="text-gray-400 text-sm">Login to view your wallet</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 border border-neon-cyan/20 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-grunge text-neon-cyan">💎 Wallet</h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Live' : 'Mock'}
            </span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-6">
          <div className="text-xs text-gray-400 mb-1">Available Balance</div>
          <div className="text-4xl font-grunge text-white">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                {formatBalance(balance)}
                <span className="text-lg text-neon-cyan ml-2">CGT</span>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            ≈ {loading ? '...' : (parseFloat(formatBalance(balance)) * 100).toLocaleString()} Sparks
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowSendModal(true)}
            disabled={!address}
            className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-cyan/70 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            ↑ Send
          </button>
          <button
            onClick={() => setShowReceiveModal(true)}
            disabled={!address}
            className="flex-1 glass-panel py-2 px-4 rounded-lg hover:border-neon-cyan/50 border border-transparent transition-all disabled:opacity-50"
          >
            ↓ Receive
          </button>
        </div>

        {/* Address */}
        {address && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">Public Address</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/30 rounded px-3 py-2 text-xs font-mono text-gray-300 truncate">
                {address}
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-2 glass-panel rounded text-xs hover:text-neon-cyan transition-colors"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
          </div>
        )}

        {/* Energy Display */}
        {address && (
          <div className="pt-4 border-t border-white/5">
            <EnergyDisplay address={address} compact />
          </div>
        )}
      </div>

      {/* Modals */}
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
    </div>
  );
}
