'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { getOrCreateAddressForQorId, formatQorId } from '@/lib/qor-wallet';
import { getBalance as getBalanceWithMock } from '@/lib/mock-blockchain';
import { blockchainClient } from '@/lib/blockchain';
import Link from 'next/link';

export function WalletWidget() {
  const { user } = useAuth();
  const { getBalance, isConnected } = useBlockchain();
  const [balance, setBalance] = useState('0');
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user, isConnected]);

  const loadWalletData = async () => {
    if (!user) return;
    
    try {
      const userAddress = await getOrCreateAddressForQorId(user, false);
      setAddress(userAddress);

      if (userAddress) {
        try {
          const balanceStr = isConnected 
            ? await getBalance(userAddress)
            : await getBalanceWithMock(userAddress);
          setBalance(balanceStr);
        } catch {
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
      maximumFractionDigits: 4,
    });
  };

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Wallet</h3>
        <Link 
          href="/wallet" 
          className="text-xs text-neon-cyan hover:underline"
        >
          View Full →
        </Link>
      </div>

      {/* Balance Display */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">Balance</div>
        <div className="text-3xl font-bold text-neon-cyan">
          {loading ? '...' : formatBalance(balance)}
          <span className="text-xl text-gray-400 ml-2">CGT</span>
        </div>
      </div>

      {/* Address */}
      {address && (
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-1">Address</div>
          <button
            onClick={handleCopy}
            className="glass-panel px-3 py-2 rounded text-sm font-mono text-gray-300 hover:text-white transition-colors w-full text-left"
          >
            {copied ? 'Copied!' : truncateAddress(address)}
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/wallet?action=send"
          className="glass-panel py-2 px-3 rounded text-center text-sm text-neon-cyan hover:chroma-glow transition-all"
        >
          Send
        </Link>
        <Link
          href="/wallet?action=receive"
          className="glass-panel py-2 px-3 rounded text-center text-sm text-neon-magenta hover:chroma-glow transition-all"
        >
          Receive
        </Link>
      </div>

      {/* Connection Status */}
      <div className="mt-4 pt-4 border-t border-dark-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Blockchain</span>
          <span className={isConnected ? 'text-neon-green' : 'text-yellow-400'}>
            {isConnected ? '● Connected' : '○ Mock Mode'}
          </span>
        </div>
      </div>
    </div>
  );
}
