import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

// Mock data for development
const MOCK_RELEASES = [
  {
    id: 'release_1',
    artistId: 'artist_1',
    artist: {
      id: 'artist_1',
      artistName: 'Neon Dreams',
      primaryGenre: 'Synthwave',
      isVerified: true,
    },
    title: 'Midnight Drive',
    releaseType: 'album',
    coverArt: '',
    genre: 'Synthwave',
    tracks: Array(10).fill(null).map((_, i) => ({
      id: `track_${i}`,
      title: `Track ${i + 1}`,
      duration: 180 + Math.random() * 120,
    })),
    totalPlays: 15420,
    totalCollectors: 89,
    likes: 342,
    isFeatured: true,
    createdAt: new Date('2026-01-15').toISOString(),
  },
  {
    id: 'release_2',
    artistId: 'artist_2',
    artist: {
      id: 'artist_2',
      artistName: 'Crystal Waves',
      primaryGenre: 'Ambient',
      isVerified: false,
    },
    title: 'Ocean Depths',
    releaseType: 'ep',
    coverArt: '',
    genre: 'Ambient',
    tracks: Array(5).fill(null).map((_, i) => ({
      id: `track_${i}`,
      title: `Depth ${i + 1}`,
      duration: 240 + Math.random() * 180,
    })),
    totalPlays: 8750,
    totalCollectors: 45,
    likes: 178,
    isFeatured: false,
    createdAt: new Date('2026-01-20').toISOString(),
  },
  {
    id: 'release_3',
    artistId: 'artist_3',
    artist: {
      id: 'artist_3',
      artistName: 'Digital Prophet',
      primaryGenre: 'Electronic',
      isVerified: true,
    },
    title: 'Code Red',
    releaseType: 'single',
    coverArt: '',
    genre: 'Electronic',
    tracks: [
      { id: 'track_1', title: 'Code Red', duration: 245 },
      { id: 'track_2', title: 'Binary Sunset', duration: 198 },
    ],
    totalPlays: 22100,
    totalCollectors: 156,
    likes: 512,
    isFeatured: true,
    createdAt: new Date('2026-01-22').toISOString(),
  },
];

// GET /api/music/releases - Get all releases or filter by artistId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const genre = searchParams.get('genre');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Try to fetch from backend
    let url = `${QOR_AUTH_URL}/api/v1/music/releases?limit=${limit}&offset=${offset}`;
    if (artistId) url += `&artist_id=${artistId}`;
    if (genre) url += `&genre=${encodeURIComponent(genre)}`;
    if (featured) url += `&featured=true`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Fallback to mock data
    let releases = [...MOCK_RELEASES];
    
    if (artistId) {
      releases = releases.filter(r => r.artistId === artistId);
    }
    if (genre) {
      releases = releases.filter(r => r.genre.toLowerCase() === genre.toLowerCase());
    }
    if (featured === 'true') {
      releases = releases.filter(r => r.isFeatured);
    }

    return NextResponse.json({
      releases: releases.slice(offset, offset + limit),
      total: releases.length,
    });
  } catch (error: any) {
    console.error('Fetch releases error:', error);
    
    // Return mock data on error
    return NextResponse.json({
      releases: MOCK_RELEASES,
      total: MOCK_RELEASES.length,
    });
  }
}

// POST /api/music/releases - Create a new release
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const { title, genre, coverArtUri, tracks } = body;
    if (!title || !genre || !tracks || tracks.length === 0) {
      return NextResponse.json(
        { error: 'Title, genre, and at least one track are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/releases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Mock success for development
        const mockReleaseId = `release_${Date.now()}`;
        return NextResponse.json({
          success: true,
          releaseId: mockReleaseId,
          message: 'Release created successfully (dev mode)',
        });
      }
      
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to create release' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      releaseId: data.release_id || data.id,
      nftId: data.nft_id,
    });
  } catch (error: any) {
    console.error('Create release error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
