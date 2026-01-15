import { NextRequest, NextResponse } from 'next/server';

/**
 * Game Rewards API
 * 
 * Handles CGT rewards for game achievements.
 * In production, this will submit on-chain transactions.
 */

/**
 * POST /api/games/reward
 * Award CGT to player for game achievements
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameId, reason, amount, qorId } = body;

    if (!gameId || !reason || !amount) {
      return NextResponse.json(
        { error: 'gameId, reason, and amount are required' },
        { status: 400 }
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

    // TODO: In production, this will:
    // 1. Verify the game is registered and authorized
    // 2. Check rate limits (prevent abuse)
    // 3. Submit on-chain transaction to transfer CGT from game pool to player
    // 4. Log the reward in audit log
    
    // For now, return a placeholder transaction hash
    // In production, this would be the actual blockchain transaction hash
    const txHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    return NextResponse.json({
      success: true,
      txHash,
      amount: amountNum,
      reason,
      message: `Awarded ${amountNum} CGT for ${reason}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process reward' },
      { status: 500 }
    );
  }
}
