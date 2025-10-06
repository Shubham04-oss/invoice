import { NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validations/auth'
import { hashPassword } from '@/lib/auth/password'
import { signJwt } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    console.log('[Register API] Incoming request')
    try {
      // Log headers summary
      const hdrs: Record<string,string> = {}
      for (const [k,v] of (request.headers as any).entries()) hdrs[k]=String(v)
      console.log('[Register API] headers:', JSON.stringify(hdrs))
    } catch (e) {
      console.log('[Register API] headers: <unavailable>')
    }
    const body = await request.json()
    console.log('[Register API] body keys:', Object.keys(body || {}))
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })
    
    if (existingUser) {
      console.log('[Register API] existing user found for email:', validatedData.email)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    // Check if tenant exists or create new one
    let tenant = await prisma.tenant.findFirst({
      where: { name: validatedData.tenantName },
    })
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: validatedData.tenantName },
      })
    }
    
    // Hash password
    const passwordHash = await hashPassword(validatedData.password)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        tenantId: tenant.id,
      },
    })
    
    // Generate JWT token
    const token = await signJwt({
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
    })
    
    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: tenant.id,
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
      },
      token,
    }, { status: 201 })
    
    // Set token as HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
  console.log('[Register API] user created:', user.id)
    return response  } catch (error: any) {
  console.error('Registration error:', error)
    
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
