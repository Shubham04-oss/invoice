import { NextRequest, NextResponse } from 'next/server'
import { createInvoiceSchema } from '@/lib/validations/invoice'
import { requireAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Get all invoices for the user's tenant
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: user.tenantId },
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
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ data: invoices })
    
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    // Validate input
    const validatedData = createInvoiceSchema.parse(body)
    
    // Calculate amounts
    let subtotal = 0
    const items = validatedData.items.map(item => {
      const amount = item.quantity * item.unitPrice
      subtotal += amount
      return { ...item, amount }
    })
    
    const total = subtotal + validatedData.tax
    
    // Check if invoice number already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: validatedData.invoiceNumber },
    })
    
    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 400 }
      )
    }
    
    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: validatedData.invoiceNumber,
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail,
        clientAddress: validatedData.clientAddress,
        issueDate: new Date(validatedData.issueDate),
        dueDate: new Date(validatedData.dueDate),
        subtotal,
        tax: validatedData.tax,
        total,
        notes: validatedData.notes,
        status: validatedData.status,
        userId: user.userId,
        tenantId: user.tenantId,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    })
    
    return NextResponse.json(invoice, { status: 201 })
    
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
    
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
