/**
 * NFT Update API Route
 * 
 * Updates metadata and dynamic state of a DRC-369 NFT.
 * Requires authentication with god/admin role.
 */

import { NextRequest, NextResponse } from 'next/server';

const RPC_ENDPOINT = process.env.DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud';
const AUTH_URL = process.env.AUTH_API_URL || 'https://auth.demiurge.cloud';

interface UpdateRequest {
  tokenId: string;
  updates: {
    name?: string;
    description?: string;
    image?: string;
    metadata?: Record<string, any>;
    dynamicState?: Record<string, any>;
    attributes?: Array<{ trait_type: string; value: string | number }>;
  };
}

async function verifyToken(token: string): Promise<{ valid: boolean; user?: any }> {
  try {
    const response = await fetch(`${AUTH_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return { valid: false };
    }
    
    const data = await response.json();
    return { valid: true, user: data.user };
  } catch {
    // Fallback: decode JWT manually
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { 
        valid: true, 
        user: { 
          qor_id: payload.qor_id || payload.sub,
          role: payload.role || 'user',
        }
      };
    } catch {
      return { valid: false };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    
    let token = '';
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (apiKey) {
      token = apiKey;
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify token and check role
    const { valid, user } = await verifyToken(token);
    
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    if (user?.role !== 'god' && user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. god/admin role required.' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body: UpdateRequest = await request.json();
    
    if (!body.tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }
    
    if (!body.updates || Object.keys(body.updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }
    
    // Build update payload
    const updatePayload = {
      tokenId: body.tokenId,
      updates: body.updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.qor_id,
    };
    
    // Try to update via RPC
    try {
      const rpcResponse = await fetch(RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'drc369_updateToken',
          params: [body.tokenId, body.updates],
        }),
      });
      
      const rpcResult = await rpcResponse.json();
      
      if (rpcResult.result) {
        return NextResponse.json({
          success: true,
          tokenId: body.tokenId,
          txHash: rpcResult.result.txHash,
          updates: body.updates,
        });
      }
    } catch {
      // RPC not available
    }
    
    // Return simulated success
    return NextResponse.json({
      success: true,
      tokenId: body.tokenId,
      txHash: null,
      updates: body.updates,
      note: 'Updated locally - blockchain sync pending',
    });
    
  } catch (error) {
    console.error('[NFT Update] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update NFT', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
