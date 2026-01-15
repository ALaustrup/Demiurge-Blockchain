'use client';

import { useEffect, useRef, useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { useBlockchain } from '@/contexts/BlockchainContext';

interface GameWrapperProps {
  gameId: string;
  gameUrl: string;
}

export function GameWrapper({ gameId, gameUrl }: GameWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getBalance, getUserAssets } = useBlockchain();

  useEffect(() => {
    // Inject HUD script into iframe when it loads
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow) return;

        // Inject HUD script
        const script = iframeWindow.document.createElement('script');
        script.src = '/inject-hud.js';
        script.onload = () => {
          setLoading(false);
        };
        script.onerror = () => {
          setError('Failed to load HUD script');
          setLoading(false);
        };
        iframeWindow.document.head.appendChild(script);
      } catch (err) {
        // Cross-origin restrictions - this is expected for external games
        setLoading(false);
      }
    };

    // Set up message handler for game ↔ hub communication
    const handleMessage = async (event: MessageEvent) => {
      // Security: Verify origin (in production, check against allowed origins)
      if (!event.origin.includes(window.location.hostname)) {
        return;
      }

      const { type, messageId, amount, reason, value, source } = event.data;

      switch (type) {
        case 'GET_BALANCE':
          try {
            // Get user's on-chain address
            const profile = await qorAuth.getProfile();
            const address = profile.on_chain?.address || profile.on_chain_address;
            
            if (address) {
              // Fetch actual balance from blockchain
              const balanceStr = await getBalance(address);
              // Balance is in smallest units (8 decimals), convert to CGT
              const balance = parseFloat(balanceStr) / 100_000_000;
              
              iframe.contentWindow?.postMessage({
                type: 'CGT_BALANCE_RESPONSE',
                messageId,
                balance: balanceStr, // Send raw balance string (smallest units)
              }, '*');
            } else {
              iframe.contentWindow?.postMessage({
                type: 'CGT_BALANCE_RESPONSE',
                messageId,
                balance: '0',
              }, '*');
            }
          } catch (err) {
            iframe.contentWindow?.postMessage({
              type: 'CGT_BALANCE_RESPONSE',
              messageId,
              error: 'Failed to fetch balance',
            }, '*');
          }
          break;

        case 'SPEND_CGT':
          try {
            // TODO: Execute actual CGT transaction
            const txHash = `0x${Math.random().toString(16).substr(2, 64)}`; // Mock
            iframe.contentWindow?.postMessage({
              type: 'CGT_SPEND_RESPONSE',
              messageId,
              txHash,
            }, '*');
          } catch (err) {
            iframe.contentWindow?.postMessage({
              type: 'CGT_SPEND_RESPONSE',
              messageId,
              error: 'Failed to spend CGT',
            }, '*');
          }
          break;

        case 'UPDATE_XP':
          try {
            // TODO: Update XP on blockchain/QOR ID
            console.log(`Updating XP: +${value} from ${source}`);
            // This would call the QOR Auth API to update XP
          } catch (err) {
            console.error('Failed to update XP:', err);
          }
          break;

        case 'GET_USER_ASSETS':
          try {
            // Get user's on-chain address
            const profile = await qorAuth.getProfile();
            const address = profile.on_chain?.address || profile.on_chain_address;
            
            if (address) {
              // Fetch actual assets from blockchain
              const assets = await getUserAssets(address);
              
              iframe.contentWindow?.postMessage({
                type: 'USER_ASSETS_RESPONSE',
                messageId,
                assets,
              }, '*');
            } else {
              iframe.contentWindow?.postMessage({
                type: 'USER_ASSETS_RESPONSE',
                messageId,
                assets: [],
              }, '*');
            }
          } catch (err) {
            iframe.contentWindow?.postMessage({
              type: 'USER_ASSETS_RESPONSE',
              messageId,
              error: 'Failed to fetch assets',
            }, '*');
          }
          break;

        case 'GET_QOR_ID':
          try {
            const profile = await qorAuth.getProfile();
            iframe.contentWindow?.postMessage({
              type: 'QOR_ID_RESPONSE',
              messageId,
              qorId: profile.qor_id,
            }, '*');
          } catch (err) {
            iframe.contentWindow?.postMessage({
              type: 'QOR_ID_RESPONSE',
              messageId,
              error: 'Failed to fetch QOR ID',
            }, '*');
          }
          break;

        case 'OPEN_SOCIAL':
          window.location.href = '/social';
          break;
      }
    };

    iframe.addEventListener('load', handleLoad);
    window.addEventListener('message', handleMessage);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      window.removeEventListener('message', handleMessage);
    };
  }, [gameId, gameUrl]);

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <div className="absolute top-4 left-4 z-50">
        <a
          href="/portal"
          className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all"
        >
          ← Exit Game
        </a>
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass-panel p-8 rounded-lg">
            <div className="text-demiurge-cyan text-xl">Loading game...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass-panel p-8 rounded-lg border border-red-500">
            <div className="text-red-400 text-xl">{error}</div>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={gameUrl}
        className="w-full h-full border-0"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}
