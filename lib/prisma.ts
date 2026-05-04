import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

// This stops Next.js from creating too many
// database connections during development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Build the connection string from your .env file
const connectionString = `${process.env.DATABASE_URL}`

// The adapter is what actually connects Prisma to PostgreSQL
const adapter = new PrismaPg({ connectionString })

// Create the Prisma Client using the adapter
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}