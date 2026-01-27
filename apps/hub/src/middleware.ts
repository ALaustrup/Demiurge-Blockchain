import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Redirect /portal to / (single dashboard consolidation)
  if (pathname === '/portal' || pathname.startsWith('/portal/')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Admin route protection
  const token = request.cookies.get('qor_token');
  if (pathname.startsWith('/admin') && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Redirect /login to / (AuthGate handles authentication)
  // This prevents logged-in users from seeing login page
  if (pathname === '/login' || pathname === '/register') {
    const hasToken = request.cookies.get('qor_token');
    if (hasToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // For non-authenticated users, redirect to home (AuthGate will show login)
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/register']
}
