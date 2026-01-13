'use client';

import { useState, useEffect } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';

export function WalletDropdown() {
  const [balance, setBalance] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    async function loadBalance() {
      try {
        // Get user profile to fetch on-chain address
        const profile = await qorAuth.getProfile();
        const userAddress = profile.on_chain?.address;
        
        if (userAddress) {
          setAddress(userAddress);
          // TODO: Fetch real balance from blockchain
          // For now, use mock data until blockchain is fully connected
          // const balanceStr = await blockchainClient.getCGTBalance(userAddress);
          // setBalance(parseFloat(balanceStr) / 1e8); // Convert from 8 decimals
          setBalance(1000.5); // Mock data
        } else {
          // No on-chain address yet
          setBalance(0);
        }
      } catch (error) {
        console.error('Failed to load balance:', error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    }
    
    if (qorAuth.isAuthenticated()) {
      loadBalance();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all flex items-center gap-2"
      >
        <span className="text-demiurge-cyan font-bold">CGT</span>
        <span className="text-white">
          {loading ? '...' : balance.toFixed(2)}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 glass-panel p-4 rounded-lg min-w-[300px] z-50">
          <h3 className="text-lg font-bold mb-4 text-demiurge-cyan">Wallet</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-demiurge-cyan/20">
              <span className="text-gray-300">Balance:</span>
              <span className="text-demiurge-cyan font-bold text-xl">
                {balance.toFixed(2)} CGT
              </span>
            </div>
            <button className="w-full glass-panel py-2 rounded hover:chroma-glow transition-all">
              Send CGT
            </button>
            <button className="w-full glass-panel py-2 rounded hover:chroma-glow transition-all">
              Receive CGT
            </button>
            <button className="w-full glass-panel py-2 rounded hover:chroma-glow transition-all">
              Transaction History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
