import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

// Mock release for development
const MOCK_RELEASE = {
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
  description: 'A journey through neon-lit streets and starlit highways. This album captures the essence of late-night drives and synthwave nostalgia.',
  tracks: [
    { id: 'track_1', trackNumber: 1, title: 'Neon Sunrise', duration: 245, plays: 5420, isExplicit: false },
    { id: 'track_2', trackNumber: 2, title: 'Highway Dreams', duration: 312, plays: 4890, isExplicit: false },
    { id: 'track_3', trackNumber: 3, title: 'Midnight Run', duration: 287, plays: 6102, isExplicit: false },
    { id: 'track_4', trackNumber: 4, title: 'City Lights', duration: 198, plays: 3750, isExplicit: false },
    { id: 'track_5', trackNumber: 5, title: 'Stargazer', duration: 356, plays: 4200, isExplicit: false },
    { id: 'track_6', trackNumber: 6, title: 'Chrome Heart', duration: 234, plays: 3890, isExplicit: false },
    { id: 'track_7', trackNumber: 7, title: 'Electric Soul', duration: 267, plays: 4560, isExplicit: true },
    { id: 'track_8', trackNumber: 8, title: 'Retrowave', duration: 301, plays: 5100, isExplicit: false },
    { id: 'track_9', trackNumber: 9, title: 'Sunset Boulevard', duration: 278, plays: 3200, isExplicit: false },
    { id: 'track_10', trackNumber: 10, title: 'Final Destination', duration: 412, plays: 4680, isExplicit: false },
  ],
  totalPlays: 45792,
  totalCollectors: 89,
  likes: 342,
  isFeatured: true,
  isExplicit: true,
  nftId: 'drc369_release_0x1234567890abcdef',
  metadataUri: 'ipfs://QmXyz123...',
  mintedAt: new Date('2026-01-15').toISOString(),
  mintCost: 75,
  royaltyBps: 1000,
  createdAt: new Date('2026-01-15').toISOString(),
};

// GET /api/music/release/[id] - Get release by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/release/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ release: data });
    }

    // Fallback to mock data for development
    if (id.startsWith('release_')) {
      return NextResponse.json({ release: { ...MOCK_RELEASE, id } });
    }

    return NextResponse.json(
      { error: 'Release not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Fetch release error:', error);
    
    // Return mock data on error for development
    return NextResponse.json({ release: MOCK_RELEASE });
  }
}

// POST /api/music/release/[id]/like - Like a release
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/release/${id}/like`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok && response.status !== 404) {
      return NextResponse.json(
        { error: 'Failed to like release' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Like release error:', error);
    return NextResponse.json({ success: true }); // Mock success
  }
}
