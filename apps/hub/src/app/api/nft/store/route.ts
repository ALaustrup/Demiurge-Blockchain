/**
 * NFT On-Chain Storage API Route
 * 
 * Stores and retrieves NFT data. This acts as the off-chain index
 * that mirrors on-chain state for fast queries.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Simple file-based storage for NFTs (in production, use PostgreSQL/Redis)
const NFT_STORE_PATH = process.env.NFT_STORE_PATH || '/tmp/demiurge-nfts.json';

interface StoredNFT {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  owner: string;
  soulbound: boolean;
  dynamic: boolean;
  attributes: Array<{ trait_type: string; value: string | number }>;
  dynamicState: Record<string, any> | null;
  metadata: Record<string, any>;
  createdAt: string;
  createdBy: string;
  txHash: string | null;
  onChain: boolean;
}

function loadStore(): Record<string, StoredNFT> {
  try {
    if (fs.existsSync(NFT_STORE_PATH)) {
      const data = fs.readFileSync(NFT_STORE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load NFT store:', e);
  }
  return {};
}

function saveStore(store: Record<string, StoredNFT>): void {
  try {
    fs.writeFileSync(NFT_STORE_PATH, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error('Failed to save NFT store:', e);
  }
}

// GET - Retrieve NFT(s)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');
  const owner = searchParams.get('owner');
  
  const store = loadStore();
  
  if (tokenId) {
    const nft = store[tokenId];
    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
    }
    return NextResponse.json(nft);
  }
  
  if (owner) {
    const nfts = Object.values(store).filter(n => n.owner === owner);
    return NextResponse.json({ nfts, count: nfts.length });
  }
  
  // Return all NFTs
  const nfts = Object.values(store);
  return NextResponse.json({
    nfts,
    count: nfts.length,
    totalSupply: nfts.length,
  });
}

// POST - Store a new NFT (called after mint)
export async function POST(request: NextRequest) {
  try {
    const nft: StoredNFT = await request.json();
    
    if (!nft.id) {
      return NextResponse.json({ error: 'NFT id is required' }, { status: 400 });
    }
    
    const store = loadStore();
    
    // Check if already exists
    if (store[nft.id]) {
      return NextResponse.json({ error: 'NFT already exists' }, { status: 409 });
    }
    
    // Store the NFT
    store[nft.id] = {
      ...nft,
      onChain: true, // Mark as indexed
    };
    
    saveStore(store);
    
    return NextResponse.json({
      success: true,
      tokenId: nft.id,
      stored: true,
    });
  } catch (error) {
    console.error('[NFT Store] Error:', error);
    return NextResponse.json(
      { error: 'Failed to store NFT' },
      { status: 500 }
    );
  }
}
