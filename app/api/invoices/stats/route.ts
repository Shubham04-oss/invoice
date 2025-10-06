import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    console.log('[Stats API] Headers:', {
      userId: request.headers.get('x-user-id'),
      email: request.headers.get('x-user-email'),
      tenantId: request.headers.get('x-tenant-id'),
    });
    
    const user = await requireAuth(request);

    // Get user's tenant
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { tenantId: true }
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get invoice counts by status
    const now = new Date();
    
    const [total, pending, paid, overdue] = await Promise.all([
      prisma.invoice.count({
        where: { tenantId: userRecord.tenantId }
      }),
      prisma.invoice.count({
        where: {
          tenantId: userRecord.tenantId,
          status: 'pending'
        }
      }),
      prisma.invoice.count({
        where: {
          tenantId: userRecord.tenantId,
          status: 'paid'
        }
      }),
      prisma.invoice.count({
        where: {
          tenantId: userRecord.tenantId,
          status: 'overdue',
          dueDate: { lt: now }
        }
      })
    ]);

    // Get total amounts
    const amounts = await prisma.invoice.aggregate({
      where: { tenantId: userRecord.tenantId },
      _sum: {
        total: true
      }
    });

    const paidAmounts = await prisma.invoice.aggregate({
      where: {
        tenantId: userRecord.tenantId,
        status: 'paid'
      },
      _sum: {
        total: true
      }
    });

    const pendingAmounts = await prisma.invoice.aggregate({
      where: {
        tenantId: userRecord.tenantId,
        status: 'pending'
      },
      _sum: {
        total: true
      }
    });

    return NextResponse.json({
      stats: {
        counts: {
          total,
          pending,
          paid,
          overdue
        },
        amounts: {
          total: amounts._sum.total || 0,
          paid: paidAmounts._sum.total || 0,
          pending: pendingAmounts._sum.total || 0
        }
      }
    });
  } catch (error: any) {
    // Handle authorization errors
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice statistics' },
      { status: 500 }
    );
  }
}
