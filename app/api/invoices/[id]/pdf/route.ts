import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Placeholder: would return a PDF stream
  return NextResponse.json({ pdfFor: params.id })
}
