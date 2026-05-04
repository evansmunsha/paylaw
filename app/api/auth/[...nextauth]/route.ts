import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// This one file handles ALL auth routes automatically:
// /api/auth/signin
// /api/auth/signout
// /api/auth/session
// etc.
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }