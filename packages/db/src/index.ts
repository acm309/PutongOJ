import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/client/client.js'

export { PrismaClient } from './generated/client/client.js'
export * from './generated/client/client.js'

/**
 * Construct a Prisma client for a PostgreSQL connection string.
 *
 * A factory is used instead of a process-global singleton so applications,
 * operational CLIs, and tests can control their own lifecycle explicitly.
 */
export function createDatabaseClient (connectionString: string) {
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}
