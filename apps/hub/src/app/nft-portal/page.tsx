'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * NFT Portal Integration
 * 
 * Embeds the DRC-369 NFT Portal application into the Demiurge ecosystem.
 * The portal runs as a separate React Router app and is embedded here.
 */
export default function NFTPortalPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NFT Portal runs on port 4001 in development (4000 may be in use)
  // In production, this should be configured via environment variable
  const portalUrl = process.env.NEXT_PUBLIC_NFT_PORTAL_URL || 'http://localhost:4001';

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setLoading(false);
    };

    const handleError = () => {
      setError('Failed to load NFT Portal');
      setLoading(false);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-demiurge-dark">
      {/* Exit Button */}
      <div className="absolute top-4 left-4 z-50">
        <a
          href="/"
          className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to Hub</span>
        </a>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="glass-panel p-8 rounded-lg">
            <div className="text-demiurge-cyan text-xl mb-2">Loading NFT Portal...</div>
            <div className="text-gray-400 text-sm">Connecting to DRC-369 system</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="glass-panel p-8 rounded-lg border border-red-500">
            <div className="text-red-400 text-xl mb-2">{error}</div>
            <div className="text-gray-400 text-sm mt-2">
              Make sure the NFT Portal is running on {portalUrl}
            </div>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block glass-panel px-4 py-2 rounded hover:chroma-glow transition-all"
            >
              Open in New Tab
            </a>
          </div>
        </div>
      )}

      {/* Embedded Portal */}
      <iframe
        ref={iframeRef}
        src={portalUrl}
        className="w-full h-full border-0"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
        title="DRC-369 NFT Portal"
      />
    </div>
  );
}
