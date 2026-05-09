import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:      string
      email:   string
      name?:   string | null
      role:    string        // "admin" or "foreman"
      site:    string | null // foreman's site
      adminId: string | null // which admin they belong to
    }
  }
}