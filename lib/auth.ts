import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('No account found with that email')
        }

        const match = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!match) {
          throw new Error('Incorrect password')
        }

        return {
          id:      user.id,
          email:   user.email,
          name:    user.name,
          role:    user.role,    // admin or foreman
          site:    user.site,    // foreman's assigned site
          adminId: user.adminId, // which admin they belong to
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id      = user.id
        token.role    = (user as any).role
        token.site    = (user as any).site
        token.adminId = (user as any).adminId
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id      = token.id      as string
        session.user.role    = token.role    as string
        session.user.site    = token.site    as string | null
        session.user.adminId = token.adminId as string | null
      }
      return session
    },
  },

  pages: { signIn: '/login' },
}