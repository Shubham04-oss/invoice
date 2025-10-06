import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'

// Use Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Fetch full user details from database
    const userDetails = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
      }
    })
    
    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: userDetails.id,
        email: userDetails.email,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        tenantId: userDetails.tenantId,
      }
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}
