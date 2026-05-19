import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Pages foremen are NOT allowed to visit
const ADMIN_ONLY_PATHS = [
  //'/employees',
  '/summary',
  '/settings',
]

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = req.nextUrl

  const protectedPaths = [
    '/dashboard', '/paylaws', '/overtime',
    '/employees', '/summary', '/settings', '/billing',
  ]

  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  // Not logged in + protected page → landing
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  // Logged in + login or home → dashboard
  if ((pathname === '/login' || pathname === '/home') && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  
  if (pathname === '/register' && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Foreman trying to access admin-only page → dashboard
  if (
    token &&
    (token as any).role === 'foreman' &&
    ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))
  ) {
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
    '/summary/:path*',
    '/settings/:path*',
    '/billing',
    '/audit/:path*',
    '/sites/:path*',
    '/notifications/:path*',
    '/login',
    '/home',
    '/register',
    '/pricing',
  ],
}