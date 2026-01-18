'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

export function ConsensusStatus() {
  const [status, setStatus] = useState<{
    currentEra: number;
    blockNumber: number;
    validators: number;
    totalStake: string;
    transactionFees: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await demiurgeRpc.getConsensusStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load consensus status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-900/50 rounded-lg p-4 border border-red-500">
        <p className="text-red-200">Unable to load consensus status</p>
      </div>
    );
  }

  const formatBalance = (balance: string): string => {
    const num = BigInt(balance);
    const cgt = Number(num) / 100;
    return cgt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Consensus Status</p>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <p className="text-xs text-gray-400">Era</p>
              <p className="text-lg font-bold text-white">{status.currentEra}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Block</p>
              <p className="text-lg font-bold text-white">{status.blockNumber.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Validators</p>
              <p className="text-lg font-bold text-green-400">{status.validators}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Stake</p>
              <p className="text-lg font-bold text-yellow-400">{formatBalance(status.totalStake)} CGT</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400 font-medium">Live</span>
        </div>
      </div>
    </div>
  );
}
