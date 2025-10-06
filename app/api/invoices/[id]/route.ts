import { NextRequest, NextResponse } from 'next/server'
import { updateInvoiceSchema } from '@/lib/validations/invoice'
import { requireAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    // Get invoice by ID for the user's tenant
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        items: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ invoice })
    
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    // Validate input
    const validatedData = updateInvoiceSchema.parse(body)
    
    // Check if invoice exists and belongs to user's tenant
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        items: true,
      },
    })
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }
    
    // Calculate amounts if items are provided
    // Convert Prisma Decimal fields to numbers before arithmetic
    let subtotal: number = Number((existingInvoice as any).subtotal ?? 0)
    let total: number = Number((existingInvoice as any).total ?? 0)
    let itemsToUpdate = undefined

    if (validatedData.items && validatedData.items.length > 0) {
      subtotal = 0
      itemsToUpdate = validatedData.items.map((item: any) => {
        const amount = Number(item.quantity) * Number(item.unitPrice)
        subtotal += amount
        return { ...item, amount }
      })
      total = subtotal + Number(validatedData.tax ?? Number((existingInvoice as any).tax ?? 0))
    } else if (validatedData.tax !== undefined) {
      total = Number((existingInvoice as any).subtotal ?? 0) + Number(validatedData.tax)
    }
    
    // Build update data
    const updateData: any = {
      ...validatedData,
    }
    
    if (itemsToUpdate) {
  updateData.subtotal = subtotal
  updateData.total = total
      updateData.items = {
        deleteMany: {},
        create: itemsToUpdate,
      }
    } else if (validatedData.tax !== undefined) {
      updateData.total = total
    }
    
    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: true,
      },
    })
    
    return NextResponse.json({ invoice: updatedInvoice })
    
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    // Check if invoice exists and belongs to user's tenant
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }
    
    // Delete invoice (items will be cascade deleted)
    await prisma.invoice.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
