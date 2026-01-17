'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { qorAuth } from '@demiurge/qor-sdk';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { gameRegistry } from '@/lib/game-registry';

interface GameWrapperProps {
  gameId: string;
  gameUrl: string;
}

export function GameWrapper({ gameId, gameUrl }: GameWrapperProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameMetadata, setGameMetadata] = useState<any>(null);
  const { getBalance, getUserAssets } = useBlockchain();

  const handleExit = useCallback(() => {
    if (confirm('Exit game and return to portal?')) {
      router.push('/portal');
    }
  }, [router]);

  const handlePause = useCallback(() => {
    setIsPaused((prev) => {
      const newPaused = !prev;
      // Send pause message to game iframe
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: newPaused ? 'GAME_PAUSE' : 'GAME_RESUME',
        }, '*');
      }
      return newPaused;
    });
  }, []);

  const handleFullscreen = useCallback(async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  useEffect(() => {
    // Fetch game metadata
    const metadata = gameRegistry.getById(gameId);
    setGameMetadata(metadata);

    // Track game start analytics
    startTimeRef.current = Date.now();
    const trackGameStart = async () => {
      try {
        // Send analytics event
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'game_start',
            gameId,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error('Analytics error:', err);
      }
    };
    trackGameStart();

    // Inject HUD script into iframe when it loads
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Handle keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC to exit fullscreen or show exit confirmation
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen();
        } else {
          handleExit();
        }
      }
      // Space to pause/unpause (if game supports it)
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        handlePause();
      }
    };
    window.addEventListener('keydown', handleKeyPress);

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
              // Balance is in smallest units (2 decimals), convert to CGT (100 Sparks = 1 CGT)
              const balance = parseFloat(balanceStr) / 100;
              
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
            // Execute real CGT transaction via API
            const token = qorAuth.getToken();
            if (!token) {
              throw new Error('Not authenticated');
            }

            // Prompt user for wallet password (in production, this would be handled via secure modal)
            // For now, we'll need to handle this via a secure prompt or modal
            const walletPassword = prompt('Enter your wallet password to confirm transaction:');
            if (!walletPassword) {
              throw new Error('Wallet password required');
            }

            const response = await fetch('/api/games/spend', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                amount: amount || 0,
                reason: reason || 'game_purchase',
                walletPassword,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to spend CGT');
            }

            const result = await response.json();
            
            iframe.contentWindow?.postMessage({
              type: 'CGT_SPEND_RESPONSE',
              messageId,
              txHash: result.txHash,
            }, '*');
          } catch (err: any) {
            iframe.contentWindow?.postMessage({
              type: 'CGT_SPEND_RESPONSE',
              messageId,
              error: err.message || 'Failed to spend CGT',
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
              // Fetch actual assets from blockchain (with full metadata)
              const assets = await getUserAssets(address);
              
              // Filter assets by game if gameId is provided
              const gameMetadata = gameRegistry.getById(gameId);
              let filteredAssets = assets;
              
              if (gameMetadata?.nftSupport?.enabled && gameMetadata.nftSupport.assetTypes.length > 0) {
                // Filter assets that match game's supported asset types
                filteredAssets = assets.filter((asset: any) => {
                  // Check if asset type matches game's supported types
                  // This would be determined from asset metadata
                  return true; // For now, return all assets
                });
              }
              
              iframe.contentWindow?.postMessage({
                type: 'USER_ASSETS_RESPONSE',
                messageId,
                assets: filteredAssets,
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
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyPress);
      
      // Track game end analytics
      if (startTimeRef.current) {
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTimeRef.current) / 1000);
        const trackGameEnd = async () => {
          try {
            await fetch('/api/analytics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'game_end',
                gameId,
                duration,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (err) {
            console.error('Analytics error:', err);
          }
        };
        trackGameEnd();
      }
    };
  }, [gameId, gameUrl, isFullscreen, handleExit, handlePause]);

  return (
    <div className="fixed inset-0 z-40 bg-black">
      {/* Game Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-start">
        <div className="flex gap-2">
          <button
            onClick={handleExit}
            className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all text-sm"
          >
            ← Exit
          </button>
          {gameMetadata && (
            <div className="glass-panel px-4 py-2 rounded-lg text-sm">
              <span className="text-demiurge-cyan font-semibold">{gameMetadata.title}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handlePause}
            className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all text-sm"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            onClick={handleFullscreen}
            className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all text-sm"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⤓ Exit FS' : '⤢ Fullscreen'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all text-sm"
          >
            ⚙ Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-50 glass-panel p-6 rounded-lg min-w-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-demiurge-cyan">Game Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            {gameMetadata && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Game Info</div>
                <div className="text-sm text-white">
                  <div>Version: {gameMetadata.version}</div>
                  {gameMetadata.author && <div>Author: {gameMetadata.author}</div>}
                </div>
              </div>
            )}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPaused}
                  onChange={(e) => setIsPaused(e.target.checked)}
                />
                Pause Game
              </label>
            </div>
            <button
              onClick={handleExit}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded transition-colors text-sm"
            >
              Exit Game
            </button>
          </div>
        </div>
      )}
      
      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-45 bg-black/80 flex items-center justify-center">
          <div className="glass-panel p-8 rounded-lg text-center">
            <div className="text-4xl mb-4">⏸</div>
            <div className="text-2xl font-bold text-demiurge-cyan mb-2">Game Paused</div>
            <button
              onClick={handlePause}
              className="glass-panel px-6 py-2 rounded-lg hover:chroma-glow transition-all mt-4"
            >
              Resume
            </button>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="glass-panel p-8 rounded-lg">
            <div className="text-demiurge-cyan text-xl mb-2">Loading game...</div>
            {gameMetadata && (
              <div className="text-sm text-gray-400">{gameMetadata.title}</div>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="glass-panel p-8 rounded-lg border border-red-500">
            <div className="text-red-400 text-xl mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={gameUrl}
        className={`w-full h-full border-0 ${isPaused ? 'pointer-events-none' : ''}`}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        style={{ opacity: isPaused ? 0.5 : 1 }}
      />
    </div>
  );
}
