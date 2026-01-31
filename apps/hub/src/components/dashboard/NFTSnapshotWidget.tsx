'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useBlockchain } from '@/contexts/BlockchainContext';

interface NFTAsset {
  id: string;
  name: string;
  thumbnail: string;
  collection?: string;
}

interface BuyOffer {
  id: string;
  assetId: string;
  assetName: string;
  offeredPrice: number;
  offerer: string;
  timestamp: Date;
}

interface NFTStats {
  totalOwned: number;
  totalValue: number;
  pendingOffers: number;
}

export function NFTSnapshotWidget() {
  const { user, isAuthenticated } = useAuth();
  const { isConnected } = useBlockchain();
  const [recentAssets, setRecentAssets] = useState<NFTAsset[]>([]);
  const [pendingOffers, setPendingOffers] = useState<BuyOffer[]>([]);
  const [stats, setStats] = useState<NFTStats>({
    totalOwned: 0,
    totalValue: 0,
    pendingOffers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadNFTData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadNFTData = async () => {
    setLoading(true);
    try {
      // Fetch real NFT data from blockchain
      // TODO: Implement when DRC-369 RPC methods are available
      // For now, show accurate empty state
      const realAssets: NFTAsset[] = [];
      const realOffers: BuyOffer[] = [];

      setRecentAssets(realAssets);
      setPendingOffers(realOffers);
      setStats({
        totalOwned: realAssets.length,
        totalValue: 0,
        pendingOffers: realOffers.length,
      });
    } catch (error) {
      console.error('Failed to load NFT data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-demiurge-gold/20">
        <h3 className="text-lg font-grunge text-demiurge-gold mb-4">🖼️ NFT Collection</h3>
        <p className="text-gray-400 text-sm">Login to view your NFTs</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 border border-demiurge-gold/20 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-demiurge-gold/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-grunge text-demiurge-gold">🖼️ NFT Collection</h3>
          <Link href="/forge" className="text-xs text-demiurge-gold hover:underline">
            The Forge →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-white/5 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex items-center justify-between mb-4 text-sm">
              <div>
                <span className="text-white font-bold">{stats.totalOwned}</span>
                <span className="text-gray-400 ml-1">Assets</span>
              </div>
              <div>
                <span className="text-demiurge-gold font-bold">{stats.totalValue.toLocaleString()}</span>
                <span className="text-gray-400 ml-1">CGT Value</span>
              </div>
            </div>

            {/* Pending Offers Alert */}
            {pendingOffers.length > 0 && (
              <Link
                href="/forge?tab=offers"
                className="block mb-4 p-3 rounded-lg bg-demiurge-gold/10 border border-demiurge-gold/30 hover:bg-demiurge-gold/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {pendingOffers.length} Buy Offer{pendingOffers.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-400">
                        {pendingOffers[0].offeredPrice} CGT for {pendingOffers[0].assetName}
                      </div>
                    </div>
                  </div>
                  <span className="text-demiurge-gold">→</span>
                </div>
              </Link>
            )}

            {/* Asset Grid */}
            {recentAssets.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {recentAssets.slice(0, 6).map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/forge/asset/${asset.id}`}
                    className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-demiurge-gold/20 to-demiurge-violet/20 hover:scale-105 transition-transform relative group"
                  >
                    {asset.thumbnail ? (
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🖼️
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-xs text-white truncate">{asset.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🎨</div>
                <p className="text-gray-400 text-sm mb-2">No NFTs yet</p>
                <Link 
                  href="/forge" 
                  className="text-demiurge-gold text-sm hover:underline"
                >
                  Mint your first NFT →
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/forge"
                className="text-center py-2 bg-gradient-to-r from-demiurge-gold/20 to-demiurge-violet/20 rounded-lg border border-demiurge-gold/30 hover:border-demiurge-gold/50 transition-all text-sm font-medium text-demiurge-gold"
              >
                ⚒️ Mint
              </Link>
              <Link
                href="/marketplace"
                className="text-center py-2 glass-panel rounded-lg border border-white/10 hover:border-white/20 transition-all text-sm font-medium text-gray-300"
              >
                🏪 Market
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
