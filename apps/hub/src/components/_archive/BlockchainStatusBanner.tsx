'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/contexts/BlockchainContext';

export function BlockchainStatusBanner() {
  const { isConnected, connect } = useBlockchain();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner after a short delay if disconnected (to avoid flash on initial load)
    const timer = setTimeout(() => {
      setShowBanner(!isConnected);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isConnected]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await connect();
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setIsRetrying(false);
    }
  };

  if (isConnected || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="glass-panel border border-yellow-500/30 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-yellow-400 mb-1">
              Blockchain Disconnected
            </h3>
            <p className="text-xs text-gray-300 mb-3">
              Unable to connect to Monad (Pleroma). Some features may be unavailable.
            </p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? 'Connecting...' : 'Retry Connection'}
            </button>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors text-sm"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
