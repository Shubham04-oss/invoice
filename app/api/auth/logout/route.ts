import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true })
  
  // Clear the token cookie
  response.cookies.delete('token')
  
  return response
}
