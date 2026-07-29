import type { Prisma } from '@putongoj/db'
import { getDatabase } from '../config/postgres'
import { CacheKey, cacheService } from './cache'

export class SettingsKey {
  static migrationsApplied = 'migrationsApplied'
  static avatarPresets = 'avatarPresets'
}

class SettingsService {
  async set<T> (key: string, value: T) {
    const database = await getDatabase()
    await database.setting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    })
    await cacheService.remove(CacheKey.settings(key))
  }

  async get<T> (key: string, defaultValue: T): Promise<T>
  async get<T> (key: string, defaultValue: () => T): Promise<T>
  async get<T> (key: string, defaultValue: T | (() => T)) {
    return await cacheService.getOrCreate<T>(
      CacheKey.settings(key),

      async () => {
        const database = await getDatabase()
        const setting = await database.setting.findUnique({ where: { key } })
        if (!setting) {
          if (typeof defaultValue === 'function') {
            return (defaultValue as () => T)()
          }
          return defaultValue
        }

        return setting.value as T
      },
    )
  }

  public async getMigrationsApplied () {
    const migrations = await this.get<string[]>(SettingsKey.migrationsApplied, [])
    return new Set(migrations)
  }

  public async setMigrationsApplied (migrations: Set<string>) {
    await this.set(SettingsKey.migrationsApplied, [ ...migrations ])
  }

  public async getAvatarPresets () {
    return await this.get<string[]>(SettingsKey.avatarPresets, [])
  }

  public async setAvatarPresets (avatarPresets: string[]) {
    await this.set(SettingsKey.avatarPresets, avatarPresets)
  }
}

export const settingsService = new SettingsService()
