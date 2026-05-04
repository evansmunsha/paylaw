import 'next-auth'

// We are extending the built-in NextAuth types
// to include the user id on the session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
    }
  }
}