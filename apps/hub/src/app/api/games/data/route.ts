import { NextRequest, NextResponse } from 'next/server';
import { getQorIdFromRequest } from '@/lib/auth-utils';

/**
 * Game Data Storage API
 * 
 * Stores player game data (scores, upgrades, skins, etc.) associated with QOR ID.
 * In the future, this will be moved on-chain via a game data pallet.
 */

interface GameData {
  gameId: string;
  qorId: string;
  score: number;
  highScore: number;
  cgtEarned: number;
  upgrades: Record<string, number>;
  ownedSkins: string[];
  equippedSkin: string;
  killCount: number;
  playTime: number;
  lastPlayed: string;
}

// In-memory storage (replace with database in production)
const gameDataStore = new Map<string, GameData>();

/**
 * GET /api/games/data?gameId=galaga-creator
 * Get player's game data
 */
export async function GET(request: NextRequest) {
  try {
    // Extract QOR ID from auth token
    const qorId = await getQorIdFromRequest(request);
    if (!qorId) {
      return NextResponse.json(
        { error: 'Unauthorized - QOR ID required' },
        { status: 401 }
      );
    }
    
    const gameId = request.nextUrl.searchParams.get('gameId');
    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId parameter required' },
        { status: 400 }
      );
    }

    const key = `${qorId}:${gameId}`;
    const data = gameDataStore.get(key);

    if (!data) {
      return NextResponse.json({
        gameId,
        qorId,
        score: 0,
        highScore: 0,
        cgtEarned: 0,
        upgrades: {},
        ownedSkins: [],
        equippedSkin: 'player',
        killCount: 0,
        playTime: 0,
        lastPlayed: new Date().toISOString(),
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch game data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/games/data
 * Save player's game data
 */
export async function POST(request: NextRequest) {
  try {
    // Extract QOR ID from auth token
    const qorId = await getQorIdFromRequest(request);
    if (!qorId) {
      return NextResponse.json(
        { error: 'Unauthorized - QOR ID required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { gameId, score, highScore, cgtEarned, upgrades, ownedSkins, equippedSkin, killCount, playTime } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    const key = `${qorId}:${gameId}`;
    const existing = gameDataStore.get(key) || {
      gameId,
      qorId,
      score: 0,
      highScore: 0,
      cgtEarned: 0,
      upgrades: {},
      ownedSkins: [],
      equippedSkin: 'player',
      killCount: 0,
      playTime: 0,
      lastPlayed: new Date().toISOString(),
    };

    const updated: GameData = {
      ...existing,
      score: score ?? existing.score,
      highScore: Math.max(existing.highScore, highScore ?? existing.highScore),
      cgtEarned: cgtEarned ?? existing.cgtEarned,
      upgrades: upgrades ?? existing.upgrades,
      ownedSkins: ownedSkins ?? existing.ownedSkins,
      equippedSkin: equippedSkin ?? existing.equippedSkin,
      killCount: killCount ?? existing.killCount,
      playTime: playTime ?? existing.playTime,
      lastPlayed: new Date().toISOString(),
    };

    gameDataStore.set(key, updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save game data' },
      { status: 500 }
    );
  }
}
