'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletWidget, NFTSnapshotWidget, OnChainFeedWidget, GameActivityWidget } from '@/components/dashboard';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-grunge bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-2">
            Welcome to Demiurge
          </h1>
          <p className="text-gray-400 font-body">
            {user ? `Logged in as ${user.qor_id}` : 'The Sovereign Creative Substrate'}
          </p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Wallet */}
          <WalletWidget />
          
          {/* NFT Collection */}
          <NFTSnapshotWidget />
          
          {/* Chain Activity */}
          <OnChainFeedWidget />
          
          {/* Game Activity */}
          <GameActivityWidget />
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/social"
            className="glass-panel rounded-xl p-6 hover:border-neon-cyan/50 transition-all group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🌐</div>
            <h3 className="font-grunge text-white mb-1">VYB Social</h3>
            <p className="text-xs text-gray-400">Connect with creators</p>
          </Link>

          <Link
            href="/forge"
            className="glass-panel rounded-xl p-6 hover:border-demiurge-gold/50 transition-all group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">⚒️</div>
            <h3 className="font-grunge text-white mb-1">The Forge</h3>
            <p className="text-xs text-gray-400">Mint & manage NFTs</p>
          </Link>

          <Link
            href="/agents"
            className="glass-panel rounded-xl p-6 hover:border-neon-purple/50 transition-all group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🤖</div>
            <h3 className="font-grunge text-white mb-1">AI Agents</h3>
            <p className="text-xs text-gray-400">Deploy autonomous agents</p>
          </Link>

          <Link
            href="/validators"
            className="glass-panel rounded-xl p-6 hover:border-green-400/50 transition-all group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🏛️</div>
            <h3 className="font-grunge text-white mb-1">Validators</h3>
            <p className="text-xs text-gray-400">Stake & earn rewards</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
