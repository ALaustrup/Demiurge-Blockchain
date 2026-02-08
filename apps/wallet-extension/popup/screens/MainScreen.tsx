// Demiurge Wallet Extension - Main Screen (Balance View)
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';

export function MainScreen() {
  const { 
    activeAccount, 
    formattedBalance, 
    network, 
    refreshBalance, 
    setView,
    pendingRequestCount 
  } = useStore();
  
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    // Refresh balance periodically
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  const copyAddress = async () => {
    if (activeAccount) {
      await navigator.clipboard.writeText(activeAccount);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaimStarter = async () => {
    if (!activeAccount) return;
    setClaiming(true);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CLAIM_STARTER_TOKENS',
        payload: { address: activeAccount },
      });
      
      if (response.success) {
        refreshBalance();
      }
    } catch (error) {
      console.error('Failed to claim starter tokens:', error);
    } finally {
      setClaiming(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Pending Requests Banner */}
      {pendingRequestCount > 0 && (
        <button
          onClick={() => setView('approve')}
          className="bg-demiurge-500/20 border border-demiurge-500/30 rounded-lg p-3 mb-4 flex items-center justify-between hover:bg-demiurge-500/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-demiurge-500 rounded-full animate-pulse" />
            <span className="text-demiurge-400 text-sm font-medium">
              {pendingRequestCount} pending request{pendingRequestCount > 1 ? 's' : ''}
            </span>
          </div>
          <svg className="w-4 h-4 text-demiurge-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Account Card */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm">Account</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            network === 'mainnet' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {network}
          </span>
        </div>
        
        <button
          onClick={copyAddress}
          className="flex items-center gap-2 text-white hover:text-demiurge-400 transition-colors group"
        >
          <span className="font-mono text-sm">
            {activeAccount ? truncateAddress(activeAccount) : '...'}
          </span>
          {copied ? (
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-500 group-hover:text-demiurge-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Balance Card */}
      <div className="card flex-1 flex flex-col items-center justify-center mb-4">
        <span className="text-gray-400 text-sm mb-2">Balance</span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {formattedBalance ?? '...'}
          </span>
          <span className="text-xl text-gray-400">CGT</span>
        </div>
        
        <button
          onClick={refreshBalance}
          className="mt-4 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button fullWidth onClick={() => setView('send')}>
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </span>
        </Button>
        <Button fullWidth variant="secondary" onClick={copyAddress}>
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Address
          </span>
        </Button>
      </div>

      {/* Claim Starter (for testnet) */}
      {network !== 'mainnet' && (
        <Button 
          fullWidth 
          variant="ghost" 
          className="mt-3"
          loading={claiming}
          onClick={handleClaimStarter}
        >
          Claim Starter Tokens
        </Button>
      )}
    </div>
  );
}
