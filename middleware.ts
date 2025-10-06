import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from './lib/auth/jwt'

// Define protected routes
const protectedRoutes = ['/dashboard', '/api/invoices']
const authRoutes = ['/auth/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookie or Authorization header
  const token = request.cookies.get('token')?.value || 
    request.headers.get('authorization')?.replace('Bearer ', '')
  
  console.log(`[Middleware] ${pathname} - Token: ${token ? 'Present' : 'Missing'}`)
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // Verify token for protected routes
  if (isProtectedRoute) {
    if (!token) {
      // Redirect to login for page routes, return 401 for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Verify JWT token
    const user = await verifyJwt(token)
    
    if (!user) {
      // Invalid token - redirect to login or return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
      
      // Clear invalid token cookie to avoid redirect loops and send user to login
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
  const response = NextResponse.redirect(loginUrl)
  // expire the token cookie (both httpOnly and non-http variants) to ensure
  // any token stored by client-side code is removed and avoids redirect loops
  response.cookies.set('token', '', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 0 })
  response.cookies.set('token', '', { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 0 })
      return response
    }
    
    // Add user info to request headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.userId)
    response.headers.set('x-user-email', user.email)
    response.headers.set('x-tenant-id', user.tenantId)
    return response
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthRoute && token) {
    const user = await verifyJwt(token)
    console.log(`[Middleware] Auth route check - User verified: ${user ? 'Yes' : 'No'}`)
    if (user) {
      console.log(`[Middleware] Redirecting to /dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      // Token present but invalid: clear both cookie variants so the client isn't stuck in loops
      const response = NextResponse.next()
      response.cookies.set('token', '', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 0 })
      response.cookies.set('token', '', { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 0 })
      return response
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}

