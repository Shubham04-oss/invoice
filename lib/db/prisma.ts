import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// If we're using PostgreSQL in development, ensure the connection string contains a
// conservative `connection_limit` so the connection pool isn't exhausted during
// local iterative runs / tests. We only mutate the URL for non-production so we
// don't surprise production environments.
function normalizedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url) return undefined

  // Only operate on postgres-style URLs
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    return url
  }

  // If the caller already specified a connection_limit, respect it.
  if (url.includes('connection_limit=')) return url

  // Append connection_limit=5 conservatively. If there are existing query
  // params, use & otherwise start with ?
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}connection_limit=5`
}

const dbUrl = normalizedDatabaseUrl()
export const prisma = global.prisma || new PrismaClient(dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined)
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
