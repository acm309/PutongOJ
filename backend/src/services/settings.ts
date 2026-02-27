import Settings from 'src/models/Settings'
import { CacheKey, cacheService } from './cache'

class SettingsService {
  async set<T> (key: string, value: T) {
    await Settings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true },
    )
    await cacheService.remove(CacheKey.settings(key))
  }

  async get<T> (key: string, defaultValue: T): Promise<T>
  async get<T> (key: string, defaultValue: () => T): Promise<T>
  async get<T> (key: string, defaultValue: T | (() => T)) {
    return await cacheService.getOrCreate<T>(
      CacheKey.settings(key),

      async () => {
        const setting = await Settings
          .findOne({ key })
          .lean()
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
}

export const settingsService = new SettingsService()
