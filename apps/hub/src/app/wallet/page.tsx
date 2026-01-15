'use client';

import { useEffect, useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { blockchainClient } from '@/lib/blockchain';
import { SendCGTModal } from '@/components/wallet/SendCGTModal';
import { ReceiveCGTModal } from '@/components/wallet/ReceiveCGTModal';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';

export default function WalletPage() {
  const { getBalance, isConnected } = useBlockchain();
  const [balance, setBalance] = useState('0');
  const [address, setAddress] = useState<string | null>(null);
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
      const userAddress = profile?.on_chain?.address || null;
      setAddress(userAddress);

      if (userAddress && isConnected) {
        const balanceStr = await getBalance(userAddress);
        setBalance(balanceStr);
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
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-demiurge-cyan mb-4">Wallet</h1>
            <p className="text-gray-300 mb-6">
              Sign in with your Qor ID to view your CGT wallet.
            </p>
            <a
              href="/login"
              className="inline-block bg-demiurge-cyan text-black font-bold py-2 px-6 rounded hover:bg-demiurge-cyan/80 transition-colors"
            >
              Go to Login
            </a>
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
            <p className="text-gray-400">
              Blockchain status: {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <button
            onClick={loadWallet}
            className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all"
          >
            Refresh
          </button>
        </div>

        <div className="glass-panel rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-3xl font-bold text-demiurge-cyan">
                {loading ? '...' : `${formatBalance(balance)} CGT`}
              </div>
            </div>
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
            <div className="mt-6">
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
