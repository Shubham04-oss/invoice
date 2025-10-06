import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { generatePdfForInvoice } from '@/lib/utils/pdf-generator'

// Helper to convert Prisma Decimal (or other) values to numbers
const toNumber = (v: any) => {
  if (v === null || v === undefined) return v
  if (typeof v === 'number') return v
  if (v && typeof v.toNumber === 'function') return v.toNumber()
  return Number(v)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    // Fetch invoice with items
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
    
    // Normalize Decimal fields to plain numbers for the PDF generator
    const normalizedInvoice = {
      ...invoice,
      subtotal: toNumber((invoice as any).subtotal),
      tax: toNumber((invoice as any).tax),
      total: toNumber((invoice as any).total),
      shippingCharges: toNumber((invoice as any).shippingCharges),
      discountPercent: toNumber((invoice as any).discountPercent),
      items: invoice.items.map((it: any) => ({
        ...it,
        unitPrice: toNumber(it.unitPrice),
        amount: toNumber(it.amount),
        baseAmount: toNumber(it.baseAmount),
        totalAmount: toNumber(it.totalAmount),
        gstPercent: toNumber(it.gstPercent),
        sgstPercent: toNumber(it.sgstPercent),
        cgstPercent: toNumber(it.cgstPercent),
      })),
    }

    // Generate PDF
    const pdfBuffer = await generatePdfForInvoice(normalizedInvoice)
    
    // Return PDF as response (convert Buffer to Uint8Array)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    })
    
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
