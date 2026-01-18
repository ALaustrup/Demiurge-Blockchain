'use client';

import { useState, useEffect } from 'react';
import { demiurgeRpc, TransactionInfo } from '@/lib/demiurge-rpc';
import { useBlockchain } from '@/contexts/BlockchainContext';

interface TransactionStatusProps {
  transactionHash: string;
  onFinalized?: () => void;
  onError?: (error: Error) => void;
}

export function TransactionStatus({ transactionHash, onFinalized, onError }: TransactionStatusProps) {
  const { getBlockNumber } = useBlockchain();
  const [transaction, setTransaction] = useState<TransactionInfo | null>(null);
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [confirmations, setConfirmations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalized, setFinalized] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;
    let startTime = Date.now();

    const checkTransaction = async () => {
      try {
        // Get current block number
        const blockNum = await getBlockNumber();
        setCurrentBlock(blockNum);

        // Get transaction
        const tx = await demiurgeRpc.getTransaction(transactionHash);
        
        if (tx) {
          setTransaction(tx);
          setLoading(false);
          
          // Calculate confirmations (assuming transaction is in a block)
          // For now, we'll estimate based on status
          if (tx.status === 'finalized') {
            setFinalized(true);
            setConfirmations(2); // Finalized = 2+ confirmations
            if (onFinalized) {
              onFinalized();
            }
            clearInterval(interval);
            clearInterval(timeInterval);
          } else if (tx.status === 'inBlock') {
            setConfirmations(1);
          }

          // Update elapsed time
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        } else {
          // Transaction not found yet, keep polling
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      } catch (err: any) {
        console.error('Failed to check transaction:', err);
        setError(err.message || 'Failed to check transaction status');
        setLoading(false);
        if (onError) {
          onError(err);
        }
        clearInterval(interval);
        clearInterval(timeInterval);
      }
    };

    // Initial check
    checkTransaction();

    // Poll every 1 second for real-time updates
    interval = setInterval(checkTransaction, 1000);
    
    // Update elapsed time every second
    timeInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (interval) clearInterval(interval);
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [transactionHash, getBlockNumber, onFinalized, onError]);

  const getStatusColor = () => {
    if (error || transaction?.status === 'failed') return 'text-red-400';
    if (finalized || transaction?.status === 'finalized') return 'text-green-400';
    if (transaction?.status === 'inBlock') return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getStatusIcon = () => {
    if (error || transaction?.status === 'failed') return '❌';
    if (finalized || transaction?.status === 'finalized') return '✅';
    if (transaction?.status === 'inBlock') return '⏳';
    return '🔄';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (transaction?.status === 'failed') return 'Failed';
    if (finalized || transaction?.status === 'finalized') return 'Finalized';
    if (transaction?.status === 'inBlock') return 'In Block';
    return 'Pending';
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <div className="glass-panel rounded-lg p-4 border border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getStatusIcon()}</span>
            <h3 className="text-lg font-bold text-white">Transaction Status</h3>
          </div>
          <div className="text-sm text-gray-400 font-mono">
            {formatHash(transactionHash)}
          </div>
        </div>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {loading && !transaction && (
        <div className="space-y-2">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {transaction && (
        <div className="space-y-3">
          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">From</div>
              <div className="text-white font-mono text-xs break-all">
                {transaction.from.slice(0, 16)}...
              </div>
            </div>
            {transaction.to && (
              <div>
                <div className="text-gray-400">To</div>
                <div className="text-white font-mono text-xs break-all">
                  {transaction.to.slice(0, 16)}...
                </div>
              </div>
            )}
            {transaction.amount && (
              <div>
                <div className="text-gray-400">Amount</div>
                <div className="text-white font-medium">
                  {(Number(transaction.amount) / 100).toLocaleString()} CGT
                </div>
              </div>
            )}
            <div>
              <div className="text-gray-400">Nonce</div>
              <div className="text-white font-mono">{transaction.nonce}</div>
            </div>
          </div>

          {/* Finality Indicator */}
          {finalized && (
            <div className="bg-green-900/30 border border-green-500/50 rounded p-3">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-400 font-medium">
                  Transaction finalized in {elapsedTime}s
                </span>
              </div>
              <div className="text-xs text-green-300 mt-1">
                Finality achieved - Transaction is immutable
              </div>
            </div>
          )}

          {/* Block Confirmation Countdown */}
          {!finalized && transaction.status === 'inBlock' && (
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⏳</span>
                <span className="text-yellow-400 font-medium">
                  Waiting for finality ({confirmations}/2 confirmations)
                </span>
              </div>
              <div className="text-xs text-yellow-300 mt-1">
                Estimated time: {Math.max(0, 2 - elapsedTime)}s
              </div>
            </div>
          )}

          {/* Pending Status */}
          {!transaction && !error && (
            <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 animate-spin">🔄</span>
                <span className="text-blue-400 font-medium">
                  Transaction submitted - Waiting for block inclusion
                </span>
              </div>
              <div className="text-xs text-blue-300 mt-1">
                Elapsed: {elapsedTime}s
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded p-3">
              <div className="flex items-center gap-2">
                <span className="text-red-400">❌</span>
                <span className="text-red-400 font-medium">Error</span>
              </div>
              <div className="text-xs text-red-300 mt-1">{error}</div>
            </div>
          )}

          {/* Progress Indicator */}
          {!finalized && !error && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Finality Progress</span>
                <span>{confirmations}/2</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    confirmations >= 2
                      ? 'bg-green-500'
                      : confirmations >= 1
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${(confirmations / 2) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Copy Hash Button */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={() => navigator.clipboard.writeText(transactionHash)}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Copy Transaction Hash
        </button>
      </div>
    </div>
  );
}
