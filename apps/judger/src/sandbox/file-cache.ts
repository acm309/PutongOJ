import type { Logger } from '../logger.ts'
import type { PreparedFile } from './types.ts'
import { createLogger } from '../logger.ts'

export interface FileCacheClient {
  deleteFile: (fileId: string) => Promise<boolean>
}

export interface FileCacheOptions {
  expire?: number
  recycleGap?: number
}

export class FileCache {
  private readonly client: FileCacheClient
  private readonly expire: number
  private readonly recycleGap: number
  private readonly files = new Map<string, PreparedFile>()
  private readonly lastAccess = new Map<string, number>()
  private readonly cleanupTasks = new Set<Promise<unknown>>()
  private readonly logger: Logger
  private recycleTimer?: NodeJS.Timeout
  private closed = false

  constructor (
    client: FileCacheClient,
    options: FileCacheOptions = {},
  ) {
    this.client = client
    this.expire = options.expire ?? 60 * 60
    this.recycleGap = options.recycleGap ?? 60
    this.logger = createLogger('judger.file-cache')
  }

  private now (): number {
    return performance.now() / 1000
  }

  private trackCleanup (promise: Promise<unknown>): void {
    this.cleanupTasks.add(promise)
    void promise
      .catch((error) => {
        this.logger.warn('Failed to clean up sandbox file:', error)
      })
      .finally(() => {
        this.cleanupTasks.delete(promise)
      })
  }

  private scheduleRecycle (): void {
    if (this.closed || this.recycleTimer) {
      return
    }

    this.recycleTimer = setTimeout(() => {
      this.recycleTimer = undefined
      void this.recycle()
    }, Math.max(this.recycleGap, 0) * 1000)
    this.recycleTimer.unref()
  }

  async get (identifier: string): Promise<PreparedFile | undefined> {
    const file = this.files.get(identifier)
    if (file !== undefined) {
      this.lastAccess.set(identifier, this.now())
      this.logger.debug(`Accessed file '${identifier}'`)
    } else {
      this.logger.debug(`File '${identifier}' not found in cache`)
    }
    return file
  }

  async set (identifier: string, file: PreparedFile): Promise<void> {
    const previous = this.files.get(identifier)
    if (previous !== undefined) {
      this.logger.debug(`Updating existing file '${identifier}' in cache`)
      this.trackCleanup(this.client.deleteFile(previous.fileId))
    } else {
      this.logger.debug(`Adding new file '${identifier}' to cache`)
    }

    this.files.set(identifier, file)
    this.lastAccess.set(identifier, this.now())
    this.scheduleRecycle()
  }

  private async recycle (): Promise<void> {
    if (this.closed) {
      return
    }

    const currentTime = this.now()
    for (const [ identifier, lastAccess ] of this.lastAccess) {
      if (currentTime - lastAccess <= this.expire) {
        continue
      }

      const file = this.files.get(identifier)
      if (file) {
        this.logger.debug(`Recycling expired file '${identifier}'`)
        this.trackCleanup(this.client.deleteFile(file.fileId))
      }
      this.files.delete(identifier)
      this.lastAccess.delete(identifier)
    }

    this.scheduleRecycle()
  }

  async close (): Promise<void> {
    if (this.closed) {
      return
    }

    this.closed = true
    if (this.recycleTimer) {
      clearTimeout(this.recycleTimer)
      this.recycleTimer = undefined
    }

    for (const file of this.files.values()) {
      this.trackCleanup(this.client.deleteFile(file.fileId))
    }
    this.files.clear()
    this.lastAccess.clear()

    await Promise.allSettled([ ...this.cleanupTasks ])
    this.logger.debug('File cache closed')
  }
}
