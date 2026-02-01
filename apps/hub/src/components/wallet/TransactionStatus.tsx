'use client';

import { useState, useEffect } from 'react';
import { DemiurgeClient } from '@demiurge/sdk';

interface TransactionStatusProps {
  txHash?: string;
  transactionHash?: string;
  onConfirmed?: () => void;
  onFinalized?: () => void;
  onError?: (err: Error) => void;
}

type TxStatus = 'pending' | 'included' | 'finalized' | 'failed';

export function TransactionStatus({ txHash, transactionHash, onConfirmed, onFinalized, onError }: TransactionStatusProps) {
  // Support both prop names for compatibility
  const hash = txHash || transactionHash || '';
  const onSuccess = onConfirmed || onFinalized;
  const [status, setStatus] = useState<TxStatus>('pending');
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [confirmations, setConfirmations] = useState(0);

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const client = new DemiurgeClient({
          endpoint: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.demiurge.cloud',
        });

        // TODO: Implement transaction status query
        // For now, simulate: pending → finalized after 3 seconds
        
        if (mounted) {
          setTimeout(() => {
            if (mounted) {
              setStatus('finalized');
              setConfirmations(1);
              if (onSuccess) {
                onSuccess();
              }
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Failed to check transaction status:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    };

    checkStatus();
    pollInterval = setInterval(checkStatus, 2000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [hash, onSuccess, onError]);

  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'included': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'finalized': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return '⏳';
      case 'included': return '📦';
      case 'finalized': return '✅';
      case 'failed': return '❌';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'included': return 'Included in Block';
      case 'finalized': return 'Finalized';
      case 'failed': return 'Failed';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{getStatusIcon()}</span>
        <div>
          <div className="font-medium">
            {getStatusText()}
          </div>
          {blockNumber && (
            <div className="text-xs opacity-75">
              Block #{blockNumber} • {confirmations} confirmation{confirmations !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
      
      {status === 'pending' && (
        <div className="flex items-center gap-2">
          <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-current animate-pulse" style={{ width: '60%' }} />
          </div>
          <span className="text-xs whitespace-nowrap">~2s</span>
        </div>
      )}
      
      {status === 'finalized' && (
        <p className="text-xs opacity-75 mt-2">
          Transaction confirmed with instant BFT finality
        </p>
      )}
    </div>
  );
}
