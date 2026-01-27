import { NextRequest, NextResponse } from 'next/server';

const QOR_AUTH_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

// GET /api/music/artist/[id] - Get artist profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await fetch(`${QOR_AUTH_URL}/api/v1/music/artist/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Return mock data for development
        return NextResponse.json({
          artist: {
            id,
            artistName: 'Demo Artist',
            primaryGenre: 'Electronic',
            genres: ['Electronic', 'Ambient'],
            bio: 'A demo artist profile for development.',
            isVerified: false,
            releaseCount: 0,
            totalPlays: 0,
            totalCollectors: 0,
            followers: 0,
            socialLinks: {},
            createdAt: new Date().toISOString(),
          },
        });
      }
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ artist: data });
  } catch (error: any) {
    console.error('Fetch artist error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
