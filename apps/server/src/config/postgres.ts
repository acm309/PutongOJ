import type { PrismaClient as DatabaseClient } from '@putongoj/db'
import config from '.'

let databasePromise: Promise<DatabaseClient> | undefined

export function getDatabase (): Promise<DatabaseClient> {
  databasePromise ??= import('@putongoj/db')
    .then(({ createDatabaseClient }) => createDatabaseClient(config.databaseURL))
  return databasePromise
}
