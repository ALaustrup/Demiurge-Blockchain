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
    if (address) {
      loadTransactions();
    }
  }, [address, getApi]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const api = getApi();
      if (!api || !api.isConnected) {
        // No API connection, return empty
        setTransactions([]);
        return;
      }

      // Query recent blocks for transaction history
      // We'll query the last 50 blocks for CGT transfer events
      const blockCount = 50;
      const latestBlock = await api.rpc.chain.getBlock();
      const latestBlockNumber = latestBlock.block.header.number.toNumber();
      
      const transactions: Transaction[] = [];
      const startBlock = Math.max(0, latestBlockNumber - blockCount);

      // Query events from recent blocks
      for (let blockNum = latestBlockNumber; blockNum >= startBlock && transactions.length < 50; blockNum--) {
        try {
          const blockHash = await api.rpc.chain.getBlockHash(blockNum);
          const events = await api.query.system.events.at(blockHash);

          if (!events || events.length === 0) continue;

          // Process events in this block
          for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const { event: eventRecord } = event;

            // Check if this is a balances transfer event
            // pallet-cgt uses pallet-balances internally for transfers
            if (api.events.balances?.Transfer?.is(eventRecord)) {
              try {
                const transferEvent = api.events.balances.Transfer.decode(eventRecord);
                
                // Extract from, to, amount from the event
                const from = transferEvent[0]?.toString();
                const to = transferEvent[1]?.toString();
                const amount = transferEvent[2]?.toString();

                // Filter by address (from or to)
                if (
                  from?.toLowerCase() === address.toLowerCase() ||
                  to?.toLowerCase() === address.toLowerCase()
                ) {
                  // Get block timestamp
                  let timestamp = Date.now();
                  try {
                    const timestampData = await api.query.timestamp.now.at(blockHash);
                    if (timestampData) {
                      timestamp = timestampData.toNumber();
                    }
                  } catch {
                    // Fallback: estimate timestamp based on block number
                    // Assuming 6 second block time
                    const blocksAgo = latestBlockNumber - blockNum;
                    timestamp = Date.now() - (blocksAgo * 6000);
                  }

                  transactions.push({
                    hash: blockHash.toString(),
                    from: from || '',
                    to: to || '',
                    amount: amount || '0',
                    timestamp: timestamp,
                    status: 'confirmed', // Transactions in blocks are confirmed
                  });
                }
              } catch (decodeError) {
                // Skip events that fail to decode
                console.warn('Failed to decode transfer event:', decodeError);
                continue;
              }
            }
          }
        } catch (error) {
          // Skip blocks that fail to query
          console.warn(`Failed to query block ${blockNum}:`, error);
          continue;
        }
      }

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(transactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-demiurge-cyan">Recent Transactions</h3>
        <button
          onClick={() => loadTransactions()}
          disabled={isLoading}
          className="glass-panel px-3 py-1 rounded text-sm hover:chroma-glow transition-all disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading && transactions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          Loading transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No transactions found
          <div className="text-xs text-gray-500 mt-2">
            Transactions will appear here once you send or receive CGT
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
