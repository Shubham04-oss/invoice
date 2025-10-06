import { NextResponse } from 'next/server'

export async function middleware(req: Request) {
  // placeholder: allow all for now
  return NextResponse.next()
}
