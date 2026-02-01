import { NextRequest, NextResponse } from 'next/server';
import { gameRegistry, GameCategory, GameEngine } from '@/lib/game-registry';

/**
 * POST /api/games/submit
 * Submit a new game for approval
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // TODO: Validate token with qor-auth service
    // For now, decode JWT to get user info
    let userId = 'unknown';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.qor_id || payload.sub || 'unknown';
    } catch (e) {
      console.warn('Failed to decode token:', e);
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.gameUrl || !body.category || !body.engine) {
      return NextResponse.json(
        { error: 'Missing required fields: title, gameUrl, category, engine' },
        { status: 400 }
      );
    }

    // Validate stake amount
    const stake = body.stake || 0;
    const MINIMUM_STAKE = 1000;
    if (stake < MINIMUM_STAKE) {
      return NextResponse.json(
        { error: `Minimum stake is ${MINIMUM_STAKE} CGT` },
        { status: 400 }
      );
    }

    // Generate game ID from title
    const gameId = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    // Check if game already exists
    if (gameRegistry.getById(gameId)) {
      return NextResponse.json(
        { error: 'A game with this name already exists' },
        { status: 400 }
      );
    }

    // TODO: Actual stake transaction
    // For now, just register the game as pending approval

    // Register game (pending approval)
    gameRegistry.register({
      id: gameId,
      title: body.title,
      description: body.description || '',
      thumbnail: body.thumbnailUrl || `/games/${gameId}/thumb.jpg`,
      entryPoint: 'index.html',
      version: '1.0.0',
      author: userId,
      tags: [],
      category: body.category as GameCategory,
      engine: body.engine as GameEngine,
      engineVersion: body.engineVersion,
      rewards: [],
      minLevel: 1,
    });

    return NextResponse.json({ 
      message: 'Game submitted successfully',
      gameId,
      status: 'pending_approval',
      stake,
    });
  } catch (error: any) {
    console.error('[API /games/submit] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit game' },
      { status: 500 }
    );
  }
}
