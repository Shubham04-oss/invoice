import { NextRequest } from 'next/server'
import { verifyJwt, JwtPayload } from './jwt'

export async function getUserFromRequest(request: NextRequest): Promise<JwtPayload | null> {
  // First, try to get user info from middleware headers (for HTTP-only cookie auth)
  const userId = request.headers.get('x-user-id')
  const email = request.headers.get('x-user-email')
  const tenantId = request.headers.get('x-tenant-id')
  
  if (userId && email && tenantId) {
    return { userId, email, tenantId }
  }
  
  // Fallback to Authorization header (for Bearer token auth)
  const authHeader = request.headers.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return await verifyJwt(token)
  }
  
  // Last fallback: try to get token from cookie directly
  const token = request.cookies.get('token')?.value
  if (token) {
    return await verifyJwt(token)
  }
  
  return null
}

export async function requireAuth(request: NextRequest): Promise<JwtPayload> {
  const user = await getUserFromRequest(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}
