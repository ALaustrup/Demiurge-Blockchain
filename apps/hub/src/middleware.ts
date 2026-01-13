import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('qor_token')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal')
  
  // Redirect to login if accessing protected routes without token
  if ((isAdminRoute || isPortalRoute) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*']
}
