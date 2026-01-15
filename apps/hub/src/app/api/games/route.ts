import { NextRequest, NextResponse } from 'next/server';
import { gameRegistry } from '@/lib/game-registry';

/**
 * GET /api/games
 * List all registered games
 */
export async function GET(request: NextRequest) {
  try {
    const games = gameRegistry.getAll();
    console.log(`[API /games] Returning ${games.length} games:`, games.map(g => g.id));
    return NextResponse.json({ games });
  } catch (error: any) {
    console.error('[API /games] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/games
 * Register a new game (admin only - TODO: add auth)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.title || !body.entryPoint) {
      return NextResponse.json(
        { error: 'Missing required fields: id, title, entryPoint' },
        { status: 400 }
      );
    }

    // Register game
    gameRegistry.register({
      id: body.id,
      title: body.title,
      description: body.description || '',
      thumbnail: body.thumbnail || `/games/${body.id}/thumb.jpg`,
      entryPoint: body.entryPoint,
      version: body.version || '1.0.0',
      author: body.author,
      tags: body.tags || [],
      minLevel: body.minLevel,
    });

    return NextResponse.json({ 
      message: 'Game registered successfully',
      game: gameRegistry.getById(body.id),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to register game' },
      { status: 500 }
    );
  }
}
