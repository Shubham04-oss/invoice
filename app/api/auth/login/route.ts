import { NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validations/auth'
import { comparePassword } from '@/lib/auth/password'
import { signJwt } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { tenant: true },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValidPassword = await comparePassword(
      validatedData.password,
      user.passwordHash
    )
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Generate JWT token
    const token = await signJwt({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
    })
    
    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
        },
      },
      token,
    })
    
    // Set token as HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    return response
    
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
