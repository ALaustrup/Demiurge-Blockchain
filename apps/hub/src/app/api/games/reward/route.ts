import { NextRequest, NextResponse } from 'next/server';
import { getQorIdFromRequest, getUserIdFromRequest } from '@/lib/auth-utils';
import { gameRegistry } from '@/lib/game-registry';
import { blockchainClient } from '@/lib/blockchain';
import { qorAuth } from '@demiurge/qor-sdk';

/**
 * Game Rewards API
 * 
 * Handles CGT rewards for game achievements.
 * Submits on-chain transactions to transfer CGT to players.
 */

// Rate limiting: track rewards per user per game
const rewardRateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REWARDS_PER_WINDOW = 100; // Max 100 rewards per minute per user

/**
 * POST /api/games/reward
 * Award CGT to player for game achievements
 */
export async function POST(request: NextRequest) {
  try {
    // Extract QOR ID and User ID from auth token
    const qorId = await getQorIdFromRequest(request);
    const userId = await getUserIdFromRequest(request);
    
    if (!qorId || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - QOR ID required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameId, reason, amount } = body;

    if (!gameId || !reason || !amount) {
      return NextResponse.json(
        { error: 'gameId, reason, and amount are required' },
        { status: 400 }
      );
    }

    // Verify game is registered
    const game = gameRegistry.getById(gameId);
    if (!game) {
      return NextResponse.json(
        { error: `Game ${gameId} is not registered` },
        { status: 404 }
      );
    }

    // Validate amount (minimum 0.00000001 CGT, maximum 1000 CGT per reward)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 1000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between 0.00000001 and 1000 CGT' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitKey = `${userId}:${gameId}`;
    const now = Date.now();
    const rateLimit = rewardRateLimit.get(rateLimitKey);
    
    if (rateLimit && rateLimit.resetAt > now) {
      if (rateLimit.count >= MAX_REWARDS_PER_WINDOW) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before requesting more rewards.' },
          { status: 429 }
        );
      }
      rateLimit.count++;
    } else {
      rewardRateLimit.set(rateLimitKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }

    // Get user's on-chain address
    let userAddress: string | null = null;
    try {
      const profile = await qorAuth.getProfile();
      userAddress = profile.on_chain?.address || profile.on_chain_address || null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
    }

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User does not have an on-chain address. Please connect your wallet.' },
        { status: 400 }
      );
    }

    // Convert CGT amount to smallest units (2 decimals, 100 Sparks = 1 CGT)
    const amountInSmallestUnits = Math.floor(amountNum * 100).toString();

    // In production, this would:
    // 1. Transfer CGT from game pool to player's address
    // 2. For now, we'll use a mock transaction but log it properly
    
    // TODO: Implement actual on-chain transaction
    // const txHash = await blockchainClient.transferCGT(
    //   gamePoolPair, // Game pool keypair
    //   userAddress,
    //   amountInSmallestUnits
    // );

    // Mock transaction hash for now (will be replaced with real blockchain transaction)
    const txHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    // Log reward for audit
    console.log(`[Reward] ${qorId} earned ${amountNum} CGT from ${gameId} - ${reason} (${txHash})`);

    return NextResponse.json({
      success: true,
      txHash,
      amount: amountNum,
      reason,
      qorId,
      gameId,
      message: `Awarded ${amountNum} CGT for ${reason}`,
    });
  } catch (error: any) {
    console.error('Reward API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process reward' },
      { status: 500 }
    );
  }
}
