'use client';

import { useState } from 'react';
import Link from 'next/link';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { useBlockchain } from '@/contexts/BlockchainContext';

/**
 * NFT Portal - Mint and View NFTs
 * From the Monad, all creation emanates. To the Pleroma, all value returns...
 */

export default function NFTPortalPage() {
  const { isConnected } = useBlockchain();
  const [minting, setMinting] = useState(false);

  return (
    <main className="min-h-screen p-8 page-enter">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 ancient-text">
          <h1 className="text-6xl font-grunge grunge-text">
            NFT PORTAL
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto italic">
            Eyes gaze upon you, watching as a warden does his prisoners. Here, creation takes form, 
            and form becomes value. From the Monad, all emanates. To the Pleroma, all returns.
          </p>
        </div>

        {/* Mint NFT Section */}
        <div className="glass-panel p-8 rounded-lg hover-glow cascade-item">
          <h2 className="text-3xl font-bold text-neon-cyan mb-4">Mint NFTs On-Chain</h2>
          <p className="text-gray-400 mb-6 italic">
            The ancient forge awaits. Bring forth your creation, and let it be recorded in the eternal ledger.
          </p>
          
          {!isConnected ? (
            <div className="glass-panel p-6 rounded-lg border border-yellow-500/50">
              <p className="text-yellow-400 mb-4">
                The wardens watch, but you must first connect your QOR ID to proceed.
              </p>
              <Link
                href="/wallet"
                className="neon-button inline-block"
              >
                Connect Wallet
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => alert('DRC-369 NFT minting coming soon! The ancient forge is being prepared...')}
                  className="glass-panel p-6 rounded-lg hover:chroma-glow transition-all cascade-menu-item text-left"
                >
                  <h3 className="text-xl font-bold text-neon-green mb-2">Mint DRC-369 NFT</h3>
                  <p className="text-gray-400 text-sm">
                    Create stateful NFTs that evolve, gain XP, and level up. The ancient power flows through you.
                  </p>
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Coming Soon</span>
                </button>
                <button
                  onClick={() => alert('Game Asset minting coming soon! The forge awaits your creation...')}
                  className="glass-panel p-6 rounded-lg hover:chroma-glow transition-all cascade-menu-item text-left"
                >
                  <h3 className="text-xl font-bold text-neon-magenta mb-2">Mint Game Asset</h3>
                  <p className="text-gray-400 text-sm">
                    Forge items for your games. Cross-game compatibility, true ownership, revenue sharing.
                  </p>
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Coming Soon</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View NFTs Section */}
        <div className="glass-panel p-8 rounded-lg hover-glow cascade-item">
          <h2 className="text-3xl font-bold text-neon-purple mb-4">View Your Collection</h2>
          <p className="text-gray-400 mb-6 italic">
            The ledger reveals all that you have created. Each token tells a story, each asset holds power.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/wallet"
              className="glass-panel p-6 rounded-lg hover:chroma-glow transition-all cascade-menu-item"
            >
              <h3 className="text-lg font-bold text-neon-cyan mb-2">Wallet</h3>
              <p className="text-gray-400 text-sm">
                View all NFTs in your wallet. The balance of creation rests here.
              </p>
            </Link>
            <Link
              href="/profile"
              className="glass-panel p-6 rounded-lg hover:chroma-glow transition-all cascade-menu-item"
            >
              <h3 className="text-lg font-bold text-neon-green mb-2">Profile</h3>
              <p className="text-gray-400 text-sm">
                Your digital identity, your collection, your legacy. All visible here.
              </p>
            </Link>
            <Link
              href="/nft-portal/gallery"
              className="glass-panel p-6 rounded-lg hover:chroma-glow transition-all cascade-menu-item"
            >
              <h3 className="text-lg font-bold text-neon-magenta mb-2">Gallery</h3>
              <p className="text-gray-400 text-sm">
                A curated view of your collection. The finest creations, displayed with honor.
              </p>
            </Link>
          </div>
        </div>

        {/* On-Chain Links */}
        <div className="glass-panel p-8 rounded-lg hover-glow cascade-item">
          <h2 className="text-3xl font-bold text-neon-yellow mb-4">On-Chain Resources</h2>
          <div className="space-y-3">
            <a
              href="https://rpc.demiurge.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-panel p-4 rounded hover:chroma-glow transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-neon-cyan">RPC Endpoint</span>
                <span className="text-gray-400 text-sm">https://rpc.demiurge.cloud →</span>
              </div>
            </a>
            <a
              href="/development"
              className="block glass-panel p-4 rounded hover:chroma-glow transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-neon-green">Developer Documentation</span>
                <span className="text-gray-400 text-sm">View Docs →</span>
              </div>
            </a>
            <a
              href="/analytics"
              className="block glass-panel p-4 rounded hover:chroma-glow transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-neon-purple">Network Analytics</span>
                <span className="text-gray-400 text-sm">View Stats →</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
