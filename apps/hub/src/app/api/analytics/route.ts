import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/analytics
 * Track game analytics events
 * 
 * In production, this would send to an analytics service (e.g., PostHog, Mixpanel, or custom DB)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.event || !body.gameId) {
      return NextResponse.json(
        { error: 'Missing required fields: event, gameId' },
        { status: 400 }
      );
    }

    // Log analytics event (in production, send to analytics service)
    console.log('[Analytics]', {
      event: body.event,
      gameId: body.gameId,
      duration: body.duration,
      timestamp: body.timestamp || new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // TODO: Store in database or send to analytics service
    // For now, just log and return success

    return NextResponse.json({ 
      success: true,
      message: 'Analytics event tracked',
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track analytics' },
      { status: 500 }
    );
  }
}
