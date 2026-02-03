/**
 * NFT Query by Token ID
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  
  const store = loadStore();
  const nft = store[tokenId];
  
  if (!nft) {
    return NextResponse.json(
      { error: 'NFT not found', tokenId },
      { status: 404 }
    );
  }
  
  return NextResponse.json(nft);
}
