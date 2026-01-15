'use client';

import { useEffect, useState } from 'react';
import { useBlockchain } from '@/contexts/BlockchainContext';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

interface TransactionHistoryProps {
  address: string;
}

export function TransactionHistory({ address }: TransactionHistoryProps) {
  const { getApi } = useBlockchain();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [address]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const api = getApi();
      if (!api) {
        // No API connection, return empty
        setTransactions([]);
        return;
      }

      // TODO: Query transaction history from blockchain
      // This would require:
      // 1. Querying events from pallet-cgt for Transferred events
      // 2. Filtering by address (from or to)
      // 3. Formatting transaction data
      
      // For now, return empty array
      // In production, you'd query:
      // const events = await api.query.system.events();
      // Filter for cgt.Transferred events where from/to matches address
      
      setTransactions([]);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCGT = (amount: string): string => {
    const CGT_UNIT = 100_000_000;
    const amountNum = BigInt(amount);
    const whole = amountNum / BigInt(CGT_UNIT);
    const fractional = amountNum % BigInt(CGT_UNIT);
    const fractionalStr = fractional.toString().padStart(8, '0');
    return `${whole}.${fractionalStr}`;
  };

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-8">
        Loading transactions...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No transactions found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.hash}
          className="bg-gray-800/50 border border-gray-700 rounded p-4 hover:border-demiurge-cyan/50 transition-colors"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">
                {tx.from.toLowerCase() === address.toLowerCase() ? 'Sent' : 'Received'}
              </div>
              <div className="font-mono text-xs break-all">
                {tx.from.toLowerCase() === address.toLowerCase() 
                  ? `To: ${formatAddress(tx.to)}`
                  : `From: ${formatAddress(tx.from)}`}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-bold ${
                tx.from.toLowerCase() === address.toLowerCase() 
                  ? 'text-red-400' 
                  : 'text-green-400'
              }`}>
                {tx.from.toLowerCase() === address.toLowerCase() ? '-' : '+'}
                {formatCGT(tx.amount)} CGT
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(tx.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-mono break-all">
            {tx.hash}
          </div>
        </div>
      ))}
    </div>
  );
}
