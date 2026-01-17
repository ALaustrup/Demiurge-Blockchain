'use client';

import { useEffect, useState } from 'react';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { blockchainClient } from '@/lib/blockchain';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  blockNumber: number;
}

interface TransactionHistoryProps {
  address: string;
}

export function TransactionHistory({ address }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getTransactions } = useBlockchain(); 

  useEffect(() => {
    const fetchHistory = async () => {
      if (!address || !getTransactions) return;

      setLoading(true);
      setError(null);
      try {
        // This function doesn't exist yet, we will create it.
        const history = await getTransactions(address); 
        setTransactions(history);
        
      } catch (err) {
        setError('Failed to fetch transaction history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [address, getTransactions]);

  if (loading) {
    return <div className="text-center text-gray-400">Loading history...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (transactions.length === 0) {
    return <div className="text-center text-gray-400">No transactions found.</div>;
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.hash} className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center">
          <div>
            <div className="font-mono text-sm text-white">
              {tx.from === address ? `To: ${formatAddress(tx.to)}` : `From: ${formatAddress(tx.from)}`}
            </div>
            <div className="text-xs text-gray-500">Block #{tx.blockNumber}</div>
          </div>
          <div className={`font-bold ${tx.from === address ? 'text-red-400' : 'text-green-400'}`}>
            {tx.from === address ? '-' : '+'} {blockchainClient.formatCGTBalance(tx.amount)} CGT
          </div>
        </div>
      ))}
    </div>
  );
}