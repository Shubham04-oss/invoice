import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
const secret = new TextEncoder().encode(JWT_SECRET)

export interface JwtPayload {
  userId: string
  email: string
  tenantId: string
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      tenantId: payload.tenantId as string,
    }
  } catch (error: any) {
    console.error('[JWT] Verification failed:', error.message)
    return null
  }
}
