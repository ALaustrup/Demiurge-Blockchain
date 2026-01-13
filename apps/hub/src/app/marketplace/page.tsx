'use client';

import { useState, useEffect } from 'react';
import { MarketplaceListing } from '@/components/marketplace/MarketplaceListing';
import type { Drc369Asset } from '@demiurge/qor-sdk';

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'virtual' | 'real-world' | 'hybrid'>('all');

  useEffect(() => {
    // TODO: Fetch marketplace listings from API/blockchain
    // For now, use mock data
    setListings([
      {
        asset: {
          uuid: '0x7a1f9c3e8b2d4f6a5e9c1d8b7a3f2e5c',
          name: 'Chronos Glaive',
          creatorQorId: 'creator#1234',
          assetType: 'virtual',
          xpLevel: 50,
          metadata: {
            description: 'A weapon that bends time around its blade.',
            image: '/placeholder-nft.jpg',
            attributes: {
              attack: 150,
              speed: 1.8,
              rarity: 'legendary',
            },
          },
          isSoulbound: false,
          owner: 'seller#5678',
          mintedAt: Date.now(),
        },
        sellerLevel: 65,
        sellerQorId: 'seller#5678',
        price: 5000,
      },
    ]);
    setLoading(false);
  }, []);

  const handlePurchase = async (assetUuid: string) => {
    // TODO: Implement purchase logic
    console.log('Purchasing asset:', assetUuid);
    // This would:
    // 1. Check user balance
    // 2. Execute CGT transfer
    // 3. Transfer NFT ownership
    // 4. Update UI
  };

  const filteredListings = listings.filter((listing) => {
    if (filter === 'all') return true;
    return listing.asset.assetType === filter;
  });

  return (
    <main className="min-h-screen p-8 pt-28">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-gold bg-clip-text text-transparent">
          Marketplace
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Trade District - Buy and sell DRC-369 assets
        </p>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          {(['all', 'virtual', 'real-world', 'hybrid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`glass-panel px-6 py-2 rounded-lg transition-all ${
                filter === f
                  ? 'chroma-glow border border-demiurge-cyan'
                  : 'hover:chroma-glow'
              }`}
            >
              {f === 'all' ? 'All Assets' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-demiurge-cyan">Loading marketplace...</div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400">No listings found</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <MarketplaceListing
                key={listing.asset.uuid}
                asset={listing.asset}
                sellerLevel={listing.sellerLevel}
                sellerQorId={listing.sellerQorId}
                price={listing.price}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
