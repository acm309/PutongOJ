import { settingsService } from '../services/settings.ts'
import { createLogger } from '../utils/logger.ts'

const logger = createLogger('server.migrations')

interface MigrationTask {
  key: string
  description: string
  run: () => Promise<void>
}

/**
 * Database migrations that must run once against existing deployments.
 *
 * Every migration in this list is expected to have been applied in production,
 * so the list is intentionally empty. Tasks must not depend on the current
 * Mongoose model definitions — use the raw driver (`mongoose.connection.collection`)
 * so later model changes do not silently alter historical migrations.
 *
 * To add one, append *and never reorder or rename existing keys*:
 *   { key: '<yyyyMMdd>-<slug>', description: '<what it does>', run: migrateX }
 */
const migrationTasks: MigrationTask[] = []

export async function runMigrations () {
  const applied = await settingsService.getMigrationsApplied()
  const pending = migrationTasks.filter(task => !applied.has(task.key))

  if (pending.length === 0) {
    logger.info('No pending DB migrations')
    return
  }

  logger.info(`Running ${pending.length} DB migration(s)`)
  for (const task of pending) {
    logger.info(`Running migration <${task.key}>: ${task.description}`)
    await task.run()
    applied.add(task.key)
    await settingsService.setMigrationsApplied(applied)
    logger.info(`Migration <${task.key}> completed`)
  }

  logger.info('DB migrations completed')
}
