import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Where NextAuth stores the session
  session: {
    strategy: 'jwt', // JWT = a token saved in the browser, no extra DB table needed
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        // 1. Check that email and password were actually sent
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // 2. Look for the user in the database by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        // 3. If no user found, stop here
        if (!user) {
          throw new Error('No account found with that email')
        }

        // 4. Compare the password they typed with the hashed one in the DB
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        // 5. If password is wrong, stop here
        if (!passwordMatch) {
          throw new Error('Incorrect password')
        }

        // 6. Everything is correct — return the user
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],

  callbacks: {
    // This runs when the JWT token is created or updated
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id // save the user id inside the token
      }
      return token
    },

    // This runs when a page asks "who is logged in?"
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string // put the user id on the session
      }
      return session
    },
  },

  pages: {
    signIn: '/login', // when someone is not logged in, send them here
  },
}