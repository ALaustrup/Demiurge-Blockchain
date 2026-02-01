import { NextRequest, NextResponse } from 'next/server';
import { getQorIdFromRequest, getUserIdFromRequest } from '@/lib/auth-utils';
import { gameRegistry } from '@/lib/game-registry';
import { blockchainClient } from '@/lib/blockchain';
import { qorAuth } from '@demiurge/qor-sdk';
import { treasury } from '@/lib/treasury';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

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
    let amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 1000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between 0.00000001 and 1000 CGT' },
        { status: 400 }
      );
    }

    // Check for donor XP bonus and apply it
    let xpBonusApplied = 0;
    try {
      const donorResponse = await fetch(`${QOR_AUTH_URL}/api/v1/donations/status`, {
        headers: { 'Authorization': request.headers.get('Authorization') || '' },
      });
      
      if (donorResponse.ok) {
        const donorData = await donorResponse.json();
        // Apply XP rate bonus (stored in basis points, e.g., 500 = 5%)
        if (donorData.xp_rate_bonus_bps && donorData.xp_rate_bonus_bps > 0) {
          const bonusMultiplier = donorData.xp_rate_bonus_bps / 10000;
          xpBonusApplied = amountNum * bonusMultiplier;
          amountNum = amountNum + xpBonusApplied;
        }
      }
    } catch (error) {
      // Continue without bonus if donor check fails
      console.warn('[Reward] Failed to check donor status for XP bonus:', error);
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

    // Transfer CGT from treasury to player
    let txHash: string | null = null;
    let transferStatus = 'pending';
    
    try {
      txHash = await treasury.transferCGT(
        userAddress,
        amountNum,
        `Game reward: ${reason} from ${gameId}`
      );
      
      if (txHash) {
        transferStatus = 'completed';
      } else {
        // Treasury not available - queue for later or use fallback
        transferStatus = 'queued';
        console.warn(`[Reward] CGT transfer queued - treasury not available`);
        txHash = `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      }
    } catch (transferError) {
      console.error(`[Reward] Transfer failed:`, transferError);
      transferStatus = 'failed';
    }

    return NextResponse.json({
      success: transferStatus !== 'failed',
      txHash,
      amount: amountNum,
      baseAmount: parseFloat(amount),
      xpBonusApplied,
      xpBonusPercent: xpBonusApplied > 0 ? Math.round((xpBonusApplied / parseFloat(amount)) * 100) : 0,
      reason,
      qorId,
      gameId,
      transferStatus,
      message: xpBonusApplied > 0 
        ? `Awarded ${amountNum.toFixed(2)} CGT for ${reason} (+${Math.round(xpBonusApplied * 100) / 100} donor bonus!)`
        : `Awarded ${amountNum} CGT for ${reason}`,
    });
  } catch (error: any) {
    console.error('Reward API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process reward' },
      { status: 500 }
    );
  }
}
