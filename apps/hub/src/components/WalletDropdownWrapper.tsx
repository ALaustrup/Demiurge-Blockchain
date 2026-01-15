'use client';

import { useState, useEffect } from 'react';
import { WalletDropdown } from '@demiurge/ui-shared';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { qorAuth } from '@demiurge/qor-sdk';
import { SendCGTModal } from './wallet/SendCGTModal';
import { TransactionHistory } from './wallet/TransactionHistory';
import { ReceiveCGTModal } from './wallet/ReceiveCGTModal';

export function WalletDropdownWrapper() {
  const { getBalance, isConnected } = useBlockchain();
  const [balance, setBalance] = useState<string>('0');
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  useEffect(() => {
    loadBalance();
  }, [isConnected]);

  const loadBalance = async () => {
    try {
      // Check if user is authenticated first
      if (!qorAuth.isAuthenticated()) {
        setBalance('0');
        setLoading(false);
        return;
      }

      // Get user profile to fetch on-chain address
      let userAddress: string | null = null;
      try {
        const profile = await qorAuth.getProfile();
        userAddress = (profile as any).on_chain?.address || null;
      } catch (error: any) {
        // If profile fetch fails (service not running), just use 0 balance
        console.warn('Failed to load profile, using default balance:', error.message);
        setBalance('0');
        setLoading(false);
        return;
      }
      
      if (userAddress) {
        setAddress(userAddress);
        
        // Fetch real balance from blockchain
        if (isConnected) {
          try {
            const balanceStr = await getBalance(userAddress);
            setBalance(balanceStr);
          } catch (error) {
            console.error('Failed to fetch balance:', error);
            // Fallback to 0 if query fails
            setBalance('0');
          }
        } else {
          // Not connected, use 0
          setBalance('0');
        }
      } else {
        // No on-chain address yet
        setBalance('0');
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <WalletDropdown
        balance={balance}
        address={address}
        onSendClick={() => setShowSendModal(true)}
        onReceiveClick={() => {
          setShowReceiveModal(true);
        }}
        onHistoryClick={() => setShowHistory(true)}
      />
      
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
      
      {showHistory && address && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-demiurge-cyan/30 rounded-lg p-6 w-full max-w-2xl glass-panel max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-demiurge-cyan">Transaction History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <TransactionHistory address={address} />
          </div>
        </div>
      )}
    </>
  );
}
