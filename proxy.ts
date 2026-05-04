import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = req.nextUrl

  const protectedPaths = [
    '/dashboard',
    '/paylaws',
    '/overtime',
    '/employees',
    '/summary',
  ]

  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  // Not logged in + protected page → send to landing page
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  // Logged in + going to login or landing → send to dashboard
  if ((pathname === '/login' || pathname === '/home') && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/paylaws/:path*',
    '/overtime/:path*',
    '/employees/:path*',
    '/settings/:path*',
    '/summary/:path*',
    '/login',
    '/home',
  ],
}